
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export class AuthService {
  static async register(userData: z.infer<typeof registerSchema>): Promise<{ user: AuthUser; token: string }> {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = await storage.createUser({
      username: userData.username,
      password: hashedPassword,
      email: userData.email
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    };
  }

  static async registerAdmin(userData: z.infer<typeof registerSchema>): Promise<{ user: AuthUser; token: string }> {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create admin user
    const user = await storage.createUser({
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
      role: 'admin'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    };
  }

  static async login(loginData: z.infer<typeof loginSchema>): Promise<{ user: AuthUser; token: string }> {
    // Find user
    const user = await storage.getUserByUsername(loginData.username);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    };
  }

  static async loginAsGuest(): Promise<{ user: AuthUser; token: string }> {
    // Generate a unique guest ID
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a guest user object (not stored in database)
    const guestUser: AuthUser = {
      id: guestId,
      username: 'Guest User',
      email: 'guest@drugscanner.app'
    };

    // Generate JWT token for guest
    const token = jwt.sign(
      { userId: guestId, username: 'Guest User', isGuest: true },
      JWT_SECRET,
      { expiresIn: "24h" } // Shorter expiry for guest sessions
    );

    return {
      user: guestUser,
      token
    };
  }

  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Handle guest users
      if (decoded.isGuest) {
        return {
          id: decoded.userId,
          username: decoded.username,
          email: 'guest@drugscanner.app'
        };
      }
      
      try {
        const user = await storage.getUser(decoded.userId);
        
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email
        };
      } catch (dbError) {
        console.warn('Database error during token verification:', dbError);
        // For guest users or when database is down, allow continued access
        if (decoded.userId && decoded.username) {
          return {
            id: decoded.userId,
            username: decoded.username,
            email: 'fallback@drugscanner.app'
          };
        }
        return null;
      }
    } catch (error) {
      console.warn('Token verification failed:', error);
      return null;
    }
  }
}

export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }

    try {
      // Handle guest users
      if (decoded.isGuest) {
        req.user = {
          id: decoded.userId,
          username: decoded.username,
          email: 'guest@drugscanner.app'
        };
        return next();
      }

      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(403).json({ success: false, message: 'User not found' });
      }

      req.user = {
        id: user.id,
        username: user.username,
        email: user.email
      };
      next();
    } catch (dbError) {
      console.warn('Database error during authentication:', dbError);
      // Fallback for when database is unavailable
      if (decoded.userId && decoded.username) {
        req.user = {
          id: decoded.userId,
          username: decoded.username,
          email: 'fallback@drugscanner.app'
        };
        return next();
      }
      return res.status(500).json({ success: false, message: 'Authentication service temporarily unavailable' });
    }
  });
}
