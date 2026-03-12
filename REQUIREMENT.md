# REQUIREMENT.md — PC Hub E-Commerce Platform

## ภาพรวมโปรเจกต์ / Project Overview

**PC Hub** คือ e-commerce platform สำหรับขายอุปกรณ์คอมพิวเตอร์และ IT equipment ระดับ production-ready มีทั้ง customer-facing storefront และ admin back-office

## Tech Stack

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| Frontend      | Angular 21, Tailwind CSS v4           |
| Backend       | Node.js, Express.js, TypeScript (ESM) |
| Database      | MySQL 8.0                             |
| ORM           | Prisma v7 (`@prisma/adapter-mariadb`) |
| Image Storage | Cloudinary                            |
| Auth          | JWT (access + refresh token rotation) |
| Validation    | Zod                                   |
| Container     | Docker Compose                        |

## Unified User Model

ใช้ **User model เดียว** แบ่ง role:

| Role         | Capabilities                                                                              |
| ------------ | ----------------------------------------------------------------------------------------- |
| **CUSTOMER** | Browse, cart, checkout, pay (PromptPay QR / COD), view orders, manage profile & addresses |
| **STAFF**    | Manage products/categories/brands, review payments, manage orders/inventory               |
| **ADMIN**    | All STAFF + user management (create staff, toggle active)                                 |

> **หมายเหตุ:** ไม่มี model `Customer` แยก — `User` model เดียวมี `role: UserRole {ADMIN, STAFF, CUSTOMER}`  
> Relations: `UserAddress`, `Cart`, `PurchaseOrder` ใช้ `userId` ทั้งหมด

## Core Business Flows

### 1. Shopping Flow

Browse → Add to Cart → Checkout → Order Created (atomic: validate stock → create order → deduct stock → log inventory → mark cart as checked out)

### 2. PromptPay Payment

Order created (PENDING_PAYMENT) → Customer uploads slip (WAITING_PAYMENT_REVIEW) → Admin reviews → APPROVE (CONFIRMED) / REJECT (PAYMENT_REJECTED, no re-upload)

### 3. COD Payment

Order created (CONFIRMED immediately) → PREPARING → SHIPPED → DELIVERED (auto marks COD_PAID)

### 4. Order Status Machine

```
PENDING_PAYMENT → CANCELLED
WAITING_PAYMENT_REVIEW → CANCELLED
PAYMENT_REJECTED → CANCELLED
CONFIRMED → PREPARING / CANCELLED
PREPARING → SHIPPED / CANCELLED
SHIPPED → DELIVERED
DELIVERED → (terminal)
CANCELLED → (terminal, stock restored)
```

### 5. Inventory Management

Restock, Adjustment In/Out, Return In/Out — all logged as `InventoryTransaction` with atomic stock update.

## Architecture

```
backend/src/
├── config/env.ts              # Zod-validated environment config
├── lib/                       # Shared utilities (prisma, errors, response, logger, password, jwt, cloudinary)
├── middlewares/                # Express middleware (error-handler, validate, auth, role-guard, upload)
├── schemas/                   # Zod schemas per domain
├── services/                  # Business logic layer
├── controllers/               # HTTP request/response handling
├── routes/                    # Express route definitions
├── app.ts                     # Express bootstrap
└── server.ts                  # Entry point
```

**Pattern:** `route → middleware (validate + auth) → controller → service → prisma`

## API Endpoints

### Auth (`/api/auth`)

- `POST /register` — Register customer
- `POST /login` — Login (all roles)
- `POST /refresh` — Refresh tokens (rotation)
- `POST /logout` — Logout (revoke refresh token)
- `GET /profile` — Get current user [Auth]
- `POST /change-password` — Change password [Auth]
- `POST /staff` — Create staff/admin [Admin]

### Categories (`/api/categories`)

- `GET /` / `GET /:id` — Read (public)
- `POST /` / `PUT /:id` / `DELETE /:id` — Write [Staff]

### Brands (`/api/brands`)

- Same pattern as Categories

### Products (`/api/products`)

- `GET /` — List with filters (public)
- `GET /:id` / `GET /slug/:slug` — Detail (public)
- `POST /` / `PUT /:id` / `DELETE /:id` — CRUD [Staff]
- `POST /:id/images` / `DELETE /:id/images/:imageId` — Images [Staff]
- `PUT /:id/attributes` — Attributes [Staff]

### Cart (`/api/cart`) [Auth]

- `GET /` — Get active cart
- `POST /items` — Add item
- `PUT /items/:productId` — Update quantity
- `DELETE /items/:productId` — Remove item
- `DELETE /clear` — Clear cart

### Orders (`/api/orders`)

- `POST /checkout` — Checkout [Auth]
- `GET /my` / `GET /my/:id` — Customer orders [Auth]
- `GET /` / `GET /:id` — All orders [Staff]
- `PATCH /:id/status` — Update status [Staff]

### Payments (`/api/payments`)

- `POST /:id/slip` — Upload slip [Auth]
- `GET /` / `GET /:id` — List/detail [Staff]
- `POST /:id/review` — Review payment [Staff]
- `POST /:id/cod-paid` — Mark COD paid [Staff]

### Inventory (`/api/inventory`) [Staff]

- `GET /` — List transactions
- `GET /low-stock` — Low stock report
- `POST /` — Create transaction

### Users (`/api/users`)

- `PUT /profile` — Update profile [Auth]
- CRUD `/addresses` — Address management [Auth]
- `GET /` — List users [Admin]
- `PATCH /:id/active` — Toggle active [Admin]

## Delivery Status

### Phase 5: Frontend Customer Features

Implemented: auth pages, product listing/detail, cart, checkout, order history, profile, password change, and address management.

### Phase 6: Frontend Admin

Implemented: admin layout, dashboard, and management pages for products, categories, brands, orders, payments, inventory, and users.

### Phase 8: Documentation

Implemented: bilingual root README.md and project run instructions.

## Environment Variables

See `backend/.env.example` for all required variables.

> **สำคัญ:** ต้องใส่ Cloudinary credentials (CLOUD_NAME, API_KEY, API_SECRET) เพื่อให้ image upload ทำงาน

## How to Run

```bash
docker compose up -d              # MySQL + PHPMyAdmin
cd backend && npm run dev         # API server :3000
cd frontend && npx ng serve       # Angular :4200
npx prisma db push                # Sync schema
npx tsx prisma/seed.ts            # Seed sample data
```

### Sample Accounts

| Role     | Email              | Password     |
| -------- | ------------------ | ------------ |
| Admin    | admin@pchub.com    | Admin@123    |
| Staff    | staff@pchub.com    | Staff@123    |
| Customer | customer@pchub.com | Customer@123 |
