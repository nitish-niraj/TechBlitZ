# University Grievance Redressal System

## Overview

This is a comprehensive university grievance redressal platform designed to facilitate transparent and efficient handling of student complaints. The system provides a complete solution for students to submit, track, and resolve grievances with real-time updates and multi-stakeholder management capabilities. The platform features both student-facing interfaces for complaint submission and tracking, as well as administrative dashboards for complaint management and analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built using React 18 with TypeScript, organized as a single-page application with client-side routing using Wouter. The UI is styled with Tailwind CSS and uses shadcn/ui components for a consistent design system. State management is handled through TanStack Query (React Query) for server state and caching. The application includes dedicated pages for landing, dashboard, complaint submission, complaint details, and admin dashboard.

Key architectural decisions:
- **Component-based architecture**: Modular components for reusability and maintainability
- **TypeScript**: Type safety throughout the application
- **Form handling**: React Hook Form with Zod validation for robust form management
- **File uploads**: Drag-and-drop file upload component with progress tracking
- **Responsive design**: Mobile-first approach with responsive layouts

### Backend Architecture
The server is built with Express.js using TypeScript in ES modules format. The architecture follows a monolithic approach with clear separation of concerns through dedicated modules for routes, storage, and authentication.

Core components:
- **Express server**: Main application server with middleware for logging and error handling
- **Database layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Replit Auth integration with session management using PostgreSQL sessions
- **File handling**: Multer for multipart form data and file uploads with validation
- **API design**: RESTful endpoints for complaints, departments, users, and analytics

### Database Design
PostgreSQL database with Drizzle ORM providing type-safe database operations. The schema includes:

- **Users table**: Stores user information with role-based access (student, staff, admin)
- **Departments table**: Organizational units for complaint routing
- **Complaints table**: Core complaint data with status tracking and categorization
- **Complaint attachments**: File attachments linked to complaints
- **Complaint history**: Audit trail for complaint status changes
- **Notifications**: User notification system
- **Sessions table**: Required for authentication session storage

Schema design supports:
- Role-based access control with user roles (student, staff, admin)
- Complaint lifecycle management with status enums
- Category and priority classification
- Anonymous complaint submission capability

### Authentication & Authorization
Replit Auth integration provides secure authentication with session-based management. User roles determine access levels:
- **Students**: Can submit and view their own complaints
- **Staff**: Can view and manage assigned complaints in their department
- **Admin**: Full system access including user management and analytics

Session data is stored in PostgreSQL with automatic cleanup and secure cookie configuration.

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL serverless database with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations

### Authentication
- **Replit Auth**: OAuth-based authentication system integrated with university SSO
- **Express Session**: Session management with PostgreSQL store

### File Storage & Processing
- **Multer**: File upload middleware with validation
- **Local file system**: File storage with configurable upload directory

### UI & Frontend Libraries
- **shadcn/ui**: Pre-built React components with Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation for forms and API data

### Development & Build Tools
- **Vite**: Frontend build tool with hot module replacement
- **TypeScript**: Type safety across the stack
- **ESBuild**: Backend bundling for production
- **PostCSS**: CSS processing with Tailwind

### Replit Platform Integration
- **Replit plugins**: Development environment integration with cartographer and dev banner
- **Runtime error overlay**: Enhanced development experience

The system is designed to be scalable and maintainable, with clear separation between frontend and backend concerns, type safety throughout the stack, and robust error handling and validation.