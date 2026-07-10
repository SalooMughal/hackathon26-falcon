# FalconAI Backend

This repository contains the backend API for the FalconAI platform. It's built
with **Node.js**, **TypeScript**, **Express**, and **Drizzle ORM** (PostgreSQL).

---

## 🚀 Quick Start

These steps will help you boot a development instance of the API on your local
machine.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) package manager
- PostgreSQL database (local or hosted)

### 2. Clone & Install

```bash
# clone the repo
git clone https://github.com/sheikh295/hackathon26-falcon.git
cd hackathon26-falcon/falconai-backend

# install dependencies
pnpm install
```

### 3. Environment

Copy the example env file and populate with your own values:

```bash
cp .env.example .env
```

Now set the env values properly

### 4. Database Setup

Run migrations and seed the database (includes default roles,
permissions, super-admin user, and subscription plans):

```bash
pnpm run db:seed
```

The default super-admin email is `superadmin@falconai.com` and password is `Superadmin@123` (change it afterwards).

### 5. Development

Start the server with auto-reload:

```bash
pnpm run dev
```

Open your browser at `http://localhost:3000` (Swagger UI available by default).

### 6. Production Build / Run

```bash
pnpm run build      # compile TypeScript
pnpm run serve      # apply migrations and start the compiled app
```

### 7. Helpful Scripts

| Script                           | Description                           |
| -------------------------------- | ------------------------------------- |
| `pnpm run dev`                   | start with nodemon for development    |
| `pnpm run lint`                  | run ESLint                            |
| `pnpm run format`                | run Prettier                          |
| `pnpm run db:seed`               | run migrations + default data seeding |
| `pnpm run db:migration:generate` | create a new migration                |
| `pnpm run db:migration:apply`    | apply pending migrations              |

### 8. Project Structure

Refer to the `/src` directory for modules, schema definitions, and utilities.
Modules follow a consistent pattern (`routes`, `controller`, `service`,
`validations`, `docs`).

### 9. API Documentation

A Swagger UI is available at `/api-docs` when the server is running and is protected by basic auth for which thr creds are set in env (see .env.example).

### 10. Other Notes

- Use only GET/POST for routes; validation middleware comes first.
- All responses use standardized status codes (`src/constants/statusCodes.ts`).
- Passwords are hashed via `methods.encrypt` (bcrypt under the hood).
