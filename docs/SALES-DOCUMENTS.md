# PR #11 — Quotations & Contracts

## Scope
- Versioned schema for quotations and contracts.
- Tenant-scoped quotation list/create and status transitions; contract list/create from accepted quotations and status transitions.
- Server-side authorization and organization ownership checks; no client-provided organization IDs.
- A contract has a unique quotation reference, preventing duplicate contract creation for one accepted quotation.
- Values stored as PostgreSQL `numeric(18,2)` decimal strings.
- Interactive UI for quotation creation, status updates, and contract creation.

## Status workflow
Quotations: draft → sent → accepted / rejected / expired. Contracts: draft → signed → terminated.

**These are internal workflow statuses**, not proof of customer acceptance or legally binding electronic signatures. No email delivery, signature provider, PDF issuance, identity verification, or signed document storage exists in this PR.

## Migration
- `drizzle/0005_tense_whiplash.sql` committed and executed on Neon **development** only.
- `quotations` and `contracts` verified, migration ledger contains 6 entries.
- No seed records, no changes to Neon production.

## Limitations before release
- Live authenticated HTTP integration tests for RBAC, cross-tenant references, concurrent status updates and duplicate contract creation.
- Customer approval authenticity, legal text, approval and signature workflow; versioned immutable accepted quotations and contract amendment model.
- Audit trail on all status changes, separate authority for contract signing, email/PDF delivery.
- Pagination, linked client details and richer quote line items.
- Browser, responsive and accessibility QA when runtime testing resumes.
