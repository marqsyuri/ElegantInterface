# Estética Pro - Sistema de Gestão para Esteticistas

## Overview
Estética Pro is a full-stack web application designed for beauty professionals to manage their business operations. It provides tools for appointment scheduling, client management, clinical records, financial tracking, inventory, communication, and loyalty programs. The project features a complete client booking system with a 4-step workflow and comprehensive administrative tools for salon management. Its business vision is to streamline operations for estheticians, offering a robust platform to enhance efficiency and client satisfaction, with significant market potential in the beauty and wellness industry.

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
- **UI/UX Decisions**: Mobile-first responsive design, consistent layout patterns using a `PageLayout` component, expandable sidebar, and a clean, professional aesthetic with a Brazilian color theme (green/yellow) and no gradients.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM (using Neon serverless PostgreSQL)
- **Authentication**: Local user authentication with Passport.js (username/password, MD5 hashing) and Express sessions.
- **Validation**: Shared Zod schemas for full-stack type safety.

### Key Features
- **Comprehensive Database Schema**: Includes Users, Clients, Services, Appointments, Clinical Records, Transactions, Messages, Feedback, Inventory, and Loyalty Programs.
- **Core Business Management**: Dashboard, Appointment, Client, Clinical Record, Financial, Communication, Inventory, and Loyalty management.
- **Client Booking System**: 4-step public booking flow (Service Selection → Professional Selection → Date/Time Selection → Confirmation) with intelligent calendar integration, supporting multiple procedures per appointment with dynamic total calculation and inventory tracking.
- **Professional Management**: Staff profiles with specialties, scheduling availability, and service assignments.
- **Smart Scheduling**: Business hours integration, 30-minute time slots, break time handling, and a 14-day availability window.
- **Image Upload System**: Compressed photo uploads with before/after support, stored as base64.
- **Automated Notification Systems**:
    - **Appointment Reminders**: Notifies clients about upcoming appointments based on configurable time windows and contact preferences.
    - **Inactive Client Detection**: Identifies clients who haven't had appointments within a configurable timeframe for re-engagement.
- **Notification Settings Enhancement**: Configurable time parameters for inactivity tracking, reminder timing, and sending time windows.

### Design Principles
- **Type Safety**: End-to-end TypeScript with shared Zod schemas.
- **Component Design**: Atomic design principles for reusable UI components.
- **Data Flow**: RESTful API, TanStack Query for optimistic updates/caching, and client/server validation.

## External Dependencies

- `@neondatabase/serverless`: Serverless PostgreSQL connection
- `drizzle-orm`: Type-safe database operations
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: Accessible UI primitives
- `tailwindcss`: Utility-first CSS framework
- `wouter`: Lightweight React router
- `passport`: Local authentication middleware
- `passport-local`: Local strategy with username/password
- `express-session`: Session management
- `connect-pg-simple`: PostgreSQL session store
- `node-cron`: For scheduled tasks like reminders and inactive client detection
- `vite`: Fast build tool and dev server
- `typescript`: Static type checking
- `tsx`: TypeScript execution for Node.js
- `esbuild`: Fast JavaScript bundler