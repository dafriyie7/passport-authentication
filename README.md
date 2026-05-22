# Express OAuth 2.0 and Local Authentication Server

A robust, production-ready Express server template written in TypeScript, featuring dual-method user authentication. This boilerplate integrates Passport.js for both traditional email/username sign-in and Google OAuth 2.0 social login. The application leverages Prisma ORM backed by a PostgreSQL database, utilizing PostgreSQL for session persistence to ensure seamless state preservation across server restarts.

---

## Table of Contents

- Features
- Technology Stack
- Architecture and Directory Structure
- Database Schema
- Prerequisites
- Installation and Setup
- Environment Configuration
- Running the Application
- API Specifications
- Architecture and Custom Utilities
- License

---

## Features

- Local Authentication: Secure user registration and login using usernames or email addresses.
- Social Authentication: Seamless Google OAuth 2.0 integration with automatic account creation for new users.
- Secure Passwords: Salted password hashing with bcryptjs (10 rounds).
- Persistent Sessions: PostgreSQL-backed session storage using connect-pg-simple, ensuring sessions persist even when the server restarts or undergoes updates.
- Native TypeScript: Developed with TypeScript 6.0 and run in development using tsx watch mode for fast compilation and live reloads.
- Modern ORM: Configured with Prisma ORM and the PostgreSQL native driver adapter.
- Global Error Handling: Unified API responses and custom middleware to capture errors gracefully.
- Security Headers and CORS: Built-in Cross-Origin Resource Sharing configuration supporting cookie credentials, designed to integrate smoothly with frontend frameworks like React or Vue.

---

## Technology Stack

- Backend Framework: Express.js (v5)
- Programming Language: TypeScript (v6)
- Database: PostgreSQL
- ORM: Prisma (v7)
- Authentication Engine: Passport.js (passport-local, passport-google-oauth20)
- Session Management: express-session, connect-pg-simple, pg
- Dev Tools: tsx (TypeScript Execute)

---

## Architecture and Directory Structure

The project follows a clean, modular structure separating configuration, middleware, features (modules), and utilities:

```
.
├── prisma/
│   ├── migrations/            # SQL database migration history
│   └── schema.prisma          # Database models and client configuration
├── src/
│   ├── config/
│   │   ├── oauth.ts           # Passport.js strategy configurations (Local and Google)
│   │   └── sessionConfig.ts   # Express session and connect-pg-simple store configuration
│   ├── generated/             # Auto-generated Prisma Client files
│   ├── middleware/
│   │   └── errorHandler.ts    # Global express error handler middleware
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.controller.ts  # Route handler controllers (signup, logout)
│   │       └── auth.routes.ts      # Authentication HTTP endpoints
│   ├── utils/
│   │   ├── AppError.ts        # Custom operational error class
│   │   ├── asyncHandler.ts    # Wrapper for handling asynchronous Express routes
│   │   ├── prisma.ts          # Centralized Prisma Client initialization with PG adapter
│   │   └── response.ts        # Standardized API response formatter
│   └── server.ts              # Express application entrypoint
├── .env                       # Environment variables (local dev only)
├── .gitignore                 # Files and directories ignored by Git
├── package.json               # Scripts, engines, and package dependencies
├── prisma.config.ts           # Prisma CLI global configurations
├── tsconfig.json              # TypeScript compiler options
└── README.md                  # Project documentation
```

### Folder Breakdown

- config: Stores modules that initialize and configure external services like Passport strategies and Express session persistence.
- middleware: Houses custom Express middlewares such as the global error interception handler.
- modules: Organized by feature domains. The `auth` module contains all controllers and routing rules dedicated to authentication processes.
- utils: Generic helpers to keep code DRY, including DB client abstractions, operational error definitions, async handlers, and output formatters.

---

## Database Schema

The database contains two primary tables: users (`User` model) and sessions (`user_sessions` table).

### Prisma User Model

Defined in `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  username  String
  email     String   @unique
  password  String?  // Nullable to accommodate Google OAuth-only accounts
  createdAt DateTime @default(now())
}
```

- When a user signs up using the local strategy, the password field is hashed and stored.
- When registering via Google OAuth, the password field remains null, and authentication is delegated entirely to Google.

### Session Table

Managed by the `connect-pg-simple` package, a dedicated PostgreSQL table is automatically generated (if missing) named `user_sessions`. This table maintains persistent session states such as passport serialization IDs, expiration timestamps, and session payloads.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:

- Node.js (version 18 or above recommended)
- PNPM (package manager)
- A running PostgreSQL database instance

---

## Installation and Setup

1. Clone the repository and navigate into the root directory:
   ```bash
   cd oauth20
   ```

2. Install the project dependencies:
   ```bash
   pnpm install
   ```

3. Ensure PostgreSQL is active and create a database named `oauth`.

---

## Environment Configuration

Create a `.env` file in the root directory and populate it with the appropriate values:

```env
# Application Ports & Mode
NODE_ENV=development

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Session Cookie Encryption Key
COOKIE_SECRET=your-random-secure-cookie-secret

# PostgreSQL Database Connections
# Replace username, password, host, port, and database name as necessary
DATABASE_URL="postgresql://username:password@localhost:5432/oauth?schema=public"

# Session Store Credentials (used by PG Client pool in sessionConfig.ts)
DB_USER=username
DB_PASSWORD=password
```

---

## Running the Application

### Development Mode

Start the development server with live reload enabled using `tsx`:
```bash
pnpm dev
```
The server will start, logging incoming routes and running on: `http://localhost:3000`

### Production Mode

1. Compile TypeScript to JavaScript:
   ```bash
   pnpm build
   ```
2. Start the production server using the compiled outputs:
   ```bash
   pnpm start
   ```

---

## API Specifications

All auth endpoints are prefixed with `/api/auth` except for the generic landing and session verification home routes.

### General & Protected Routes

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/` | Server health check endpoint | No |
| GET | `/home` | Retrieves the currently authenticated user session details | Yes (Session Cookie) |

#### GET `/home` Response (Authenticated)
```json
{
  "message": "Successfully authenticated",
  "user": {
    "id": "cldh1x...",
    "username": "JohnDoe",
    "email": "john.doe@example.com",
    "password": "...",
    "createdAt": "2026-05-22T19:00:00.000Z"
  }
}
```

#### GET `/home` Response (Unauthenticated)
```
Status: 401 Unauthorized
Response Text: Unauthorized
```

### Authentication Endpoints (Prefixed with `/api/auth`)

| Method | Endpoint | Description | Request Body / Query Params |
| :--- | :--- | :--- | :--- |
| POST | `/signup` | Registers a new local account | `{ username, email, password }` |
| POST | `/login` | Authenticates using local credentials | `{ identifier, password }` |
| GET | `/login` | Dev portal helper rendering Google login anchor tag | None |
| GET | `/google` | Initiates the Google OAuth 2.0 handshake flow | None (Redirects to Google) |
| GET | `/google/callback` | Callback redirect handler for Google OAuth token validation | Standard OAuth query parameters |
| GET | `/logout` | Terminates the active session and clears auth cookies | None |

#### Local Registration: `POST /api/auth/signup`
- Headers: `Content-Type: application/json`
- Request Body:
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
}
```
- Successful Response (201 Created):
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {
      "user": {
        "id": "cldh1x...",
        "username": "johndoe",
        "email": "john@example.com",
        "createdAt": "2026-05-22T19:00:00.000Z"
      }
    }
  }
  ```

#### Local Sign-In: `POST /api/auth/login`
- Headers: `Content-Type: application/json`
- Request Body:
  ```json
  {
    "identifier": "john@example.com",
    "password": "securepassword123"
  }
  ```
  Note: `identifier` can be either the user's `email` or `username`.
- Successful Response (200 OK):
  ```json
  {
    "success": true,
    "message": "success",
    "data": {
      "user": {
        "id": "cldh1x...",
        "username": "johndoe",
        "email": "john@example.com",
        "createdAt": "2026-05-22T19:00:00.000Z"
      }
    }
  }
  ```

#### Google Authentication: `GET /api/auth/google`
- Redirects the client directly to Google's authentication page request screen requesting scopes `profile` and `email`.

#### Google Auth Callback: `GET /api/auth/google/callback`
- Handles the OAuth server response. Upon validation, the user is created (if logging in for the first time) or identified. The session cookie is initialized, and the client is redirected to the `/home` endpoint.

---

## Architecture and Custom Utilities

### Custom Error Class (`AppError.ts`)

Extends the native `Error` class to encapsulate HTTP status codes for expected operational failures (e.g., validations, duplicate users, unauthenticated access).

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500
  ) {
    super(message);
  }
}
```

### Async Handler Wrapper (`asyncHandler.ts`)

A utility function that wraps asynchronous Express route handlers to automatically catch any thrown errors and forward them to the global Express error-handling middleware. This eliminates duplicate try-catch blocks throughout controllers.

```typescript
export const asyncHandler =
  (fn: Function) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```

### Global Error Handling Middleware (`errorHandler.ts`)

A centralized express middleware designed to capture all operational errors (`AppError`) and unexpected server crashes. This guarantees that client responses remain formatted as standard JSON, preventing stack traces or framework internals from leaking to the outside world in production.

```typescript
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  
  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong',
  });
};
```

### Centralized Prisma Client (`prisma.ts`)

The database client is created utilizing Prisma's PostgreSQL adapter driver. This adapter links Node-Postgres (`pg`) connection pooling with Prisma's engine, enabling concurrent database query optimization.

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

---

## License

This project is licensed under the ISC License. Feel free to use and distribute it for personal or commercial projects.
