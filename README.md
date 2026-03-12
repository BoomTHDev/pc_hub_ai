# PC Hub

PC Hub is a production-oriented e-commerce platform for PC parts and IT equipment.

PC Hub คือระบบ e-commerce สำหรับขายอุปกรณ์คอมพิวเตอร์และ IT ที่แยก storefront ลูกค้าและ back-office ฝั่งแอดมิน/สตาฟออกจากกันชัดเจน

## Stack

- Frontend: Angular 21, Tailwind CSS v4
- Backend: Node.js, Express, TypeScript ESM
- Database: MySQL 8, Prisma v7 with `@prisma/adapter-mariadb`
- Media: Cloudinary
- Auth: JWT access token + refresh token rotation

## Implemented Scope

- Customer storefront: register, login, catalog, product detail, cart, checkout, order history, payment slip upload, profile, password change, address management
- Admin back office: dashboard, products, categories, brands, orders, payments, inventory, users
- Backend APIs: auth, catalog, cart, orders, payments, inventory, users
- Docker Compose for MySQL + phpMyAdmin

## Business Rules

- JWT expiry is configured with human-readable values in `backend/.env.example` such as `15m` and `7d`
- One active cart per user is enforced in the service layer with a transactional user-row lock to avoid duplicate active carts under concurrent requests
- PromptPay slip upload is one-time per payment
- Rejected PromptPay payments do not allow re-upload in the current business policy
- COD orders start as `CONFIRMED` and are auto-marked `COD_PAID` when delivered

## Prerequisites

- Docker Desktop
- Node.js 22 LTS recommended
- npm 11+

## Run Locally

1. Start infrastructure:

```bash
docker compose up -d
```

2. Create backend env from `backend/.env.example` and set real Cloudinary credentials.

3. Prepare the backend:

```bash
cd backend
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

4. Start the backend API:

```bash
cd backend
npm run dev
```

5. Start the frontend:

```bash
cd frontend
npm install
npm start
```

## Useful Scripts

- Backend: `npm run lint`, `npm run build`
- Frontend: `npm run typecheck`, `npm run build`

## Windows Note

If `frontend npm run build` fails with `spawn EPERM` on Windows, switch to Node.js 22 LTS. In this repository, Angular compiler type-check passes, but Angular's esbuild-based production build can fail under the current Node 24 Windows environment because child-process spawning with piped stdio is blocked.

## Default Ports

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- phpMyAdmin: `http://localhost:8081`

## Sample Accounts

- Admin: `admin@pchub.com` / `Admin@123`
- Staff: `staff@pchub.com` / `Staff@123`
- Customer: `customer@pchub.com` / `Customer@123`

## Project Structure

```text
backend/
  src/
    config/
    controllers/
    lib/
    middlewares/
    routes/
    schemas/
    services/
frontend/
  src/app/
    core/
    shared/
    features/
```
