# PR #12 — Invoices & Partial Payments

## Ledger and monetary correctness
- `invoices.amount` is the issued invoice amount; `invoices.paid_amount` is a persisted paid balance.
- A payment is accepted only when invoice status is `issued` or `partially_paid` **and** `paid_amount + payment <= amount`.
- A single atomic SQL statement updates the invoice row, inserts the payment row and writes the audit record. Concurrent payments serialize on the invoice UPDATE row lock.
- Partial payment sets status `partially_paid`; exactly paid invoice transitions to `paid`.
- Draft and voided invoices never accept payments. Voiding in this PR is limited to draft invoices.
- All amounts are PostgreSQL `numeric(18,2)`; the application uses decimal strings and BigInt-based formatting for precise calculations.
- Every query/write uses organization membership derived from the authenticated session. Finance write privilege is required to record payments.

## Features
- Invoice list, create draft, issue draft, receive payments, payment history and outstanding balance.
- A write-only accounting trail, no payment deletion or editable posted amounts.
- No automatic integration with legal contracts, bank transfers, payment gateways, taxes or vendor payments yet.

## Prerequisite data migration
- The existing `invoice_payments` table remains the append-only payment ledger.
- Drizzle must generate a new versioned migration adding `invoices.paid_amount numeric(18,2) default '0' not null`.
- Apply migration **only to Neon development** and verify ledger and column. Production remains untouched.

## Release blockers
- API integration tests of invalid credentials (401/403), cross-organization references (404), overpayment (409), and concurrent payment requests.
- Verify atomic rollback of all three mutations if payment/audit insertion fails; test SQL statement in development.
- Browser/mobile UAT, reconciliation and finance approval workflow.
- Production migration and release require separate approval; GitHub CI alone does not satisfy release gates.
