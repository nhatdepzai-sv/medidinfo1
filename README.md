# Medication Identification App

A modern, bilingual web application that helps users identify medications through photo capture using OCR (Optical Character Recognition) or manual text search. The app provides detailed medication information including dosage, warnings, and primary uses in both English and Vietnamese.

## 🌟 Features

### Core Functionality
- **Photo-based Identification**: Use your camera to take a picture of medication labels and get instant identification using advanced OCR technology
- **Manual Search**: Search for medications by typing the name or active ingredient
- **Bilingual Support**: Complete interface and medication database in both English and Vietnamese
- **Search History**: Track your previous searches for easy reference
- **Detailed Information**: Get comprehensive medication details including:
  - Generic and brand names
  - Primary uses and indications
  - Adult dosage recommendations
  - Maximum dosage warnings
  - Safety warnings and precautions

### User Experience
- **Mobile-First Design**: Optimized for smartphones with touch-friendly interfaces
- **Camera Integration**: Seamless photo capture with real-time preview
- **Dark/Light Theme**: Automatic theme switching based on user preference
- **Responsive Layout**: Works perfectly on all device sizes
- **Fast Performance**: Built with modern tools for optimal speed

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe component development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive, utility-first styling
- **shadcn/ui** for accessible, pre-built UI components
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Framer Motion** for smooth animations

### Backend
- **Express.js** with TypeScript for API server
- **PostgreSQL** database with **Drizzle ORM** for type-safe database operations
- **Tesseract.js** for OCR text extraction from images
- **Multer** for handling file uploads
- **OpenFDA API** integration for medication data validation

### Development Tools
- **TypeScript** for type safety across the entire application
- **ESBuild** for fast production builds
- **Drizzle Kit** for database migrations
- **Zod** for runtime type validation

## 📁 Project Structure

```
medication-app/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (theme, language)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/           # Utility functions and configurations
│   │   ├── pages/         # Main application pages
│   │   └── main.tsx       # Application entry point
│   └── index.html         # HTML template
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data persistence layer
│   └── *-database.ts     # Medication databases
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema and validation
└── attached_assets/     # Static assets and uploads
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Camera-enabled device (for photo identification)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd medication-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Push the database schema
   npm run db:push
   ```

4. **Environment Setup**
   Create a `.env` file with:
   ```bash
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=development
   PORT=5000
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open `http://localhost:5000` in your browser

## 📱 Usage

### Photo Identification
1. Navigate to the home page
2. Tap the camera button to access the camera interface
3. Point your camera at the medication label
4. Take a clear photo with good lighting
5. Wait for OCR processing and identification results

### Manual Search
1. Use the search bar on the home page
2. Type the medication name (in English or Vietnamese)
3. Select from the search suggestions
4. View detailed medication information

### Search History
1. Go to the History page from the bottom navigation
2. View all your previous searches
3. Tap on any item to view details again

### Language Switching
1. Use the language switcher in the header
2. Toggle between English and Vietnamese
3. All content will update automatically

## 🔌 API Endpoints

### Medication Identification
```http
POST /api/identify-drug
Content-Type: multipart/form-data

# Upload an image file for OCR processing
# Returns: Medication identification results
```

### Manual Search
```http
GET /api/search-medications?q={query}

# Search for medications by name or ingredient
# Returns: Array of matching medications
```

### Search History
```http
GET /api/search-history
# Get user's search history

POST /api/search-history
# Add a search to history
```

### Translation
```http
POST /api/translate
# Translate medication information between languages
```

## 🗄️ Database Schema

### Users Table
- `id`: Primary key (UUID)
- `username`: Unique username
- `password`: Hashed password

### Medications Table
- `id`: Primary key (UUID)
- `name` / `nameVi`: Medication names in both languages
- `genericName` / `genericNameVi`: Generic names
- `category` / `categoryVi`: Medication categories
- `primaryUse` / `primaryUseVi`: Primary medical uses
- `adultDosage` / `adultDosageVi`: Dosage instructions
- `maxDosage` / `maxDosageVi`: Maximum dosage warnings
- `warnings` / `warningsVi`: Safety warnings arrays

### Search History Table
- `id`: Primary key (UUID)
- `userId`: User reference
- `medicationId`: Medication reference
- `searchQuery`: Original search terms
- `searchMethod`: 'photo' or 'manual'
- `createdAt`: Timestamp

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Apply database schema changes

### Key Features for Developers

#### OCR Processing
The app uses Tesseract.js with optimized settings for medication label recognition:
- Character whitelist for medical text
- Preprocessing for better accuracy
- Confidence threshold validation

#### Bilingual Architecture
- Context-based language switching
- Separate database fields for each language
- Automatic translation fallbacks

#### Mobile-First Design
- Touch-optimized interfaces
- Camera integration
- Responsive breakpoints
- Performance optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tesseract.js** for OCR functionality
- **OpenFDA** for medication data validation
- **shadcn/ui** for beautiful, accessible components
- **Radix UI** for primitive component foundation

## ⚠️ Important Notes

- This application is for informational purposes only
- Always consult healthcare professionals for medical advice
- OCR accuracy may vary based on image quality and lighting
- Ensure proper lighting and focus when taking medication photos
- Keep medication information up to date by checking with official sources

---

Built with ❤️ using modern web technologies for better healthcare accessibility.