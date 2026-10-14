# PR #05 — CRM & Sales Pipeline

## Implemented
- Protected and tenant-scoped `GET/POST /api/crm/clients`.
- Protected and tenant-scoped `GET/POST /api/crm/leads`.
- Pagination with bounded limits, status filtering for leads, search query for clients/leads.
- Validation and precision-safe sales estimates (`numeric(18,2)` values represented as strings).
- Sales/Owner/Admin may create clients and leads; read access follows `clients:read`.
- Every organization ID comes from authenticated session, not request body.
- A lead linked to a client is accepted only if the client belongs to that organization.

## Intentionally excluded from PR #05
- Real deals/quotation/invoice conversions, contract workflows, deletion and destructive edits.
- Browser E2E/runtime tests while Vercel deployments are intentionally paused.
- No production migrations or changes.

## Manual API UAT when runtime available
1. Authenticate a Sales user, GET and POST clients and leads.
2. Test pagination, filtering, malformed payload 400, and organization isolation.
3. Ensure Crew receives 403 and anonymous requests return 401.
4. Verify wrong-organization client IDs return 404.
5. Verify no token or personal data is logged.
