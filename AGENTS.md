# AGENTS.md — AI Agent Guidelines for PC Hub

## 🚨 กฎเหล็ก / Strict Rules

### 1. ห้ามใช้ `any`, `unknown`, `as Type` อย่างเด็ดขาด

```typescript
// ❌ ห้ามทำ
const input = req.body as RegisterInput;
const id = req.params.id as string;
const query = req.query as unknown as ProductQuery;
(req as any).parsedQuery = result.data;

// ✅ ให้ใช้ Express Generics แทน
const handler: RequestHandler<{ id: string }, unknown, RegisterInput> = (
  req,
  res,
  next,
) => {
  const input = req.body; // TS knows it's RegisterInput
  const id = req.params.id; // TS knows it's string
};

// ✅ หรือใช้ typed Request
type TypedRequest<P = object, B = object, Q = object> = Request<
  P,
  unknown,
  B,
  Q
>;

function create(
  req: TypedRequest<object, CreateCategoryInput>,
  res: Response,
  next: NextFunction,
) {
  const input = req.body; // Type-safe, no cast needed
}
```

### 2. Response Envelope มาตรฐาน

```typescript
// ทุก response ต้องผ่าน helper functions
sendSuccess(res, data, statusCode?)
sendPaginated(res, data, total, page, limit)
sendError(res, statusCode, code, message, details?)
```

### 3. Error Handling

```typescript
// ใช้ AppError factory functions เท่านั้น
errors.badRequest("message");
errors.unauthorized();
errors.forbidden();
errors.notFound("Resource not found");
errors.conflict("Already exists");
errors.internal();

// ห้าม throw new Error() ตรงๆ ใน service/controller
```

### 4. Validation ต้องผ่าน Zod Middleware

```typescript
// ทุก route ที่รับ body/query/params ต้องมี validate() middleware
router.post("/", validate(createSchema), controller.create);
router.get("/", validate(querySchema, "query"), controller.findAll);
```

### 5. Auth & Authorization Pattern

```typescript
// Public routes: ไม่ต้องมี middleware
router.get("/", ctrl.findAll);

// Authenticated routes: ใช้ authenticate
router.get("/profile", authenticate, ctrl.getProfile);

// Role-based routes: authenticate + requireRole/requireStaff/requireAdmin
router.post("/", authenticate, requireStaff, ctrl.create);
```

## Architecture Rules

### Layer Responsibilities

| Layer          | Responsibility                               | ห้ามทำ                              |
| -------------- | -------------------------------------------- | ----------------------------------- |
| **Route**      | Define endpoints, mount middleware           | Business logic                      |
| **Middleware** | Validate, authenticate, authorize, upload    | Query database                      |
| **Controller** | Parse request, call service, send response   | Business logic, direct Prisma calls |
| **Service**    | Business logic, Prisma queries, transactions | Send HTTP responses                 |
| **Lib**        | Shared utilities (JWT, password, cloudinary) | Import from services                |

### File Naming Conventions

```
schemas/     → {domain}.schema.ts
services/    → {domain}.service.ts
controllers/ → {domain}.controller.ts
routes/      → {domain}.routes.ts
```

### Import Rules

- ทุก import ต้องใช้ `.js` extension (ESM requirement)
- Import Prisma types จาก `../generated/prisma/client.js`
- Import Zod inferred types ด้วย `z.infer<typeof schema>`

## Prisma v7 Specifics

### Configuration

- **Config file:** `prisma.config.ts` (NOT in schema.prisma)
- **Generator:** `provider = "prisma-client"` with `output = "../src/generated/prisma"`
- **Adapter:** `@prisma/adapter-mariadb` (constructor takes connection string directly)
- **ESM:** `"type": "module"` in package.json, `"module": "ESNext"` in tsconfig

### Prisma Client Usage

```typescript
// Import from generated output path
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Constructor takes connection string
const adapter = new PrismaMariaDb(env.DATABASE_URL);
export const prisma = new PrismaClient({ adapter });
```

### Atomic Operations

```typescript
// ใช้ $transaction สำหรับ multi-step operations
await prisma.$transaction(async (tx) => {
  // ทุก query ใน block นี้ต้องใช้ tx แทน prisma
  await tx.product.update(...);
  await tx.inventoryTransaction.create(...);
});
```

## Frontend Guidelines (Angular 21)

### Architecture

- **Standalone components** (ไม่ใช้ NgModule)
- **Lazy-loaded** customer / admin feature areas
- **HTTP Interceptor:** inject Bearer token, auto-refresh on 401
- **Route Guards:** `authGuard`, `roleGuard`

### Component Organization

```
app/
├── core/          # Services, guards, interceptors, models (singleton)
├── shared/        # Reusable components, UI primitives
└── features/      # Feature-specific pages (lazy-loaded)
```

### Styling

- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- Custom theme defined in `styles.css` with `@theme` directive
- ห้ามใช้ inline styles หรือ hardcoded colors

### Type Safety

```typescript
// ✅ Define API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { pagination: Pagination };
}

// ✅ Use generics in HTTP service
this.http.get<ApiResponse<Product[]>>("/api/products");
```

## Common Pitfalls

1. **`req.query` is read-only** in Express — ใช้ `Object.defineProperty` หรือ Express generics
2. **Prisma Decimal** — ต้อง convert ด้วย `Number()` ก่อนคำนวณ
3. **`expiresIn` type** — `@types/jsonwebtoken` ต้องการ `number` ไม่ใช่ `string`
4. **PrismaMariaDb** — ตัว `b` เล็ก (ไม่ใช่ `PrismaMariaDB`)
5. **Shadow database** — ใช้ `prisma db push` แทน `prisma migrate dev` ถ้า DB user ไม่มีสิทธิ์สร้าง database

## Current Status

- ✅ Phase 1: Infrastructure & Scaffolding
- ✅ Phase 2: Backend Core (Auth, Middleware, Utilities)
- ✅ Phase 3: Backend Domain APIs (all endpoints)
- ✅ Phase 5: Frontend Customer Features
- ✅ Phase 6: Frontend Admin Features
- ✅ Phase 8: Documentation
