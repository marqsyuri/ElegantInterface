# Estética Pro - Sistema de Gestão para Esteticistas

## Overview
Estética Pro is a full-stack web application designed for beauty professionals to manage their business operations. It provides tools for appointment scheduling, client management, clinical records, financial tracking, inventory, communication, and loyalty programs. The project features a complete client booking system with 4-step workflow and comprehensive administrative tools for salon management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with shadcn/ui and Radix UI primitives
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM (using Neon serverless PostgreSQL)
- **Authentication**: Replit Auth (OIDC-based) with Express sessions
- **Validation**: Shared Zod schemas for full-stack type safety

### Key Features
- **Authentication System**: Local user authentication with username/password and MD5 hashing.
- **Comprehensive Database Schema**: Includes Users, Clients, Services, Appointments, Clinical Records, Transactions, Messages, Feedback, Inventory, and Loyalty Programs.
- **Core Business Management**: Dashboard, Appointment, Client, Clinical Record, Financial, Communication, Inventory, and Loyalty management.
- **Client Booking System**: 4-step public booking flow (Service Selection → Professional Selection → Date/Time Selection → Confirmation) with intelligent calendar integration.
- **Professional Management**: Staff profiles with specialties, scheduling availability, and service assignments.
- **Smart Scheduling**: Business hours integration, 30-minute time slots, break time handling, and 14-day availability window.
- **UI/UX Decisions**: Mobile-first responsive design, consistent layout patterns using a `PageLayout` component, expandable sidebar, and a clean, professional aesthetic with a Brazilian color theme (green/yellow) and no gradients.
- **Image Upload System**: Compressed photo uploads with before/after support, stored as base64.

### Design Principles
- **Type Safety**: End-to-end TypeScript with shared Zod schemas.
- **Component Design**: Atomic design principles for reusable UI components.
- **Data Flow**: RESTful API, TanStack Query for optimistic updates/caching, and client/server validation.

## External Dependencies

### Core Dependencies
- `@neondatabase/serverless`: Serverless PostgreSQL connection
- `drizzle-orm`: Type-safe database operations
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: Accessible UI primitives
- `tailwindcss`: Utility-first CSS framework
- `wouter`: Lightweight React router

### Authentication (Local)
- `passport`: Local authentication middleware
- `passport-local`: Local strategy with username/password
- `express-session`: Session management
- `connect-pg-simple`: PostgreSQL session store
- MD5 password hashing for compatibility

### Development Tools
- `vite`: Fast build tool and dev server
- `typescript`: Static type checking
- `tsx`: TypeScript execution for Node.js
- `esbuild`: Fast JavaScript bundler

## Recent Changes (August 2025)

### Local Authentication Conversion (August 22, 2025) ✅ COMPLETED
- **Complete migration from Replit Auth to local authentication**:
  - User table redesigned with username, email, MD5 password fields
  - Integer primary keys replacing string UUIDs for all tables
  - Local passport strategy with username/password login
  - Admin user created: username `admin`, password `admin` (MD5: 21232f297a57a5a743894a0e4a801fc3)
- **Database schema updates**: All foreign key references converted to integer types
- **Session management**: Memory store for development, PostgreSQL for production
- **Frontend integration**: Complete auth hooks and routing system implemented
- **Ready for standalone deployment**: System fully independent and portable
- **Status**: Login working perfectly, dashboard accessible, all authentication flows operational

### Client Booking System Implementation
- **Complete 4-step booking workflow**: Service selection, professional selection, calendar scheduling, and confirmation
- **10+ service categories**: Hair treatments (Hair Colour Dye $150, Foils/Balayage $220, Brazilian Keratin $200, Hair Botox $120, Hair Extension $300), nail services, and consultations
- **Professional management**: 3 specialists (Maria Silva, Ana Costa, Jessica Brown) with defined specialties
- **Smart calendar system**: 14-day availability window, business hours integration, 30-minute time slots
- **Public API endpoints**: `/api/public/procedures`, `/api/public/staff`, `/api/public/business-hours`, `/api/public/appointments`
- **Confirmation system**: Complete booking summary with contact information and WhatsApp integration

### Technical Improvements
- **Enhanced routing**: Proper navigation flow between booking steps with back button functionality
- **Real-time validation**: Form validation at each step with user-friendly error messages
- **Mobile optimization**: Responsive design optimized for mobile booking experience
- **Database integration**: Automatic client creation and appointment management
- **Standalone deployment**: System converted for deployment outside Replit infrastructure
- **Complete backup**: Full database backup (224KB) with all data and structure
- **Production ready**: All dependencies resolved for Node.js deployment on any server