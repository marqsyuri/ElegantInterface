# Estética Pro - Sistema de Gestão para Esteticistas

## Overview
Estética Pro is a full-stack web application designed for beauty professionals to manage their business operations. It provides tools for appointment scheduling, client management, clinical records, financial tracking, inventory, communication, and loyalty programs. The project aims to offer a comprehensive, modern solution for aestheticians, enhancing efficiency and client engagement.

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
- **Authentication System**: Replit OIDC integration with session management.
- **Comprehensive Database Schema**: Includes Users, Clients, Services, Appointments, Clinical Records, Transactions, Messages, Feedback, Inventory, and Loyalty Programs.
- **Core Business Management**: Dashboard, Appointment, Client, Clinical Record, Financial, Communication, Inventory, and Loyalty management.
- **UI/UX Decisions**: Mobile-first responsive design, consistent layout patterns using a `PageLayout` component, expandable sidebar, and a clean, professional aesthetic with a Brazilian color theme (green/yellow) and no gradients.
- **Appointment System**: Calendar and list views, duration handling, New Zealand time formatting, and configurable business hours.
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

### Authentication
- `openid-client`: OIDC authentication client
- `passport`: Authentication middleware
- `express-session`: Session management
- `connect-pg-simple`: PostgreSQL session store

### Development Tools
- `vite`: Fast build tool and dev server
- `typescript`: Static type checking
- `tsx`: TypeScript execution for Node.js
- `esbuild`: Fast JavaScript bundler