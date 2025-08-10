# Overview

This is a medication identification web application that allows users to identify drugs through photo capture using OCR (Optical Character Recognition) or manual text search. The app provides detailed medication information including dosage, warnings, and primary uses. It features a mobile-first design with camera integration and search history tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (August 2025)

✓ Added comprehensive Vietnamese language support with bilingual UI
✓ Expanded medication database to 20+ common medications with Vietnamese translations
✓ Implemented language context provider with automatic language detection
✓ Added language switcher component in header
✓ Updated all user-facing text to support both English and Vietnamese
✓ Enhanced medication search to work with both English and Vietnamese names
✓ All error messages, notifications, and interface text now support Vietnamese

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern component-based UI using functional components and hooks
- **Vite**: Fast development server and build tool with hot module replacement
- **Wouter**: Lightweight client-side routing for navigation between pages
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Pre-built accessible component library built on Radix UI primitives
- **TanStack Query**: Server state management for API calls and caching
- **Mobile-first design**: Optimized for mobile devices with touch-friendly interfaces

## Backend Architecture
- **Express.js**: Node.js web framework handling API routes and middleware
- **TypeScript**: Type-safe server-side development
- **RESTful API design**: Clean endpoint structure for medication data and search operations
- **Multer**: Middleware for handling multipart/form-data for image uploads
- **In-memory storage**: Simple storage implementation for development (can be extended to use databases)

## Database Schema
- **Users table**: Basic user authentication with username/password
- **Medications table**: Comprehensive drug information with bilingual support including:
  - English and Vietnamese names (name, nameVi)
  - Generic names in both languages (genericName, genericNameVi)
  - Categories and descriptions (category, categoryVi)
  - Usage information (primaryUse, primaryUseVi)
  - Dosage instructions (adultDosage, adultDosageVi, maxDosage, maxDosageVi)
  - Safety warnings in both languages (warnings, warningsVi)
- **Search History table**: Tracks user searches for analytics and personalization
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect support
- **Shared schema**: Common TypeScript types used across frontend and backend

## OCR and Image Processing
- **Tesseract.js**: Client-side OCR library for extracting text from medication images
- **Camera API integration**: Native device camera access for photo capture
- **Image preprocessing**: Optimized image handling for better OCR accuracy
- **Flash control**: Camera flash functionality for low-light conditions

## Authentication and State Management
- **Session-based authentication**: User sessions managed server-side
- **React hooks**: Custom hooks for UI state management (mobile detection, toast notifications)
- **Form validation**: Client-side validation using react-hook-form with Zod schemas
- **Language Context**: React context provider for bilingual support with Vietnamese and English
- **Automatic language detection**: Detects user's browser language preferences
- **Language persistence**: Saves language preference in localStorage

## API Integration Patterns
- **Error handling**: Comprehensive error boundaries and user feedback
- **Loading states**: UI feedback during async operations
- **Optimistic updates**: Immediate UI updates with server synchronization
- **Type-safe API calls**: Shared TypeScript interfaces between client and server

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database for production deployment
- **Drizzle Kit**: Database migration and schema management tools

## Third-party APIs
- **OpenFDA API**: External drug information database for medication lookup (referenced in routes but implementation pending)

## UI and Component Libraries
- **Radix UI**: Headless, accessible React components for complex UI patterns
- **Lucide React**: Feather-inspired icon library
- **Class Variance Authority**: Utility for creating type-safe component variants
- **CLSX & Tailwind Merge**: Conditional CSS class management

## Development Tools
- **Replit Integration**: Development environment optimizations for Replit platform
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

## Mobile and Camera Integration
- **Native Web APIs**: Camera access, file handling, and device capabilities
- **Progressive Web App features**: Mobile-optimized user experience