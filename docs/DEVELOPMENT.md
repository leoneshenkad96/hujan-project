# Event Organizer ERP — Development

MVP implementation is in the local archive `eventflow-erp-mvp.zip` and is **not yet imported into this branch**.

## Planned runtime
- Node.js 22+
- Native Node.js HTTP server
- SQLite via node:sqlite
- HTML, CSS, JavaScript

## Local commands (after importing sources)
```sh
npm start
npm run smoke
```

## Safety
- Never commit .env or SQLite database files.
- Demo credentials must not be used in production.
- No production deployment until security and financial workflows are hardened.
