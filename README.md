# Vinca Event Organizer ERP

Next.js + React + TypeScript foundation for Vinca General EO ERP.

## Current status — PR #01
- Preview of the dashboard design with simulated data only.
- GET /api/health returns service health.
- No authentication, real database operations, billing, or CRUD is implemented yet.
- Do **not** use PR #01 for real financial/event records.

## Local setup
Node.js >=22 and npm required.

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

Visit http://localhost:3000.

## Deployment targets
- GitHub: leoneshenkad96/Event-Organizer-ERP-
- Vercel project: eo-erp (Kasapink team, separate project)
- Neon database project: ERP-eventorganizer (separate from ERP-Kasapink)

The Vercel production DATABASE_URL has been configured, but this foundation release does not connect to the database. Do not deploy to production until feature testing and security review are complete.

## Roadmap
PR #02 UI design system → #03 Drizzle/Neon → #04 Authentication/RBAC → #05 CRM → #06 Event projects → subsequent workflow and finance modules.
