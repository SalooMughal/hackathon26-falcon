# FalconAI Backend - Coding Standards & Practices

## Project Overview

A fintech mortgage platform API built with Node.js, Express, TypeScript, and Drizzle ORM (PostgreSQL), providing help and pathway to own a house for first time homeowners.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with access/refresh tokens
- **Validation**: Zod
- **API Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston
- **Cache**: Redis (ioredis)
- **File Storage**: S3
- **Email**: Nodemailer
- **Module Aliases**: @app for src directory

## Directory Structure

```
src/
├── config/           # Database, Redis, S3 configurations
├── constants/        # Status codes, default values, enums
├── middlewares/      # Auth, validation, error handling
├── scripts/          # Build, initialization scripts
├── modules/          # Feature modules (auth, jobs, reels, users, sessions, etc.)
│   └── [module]/
│       ├── routes.ts              # Route definitions (GET/POST only!)
│       ├── [module].controller.ts # Request handlers
│       ├── [module].service.ts    # Business logic
│       ├── [module].docs.ts       # Swagger documentation
│       └── validations.ts         # Zod schemas
├── schema/
│   ├── tables/       # Drizzle table definitions
│   │   ├── users.ts
│   │   ├── roles.ts
│   │   ├── acls.ts  # Sessions/tokens
│   │   └── enums/   # PostgreSQL enums
│   └── generated/    # Migration files
├── services/         # Shared services (logger, email, sessions)
├── swagger-docs/     # Swagger configuration (swagger.ts with schemas)
└── utils/            # Utility functions (methods.ts for sendResponse)

```

### Module Structure Example

Each module follows this exact structure:

```
modules/users/
├── routes.ts           # Express routes
├── user.controller.ts  # Controllers (handle req/res)
├── user.service.ts     # Services (business logic & DB)
├── user.docs.ts        # Swagger documentation
└── validations.ts      # Zod validation schemas
```

## Database & Schema Standards

### Drizzle ORM Patterns

1. **Table Definitions**:
   - Use `pgTable` from `drizzle-orm/pg-core`
   - Primary keys: `uuid("id").defaultRandom().primaryKey()`
   - Timestamps: `timestamp("created_at").defaultNow().notNull()`
   - Foreign keys with proper references and cascade options

2. **Indexes**:
   - Add unique indexes for all `.unique()` fields
   - Index all foreign keys for join performance
   - Create composite indexes for common query patterns
   - Index frequently filtered fields (status, type, timestamps)

   Example:

   ```typescript
   export const users = pgTable(
     "users",
     {
       id: uuid("id").defaultRandom().primaryKey(),
       email: varchar("email", { length: 255 }).notNull().unique(),
       roleId: uuid("role_id")
         .notNull()
         .references(() => roles.id),
     },
     (t) => ({
       emailIdx: uniqueIndex("users_email_idx").on(t.email),
       roleIdIdx: index("users_role_id_idx").on(t.roleId),
     }),
   );
   ```

3. **Enums**:
   - Define in `src/schema/enums/index.ts`
   - Use `pgEnum` for PostgreSQL enums
   - Keep enum values lowercase with hyphens

4. **Relations**:
   - Define using `relations()` from drizzle-orm
   - Use descriptive relation names
   - Specify both `fields` and `references`

### Database Migrations

- Run `pnpm run db:migration:generate` to create migrations
- Run `pnpm run db:migration:apply` to apply migrations
- Run `pnpm run db:seed` for initial setup with default data and seeds

## Module Standards

### Controller Pattern

```typescript
const controllerFunction = async (req: Request, res: Response) => {
  try {
    const data = req.body as IValidatedInput;

    const { error, result } = await service.operation(data);
    if (error) return methods.sendResponse(res, error);

    methods.sendResponse(res, statusCodes.ReqSuccess, "Success message", { data });
  } catch (error) {
    logger.error("Error in controllerFunction:", error);
    methods.sendResponse(res, statusCodes.InternalServerError);
  }
};
```

### Service Pattern

**Standard Service Return Type**: `{ error?: IStatusCode; result?: any }`

```typescript
// Simple CRUD operation
const createItem = async (input: ICreateInput) => {
  try {
    // Check for duplicates
    const [existing] = await db.select().from(table).where(eq(table.field, input.value));
    if (existing) return { error: statusCodes.AlreadyExists };

    // Create item
    const [item] = await db.insert(table).values(input).returning();
    return { item };
  } catch (error) {
    logger.error(`Error in createItem: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

// GET with pagination
const getAllItems = async (page: number = 1, limit: number = 10, filters?: IFilters) => {
  try {
    const offset = (page - 1) * limit;
    const conditions = [];

    // Build WHERE conditions
    if (filters?.status) {
      conditions.push(eq(table.status, filters.status));
    }
    if (filters?.search) {
      conditions.push(ilike(table.name, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Parallel queries for data and count
    const [items, totalCountResult] = await Promise.all([
      db.select().from(table).where(whereClause).limit(limit).offset(offset).orderBy(table.createdAt),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(table)
        .where(whereClause),
    ]);

    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  } catch (error) {
    logger.error(`Error in getAllItems: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

// UPDATE operation
const updateItem = async (itemId: string, updateData: IUpdateInput) => {
  try {
    // Check if item exists
    const [existing] = await db.select().from(table).where(eq(table.id, itemId));
    if (!existing) return { error: statusCodes.NotFound };

    // Update with timestamp
    const [item] = await db
      .update(table)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(table.id, itemId))
      .returning();

    return { item };
  } catch (error) {
    logger.error(`Error in updateItem: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};

// DELETE operation
const deleteItem = async (itemId: string) => {
  try {
    const [existing] = await db.select().from(table).where(eq(table.id, itemId));
    if (!existing) return { error: statusCodes.NotFound };

    await db.delete(table).where(eq(table.id, itemId));
    return {};
  } catch (error) {
    logger.error(`Error in deleteItem: ${error instanceof Error ? error.message : String(error)}`);
    return { error: statusCodes.InternalServerError };
  }
};
```

### Validation with Zod

**Standard Patterns**:

```typescript
// For query params (GET requests) - use z.coerce for automatic type conversion
export const getAllSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// For body params (POST requests)
export const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(255),
});

// For UUID params
export const getOneSchema = z.object({
  id: z.uuid("Invalid ID format"),
});

// For conditional validation
export const assignRoleSchema = z
  .object({
    userId: z.uuid("Invalid user ID format"),
    roleId: z.uuid("Invalid role ID format").optional(),
    roleName: z.string().optional(),
  })
  .refine((data) => data.roleId || data.roleName, { message: "Either roleId or roleName must be provided" });

// Always export the inferred types
export type IGetAllInput = z.infer<typeof getAllSchema>;
export type ICreateInput = z.infer<typeof createSchema>;
export type IGetOneInput = z.infer<typeof getOneSchema>;
export type IAssignRoleInput = z.infer<typeof assignRoleSchema>;
```

### Route Definition

**IMPORTANT RULES**:

1. **HTTP Methods**: ONLY use GET and POST (NO PUT, PATCH, DELETE)
2. **Middleware Order**: ALWAYS put validation FIRST, then verifyToken, then checkPermissions
3. **Route Naming**: Use descriptive paths like `/read/get-all`, `/read/get-one`, `/create`, `/update`, `/delete`, and `/sudo/` (e.g., `/sudo/assign-role`)

```typescript
import { Router } from "express";
import { controller } from "./controller";
import { validate } from "@app/middlewares/validateParams";
import { inputSchema } from "./validations";
import { verifyToken } from "@app/middlewares/verifyToken";
import checkPermissions from "@app/middlewares/checkPermissions";

const moduleRouter = Router();

// Validation MUST come first to avoid unnecessary DB calls or auth checks
moduleRouter.get("/read/get-all", validate(getAllSchema, "query"), verifyToken, checkPermissions, controller.getAll);
moduleRouter.get("/read/get-one", validate(getOneSchema, "query"), verifyToken, checkPermissions, controller.getOne);
moduleRouter.post("/create", validate(createSchema, "body"), verifyToken, checkPermissions, controller.create);
moduleRouter.post("/update", validate(updateSchema, "body"), verifyToken, checkPermissions, controller.update);
moduleRouter.post("/delete", validate(deleteSchema, "body"), verifyToken, checkPermissions, controller.delete);
moduleRouter.post("/sudo/assign-role", validate(assignRoleSchema, "body"), verifyToken, checkPermissions, controller.assignRole);

export default moduleRouter;
```

**Why Validation First?**

- Fail fast: If params are invalid, no need to check auth or permissions
- Performance: Avoid unnecessary database calls for invalid requests
- Security: Prevent malformed requests from reaching sensitive middleware

## API Documentation (Swagger)

### Swagger Documentation Standards

**IMPORTANT**: Routes in Swagger MUST match actual route paths (remember: only GET and POST methods!)

1. **Schema Definitions**:
   - Only include actual database tables in components/schemas (defined in `swagger-docs/swagger.ts`)
   - Use proper OpenAPI 3.0 types (string, integer, boolean, array, object)
   - Include `required` fields array
   - Add descriptions for all properties
   - Use `format` for special types (uuid, email, date-time, date)

2. **Endpoint Documentation**:
   - Place in `[module].docs.ts` files
   - Include summary, tags, requestBody, responses
   - Document all status codes with examples
   - Use `$ref` for schema references from swagger.ts
   - Include examples in request bodies
   - **CRITICAL**: Use correct HTTP methods (GET/POST only) and paths

3. **Examples**:

   ```typescript
   /**
    * @swagger
    * tags:
    *   name: Users
    *   description: User management endpoints
    */

   /**
    * @swagger
    * /v1/users/get-all:
    *   get:
    *     summary: Get all users with pagination
    *     tags: [Users]
    *     security:
    *       - bearerAuth: []
    *     parameters:
    *       - in: query
    *         name: page
    *         schema:
    *           type: integer
    *           default: 1
    *       - in: query
    *         name: limit
    *         schema:
    *           type: integer
    *           default: 10
    *     responses:
    *       200:
    *         description: Users retrieved successfully
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 message:
    *                   type: string
    *                 users:
    *                   type: array
    *                   items:
    *                     $ref: '#/components/schemas/User'
    *                 pagination:
    *                   type: object
    *       401:
    *         description: Unauthorized
    *       403:
    *         description: Forbidden
    */

   /**
    * @swagger
    * /v1/users/update:
    *   post:
    *     summary: Update a user
    *     tags: [Users]
    *     security:
    *       - bearerAuth: []
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             required:
    *               - userId
    *             properties:
    *               userId:
    *                 type: string
    *                 format: uuid
    *               username:
    *                 type: string
    *     responses:
    *       200:
    *         description: User updated successfully
    */
   ```

4. **Registering Docs**:
   - Add module docs to `swagger-docs/swagger.ts` in the `apis` array:
   ```typescript
   apis: [
     'src/swagger-docs/swagger.ts',
     'src/modules/auth/auth.docs.ts',
     'src/modules/users/user.docs.ts',
     // ... other modules
   ],
   ```

## Standardized User Responses

**IMPORTANT**: All endpoints that return user data MUST use consistent field naming and structure.

### User Response Structure

Always return user data as `{user}` (NOT `{profile}` or anything else).

### Token Storage (ACL Table)

- Store access/refresh tokens with unique indexes
- Track token validity with `isValid` flag
- Associate tokens with users via `userId` foreign key

### Middleware

- `validate`: Validates request body/query/params with Zod schemas
- `verifyToken`: Validates JWT and attaches user to request
- `checkPermissions`: Validates request with the permissions user has

### filterUser Utility

In `src/utils/methods.ts`:

```typescript
methods.filterUser(user: any, includeRole: boolean = false)
```

- Removes sensitive fields (password, otp, otpExpiry, socialId, etc.)
- Returns standardized user object
- Set `includeRole: true` to include role information
- Use in all auth endpoints to ensure consistent responses

## Error Handling

### Status Codes

- Define in `src/constants/statusCodes.ts`
- Structure: `{ code: number, statusCode: number, message: string }`
- Use consistent naming: `ReqSuccess`, `BadRequest`, `Unauthorized`, etc.

### Response Format

```typescript
methods.sendResponse(res, statusCodes.ReqSuccess, "Message", { data });
```

### Error Logging

```typescript
logger.error("Error description:", error);
```

## TypeScript Standards

### Naming Conventions

- **Interfaces/Types**: PascalCase with `I` prefix for interfaces (e.g., `ISigninInput`)
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE or camelCase for objects
- **Files**: kebab-case (e.g., `auth.controller.ts`)
- **Database Tables**: snake_case

### Type Safety

- Use explicit types for function parameters and return values
- Use `z.infer` for Zod schema types
- **IMPORTANT**: Avoid `any` at all costs - use `unknown` if type is truly unknown
- Use proper generics types for database operations

### Imports

- Use module aliases: `@app/path/to/module`
- Group imports: external packages, then internal modules
- Use named exports over default exports (except for routers)

## Code Quality

### General Principles

- **DRY**: Don't repeat yourself - extract common logic to services/utils
- **Single Responsibility**: Each function should do one thing well
- **Error First**: Return errors as first value in object destructuring
- **Async/Await**: Use async/await over promises
- **Logging**: Log all errors and important operations

### Best Practices

1. **Validation First**: Always validate with Zod schemas BEFORE any other middleware
2. **GET and POST Only**: Never use PUT, PATCH, or DELETE methods - use POST for updates/deletes
3. **Route Naming**: Use descriptive paths (`/read/get-all`, `/read/get-one`, `/create`, `/update`, `/delete`, and `/sudo/` (e.g., `/sudo/assign-role`))
4. **Middleware Order**: validate → verifyToken → checkPermissions → controller
5. **Pagination**: Always implement pagination for list endpoints with `page` and `limit`
6. **Error Handling**: Return `{ error: statusCodes.ErrorType }` from services
7. **Timestamps**: Always update `updatedAt` field when modifying records
8. **Try-Catch**: Wrap all service functions in try-catch with proper error logging
9. **Existence Checks**: Always check if record exists before update/delete operations
10. **Transactions**: Use transactions for multi-step database operations
11. **Hash Passwords**: Use bcrypt for password hashing
12. **No Sensitive Data**: Never expose passwords, tokens in API responses
13. **Indexes**: Add indexes for all foreign keys and frequently queried fields
14. **Controllers Thin**: Keep controllers minimal - business logic belongs in services
15. **Parallel Queries**: Use `Promise.all()` for independent database queries (data + count)
16. **Consistent User Responses**: Always return user data as `{user}` with standardized fields
17. **Use filterUser Utility**: Use `methods.filterUser(user, includeRole?)` for auth responses to remove sensitive data

## Security

### Authentication

- Hash passwords with bcrypt (salt rounds: 10+)
- Use JWT with proper expiry
- Implement refresh token rotation
- Validate tokens on every protected route

### Data Protection

- Never log sensitive data (passwords, tokens)
- Sanitize user input
- Use HTTPS in production
- Implement CORS properly
- Set secure headers with helmet (if used)

### Database Security

- Use parameterized queries (Drizzle ORM default)
- Implement proper access control
- Never expose database errors to client
- Use unique indexes to prevent duplicates

## Environment Variables

- Read .env.example

## Scripts

### Database Initialization

```bash
pnpm run db:seed
```

- Runs migrations
- Creates default permissions
- Creates default features
- Creates default roles with permissions

### Development

```bash
pnpm run dev      # Start dev server with nodemon
pnpm run build    # Build TypeScript
pnpm run lint     # Run ESLint
pnpm run format   # Run Prettier
```

## Testing (Future)

- Use Jest for unit tests
- Use Supertest for integration tests
- Test services independently
- Mock database for unit tests
- Use test database for integration tests

## Git Workflow

- Feature branches
- Descriptive commit messages
- Keep commits focused and atomic
- Review before merging

## Performance Optimization

1. Index frequently queried fields
2. Use Redis for caching
3. Implement pagination
4. Optimize N+1 queries with joins
5. Use database pooling (configured in db.ts)
6. Compress responses
7. Use CDN for static assets
8. **IMPORTANT**: Avoid unnecessary database calls - like if same thing is already happening somewhere else in the flow, don't do it again in another place, try to reuse it (e.g., validation should be done once at the start of the route, not repeated in service functions, or if there is some query that can be reused, don't run it again, pass the result to where it's needed)

## Monitoring & Logging

- Winston for application logs
- Log levels: error, warn, info, debug
- Monitor database query performance
- Track API response times

---

**Remember**:

- Keep it simple, stupid (KISS)
- You ain't gonna need it (YAGNI)
- Make it work, make it right, make it fast (in that order)
