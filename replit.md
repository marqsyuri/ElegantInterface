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

## Recent Changes

### Sistema de Múltiplos Procedimentos por Agendamento (October 16, 2025) ✅ COMPLETED
- **Fase 1 - Database & Backend**: ✅ CONCLUÍDA
  - **Nova Tabela**: `appointment_procedures` (muitos-para-muitos) com snapshot de preços, duração e materiais
  - **Campos Calculados**: `appointments` agora possui `totalPrice`, `totalDuration`, `procedureCount` e `staffId`
  - **Migração Automática**: Dados existentes migrados com sucesso para nova estrutura
  - **Storage Functions**:
    - `calculateAppointmentTotals()`: Calcula preço e duração total
    - `createAppointmentWithProcedures()`: Cria agendamento com array de procedimentos
    - `getAppointmentWithProcedures()`: Busca agendamento com todos procedimentos
  - **API Routes**:
    - POST `/api/appointments/with-procedures` - Criar com múltiplos procedimentos
    - GET `/api/appointments/:id/with-procedures` - Buscar com todos procedimentos
  - **Snapshot Pattern**: Preserva valores no momento do agendamento (preço, duração, materiais)
  - **Compatibilidade**: Sistema antigo mantido com soft deprecation
- **Fase 2 - Frontend UI**: ✅ CONCLUÍDA
  - **Client Booking System**: Step 1 agora possui painel de resumo com lista de procedimentos selecionados, preço total, duração total e botão "Clear All"
  - **Dashboard**: Atualizado para exibir múltiplos procedimentos concatenados com vírgula
  - **Appointments Page**: Já suportava múltiplos procedimentos com exibição completa de preços e durações individuais
  - **Steps 2-4 do Booking**: Já estavam implementados corretamente com suporte a múltiplos procedimentos
- **Fase 3 - Notification System**: ✅ CONCLUÍDA
  - **Inactive Clients**: Função `findInactiveClients()` atualizada para concatenar nomes de múltiplos procedimentos
  - **Appointment Reminders**: Função `findUpcomingAppointments()` atualizada para concatenar nomes de múltiplos procedimentos
  - **Fallback Support**: Ambas funções mantêm compatibilidade com sistema antigo de procedimento único
  - **Status**: Sistema completo pronto para produção e integração n8n
- **Fase 4 - Admin Multi-Select UI**: ✅ CONCLUÍDA
  - **Componente ProcedureMultiSelect**: Componente reutilizável com checkboxes por categoria, resumo em tempo real, totais automáticos e botão "Clear All"
  - **Formulário New Appointment**: Agora possui multi-select de procedimentos com UI moderna, seleção de profissional, cliente e data/hora
  - **Integração Backend**: Usa API `/api/appointments/with-procedures` com payload completo de snapshots
  - **Validação**: Garante seleção mínima de 1 procedimento, cliente e profissional
  - **Rota Pública Atualizada**: `/api/public/appointments/:publicLink` agora usa `createAppointmentWithProcedures()` para clientes externos

### Appointment Reminders System (October 15, 2025) ✅ COMPLETED
- **Automated Appointment Reminder System**: Complete backend system to notify clients about upcoming appointments
  - **Database Table**: `appointmentReminders` table with appointmentId, clientId, clientName, clientEmail, clientPhone, appointmentDate, appointmentTime, procedureName, contactPreference, and status fields
  - **Storage Functions**: Four new methods in DatabaseStorage class:
    - `findUpcomingAppointments()`: Finds appointments needing reminders within configured time window
    - `populateAppointmentReminders()`: Populate reminders for a specific user
    - `populateAllUsersAppointmentReminders()`: Process all active users
    - `getAppointmentReminders()`: Retrieve reminders with optional status filter
  - **Hourly Scheduler**: Cron job running every hour at :00 to populate appointment reminders
  - **Time Window Validation**: Only processes reminders during configured hours (reminderStartTime to reminderEndTime)
  - **Smart Detection**: Respects user's reminderHours setting (hours before appointment)
  - **Deduplication**: Prevents duplicate reminders for the same appointment
  - **Contact Preferences**: Automatically determines preferred contact method (WhatsApp/SMS/Phone)
  - **Status Tracking**: 0=pending, 1=sent, 2=confirmed, 3=cancelled (for n8n integration)
  - **Test Endpoint**: POST /api/test/appointment-reminders for manual testing (requires authentication)
  - **Status**: Fully functional and production-ready - ready for n8n integration

### Inactive Clients Detection System (October 15, 2025) ✅ COMPLETED
- **Automated Inactive Client Detection**: Complete backend system to identify and track clients who haven't had appointments within a configurable timeframe
  - **Database Table**: `inactiveClients` table with clientId, clientName, clientEmail, clientPhone, lastProcedure, lastAppointmentDate, contactPreference, and status fields
  - **Storage Functions**: Four new methods in DatabaseStorage class:
    - `findInactiveClients()`: Optimized single-query detection using JOIN to prevent timeouts
    - `populateInactiveClients()`: Populate inactive clients for a specific user
    - `populateAllUsersInactiveClients()`: Populate for all active users
    - `getInactiveClients()`: Retrieve inactive clients list
  - **Daily Scheduler**: Cron job running at 00:00 (midnight) to automatically populate inactive clients table
  - **Query Optimization**: Single LEFT JOIN query instead of loop-based queries for better performance
  - **Contact Preferences**: Automatically determines preferred contact method (WhatsApp/SMS/Phone) from client settings
  - **Test Endpoint**: POST /api/test/inactive-clients for manual testing (requires authentication)
  - **Dependencies**: Added `node-cron` package for scheduled tasks
  - **Status**: Fully functional and production-ready - tested and verified with real data

### Time Parameters for Notifications (October 14, 2025) ✅ COMPLETED
- **Notification Settings Enhancement**: Added configurable time parameters for customer notifications
  - **Inactivity Tracking**: Days before sending follow-up to inactive clients (1-365 days)
  - **Reminder Timing**: Hours before appointment to send reminders (1-72 hours)
  - **Time Window**: Configurable start/end times for sending reminders (respects client rest hours)
  - **Database Schema**: Added `inactivityDays`, `reminderHours`, `reminderStartTime`, `reminderEndTime` to users table
  - **UI Implementation**: Clean, English-language time parameters section in Settings > Notifications
  - **Form Validation**: Numeric coercion with z.coerce.number() for proper type handling
  - **Backend Route**: PUT /api/auth/user endpoint for profile updates with session refresh
  - **Status**: Fully functional with end-to-end validation and persistence

### Replit Environment Setup (October 14, 2025) ✅ COMPLETED
- **GitHub Import Configuration**: Successfully imported and configured for Replit environment
- **Database Setup**: PostgreSQL database provisioned and schema pushed with Drizzle ORM
  - 20 tables created including users, sessions, appointments, clients, and all business tables
  - Database seeding script added with `npm run db:seed` command
  - Admin user automatically created (username: admin, password: admin)
- **TypeScript Configuration**: Updated to ES2022 for import.meta.dirname support
- **Vite Development Server**: Configured for Replit proxy compatibility
  - Host: 0.0.0.0 on port 5000 (unified frontend + backend)
  - HMR configured for secure websocket connection
- **Session Management**: Synchronous MemoryStore for development
- **Deployment Configuration**: VM deployment with build and start scripts
- **Workflow Setup**: Single unified workflow serving both frontend and backend on port 5000
- **Status**: Application fully functional and ready for use

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