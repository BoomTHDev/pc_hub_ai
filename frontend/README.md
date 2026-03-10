# Frontend

Frontend for PC Hub built with Angular 21 standalone components and lazy-loaded customer/admin areas.

## Scripts

```bash
npm start
npm run typecheck
npm run build
```

## Notes

- API base URL is configured in `src/app/core/config/api.config.ts`
- Auth uses an HTTP interceptor with refresh-token rotation
- Full project setup is documented in the root `README.md`
