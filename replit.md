# Estética Pro - Sistema de Gestão para Esteticistas

## Overview

This is a modern full-stack web application designed specifically for beauty professionals (aestheticians) to manage their business operations. The system provides comprehensive tools for appointment scheduling, client management, clinical records, financial tracking, inventory management, customer communication, and loyalty programs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: TailwindCSS with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OIDC-based authentication)
- **Session Management**: Express sessions stored in PostgreSQL

### Key Technology Choices
- **Database Provider**: Neon serverless PostgreSQL for scalability
- **Type Safety**: Full-stack TypeScript with shared schema definitions
- **Validation**: Zod schemas for both client and server validation
- **Component Design**: Atomic design principles with reusable UI components

## Key Components

### Authentication System
- Uses Replit's OIDC authentication system
- Session-based authentication with PostgreSQL session storage
- User profile management with professional credentials
- Automatic redirect handling for unauthorized access

### Database Schema
The application uses a comprehensive database schema with the following main entities:
- **Users**: Professional profile with clinic information
- **Clients**: Customer records with contact and health information
- **Services**: Treatment offerings with pricing
- **Appointments**: Scheduling system with status tracking
- **Clinical Records**: Treatment history and outcomes
- **Transactions**: Financial records for income/expenses
- **Messages**: Communication tracking
- **Feedback**: Customer satisfaction data
- **Inventory**: Materials and equipment management
- **Loyalty Programs**: Customer retention features

### Core Features
1. **Dashboard**: Real-time business metrics and daily overview
2. **Appointment Management**: Calendar-based scheduling system
3. **Client Management**: Comprehensive customer database
4. **Clinical Records**: Digital treatment documentation
5. **Financial Tracking**: Income/expense management with reporting
6. **Communication Hub**: Multi-channel customer communication
7. **Inventory Management**: Materials and equipment tracking
8. **Loyalty Programs**: Customer retention and rewards system

## Data Flow

### Client-Server Communication
- RESTful API design with consistent error handling
- TanStack Query for optimistic updates and caching
- Form submissions use React Hook Form with Zod validation
- Real-time data updates through query invalidation

### Authentication Flow
1. User accesses protected route
2. System checks for valid session
3. Redirects to Replit OAuth if unauthenticated
4. Creates/updates user profile on successful authentication
5. Establishes server session with PostgreSQL storage

### Data Validation
- Shared Zod schemas between client and server
- Client-side validation for immediate feedback
- Server-side validation for security
- Type-safe database operations with Drizzle

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router

### Authentication
- **openid-client**: OIDC authentication client
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **vite**: Fast build tool and dev server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler

## Deployment Strategy

### Build Process
- Frontend built with Vite to `dist/public`
- Backend bundled with esbuild to `dist/index.js`
- Single deployment artifact containing both frontend and backend

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Session security via `SESSION_SECRET`
- Replit-specific configuration for OIDC authentication
- Development vs production environment detection

### Database Management
- Drizzle migrations for schema versioning
- Connection pooling for scalability
- Serverless-compatible database operations

### Production Considerations
- Static file serving for frontend assets
- Express error handling middleware
- Request logging and monitoring
- Session persistence across deployments

## Recent Changes
- **COMPLETED: Brazilian Color Theme Implementation** (January 28, 2025)
  - Updated color scheme to Brazilian green and yellow gradient theme throughout system
  - Modified CSS variables to use authentic Brazilian flag colors: deep green (#145, 80%, 30%) and bright yellow (#45, 95%, 55%)
  - Transformed dashboard header gradient from sage/peach to vibrant green-to-yellow Brazilian theme
  - Updated all UI elements including stats cards, buttons, icons, and service categories to use Brazilian color palette
  - Maintained professional aesthetic while incorporating national Brazilian color identity
  - Enhanced Quick Action buttons with alternating green and yellow color scheme
  - Applied Brazilian theme to service category icons and backgrounds
  - Preserved responsive design and accessibility while updating visual identity
- **COMPLETED: Full Responsive Design System** (January 27, 2025)
  - Implemented complete mobile-first responsive design across all pages
  - Added mobile hamburger menu with smooth slide-out sidebar functionality
  - Created adaptive layout system: 1 column (mobile), 2 columns (tablet), 4 columns (desktop)
  - Enhanced touch-friendly navigation with 44px minimum touch targets
  - Applied responsive typography and spacing throughout system
  - Optimized all components for seamless cross-device experience
- **COMPLETED: Modern Beauty Salon Dashboard Design** (January 25, 2025)
  - Implemented elegant beauty salon dashboard with "Estética Pro" branding
  - Created soft color palette design using sage green, mint green, soft orange, and peach tones
  - Added beautiful gradient header with glassmorphism effects and backdrop blur styling
  - Designed elegant stats cards with rounded borders, hover effects, and modern typography
  - Implemented comprehensive service categories: Hair Cut (Men & Women), Hair Colour & Dye, Hair Treatment & Care, Blow Dry & Styling, Extensions (Hair & Lash), Nail Care (Mani & Pedi)
  - Enhanced responsive sidebar with dynamic layout adjustment for all modules
  - Applied Inter font family for professional typography throughout system
  - Created professional quick action buttons with rounded design and smooth transitions
  - Maintained complete New Zealand English localisation with modern beauty industry terminology
- **COMPLETED: Total Portuguese Elimination** (January 24, 2025)
  - Systematically removed ALL remaining Portuguese words from the entire system
  - Translated final Portuguese phrases in Clinical, Appointments, Dashboard, Loyalty, and Materials modules
  - Fixed date localisation from 'pt-BR' to 'en-NZ' format throughout system
  - Converted status terminology: "Confirmado/Agendado/Pendente" → "Confirmed/Scheduled/Pending"
  - Translated procedure and clinical assessment terminology to professional English
  - Updated loyalty programme terminology: "Níveis VIP" → "VIP Levels"
  - Completed currency conversion from R$ to NZD $ throughout
  - Achieved 100% New Zealand English localisation with zero Portuguese text remaining
- Fully translated Settings page with NZ-specific business terminology (Business Number, postcode format)
- Updated all phone number placeholders to New Zealand format
- Localised all professional registration references for NZ beauty therapy industry
- Maintained consistent New Zealand English spelling conventions throughout