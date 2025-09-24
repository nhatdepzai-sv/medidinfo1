
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

  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await storage.getUser(decoded.userId);
      
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email
      };
    } catch (error) {
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
  });
}
