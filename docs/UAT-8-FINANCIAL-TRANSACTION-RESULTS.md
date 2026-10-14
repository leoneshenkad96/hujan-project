# Vinca — Eight Financial & Database UAT Scenarios

Date: 2026-10-13. Source branch: `integration/final-uat`. Test database: Neon `fancy-cell-64250119` / disposable branch `br-fragrant-bar-b3ly8nfs`, cloned from isolated UAT `br-long-wildflower-b3nsciay`. All inserted records are synthetic.

**Scope:** SQL transactions and persisted database constraints; this is NOT authenticated HTTP API E2E nor a full UI/production signoff. No Vercel, production branch or main merge was used.

| # | Test | Actual evidence | Result |
|---|---|---|---|
| 1 | Quote with two persisted line items | JSON array length 2; quote total Rp44,400,000; discount Rp2,000,000; tax rate input 11% | PASS SQL fixture |
| 2 | Line subtotal, discount, tax, grand total | Rp30m + Rp12m − Rp2m = Rp40m taxable; test input 11% gives Rp4.4m tax and Rp44.4m total | PASS SQL expression; separate automated calculator unit tests exist |
| 3 | Revision and contract relationship | Accepted quote retained value Rp44.4m; new draft revision 2 linked by previous quotation ID with different amount; contract stays on accepted original amount | PASS DB relationship fixture; not API revision flow |
| 4 | PO + matched actual expense | PO Rp10m, two actual costs Rp6m + Rp3m, persisted matched balance Rp9m, remaining Rp1m | PASS SQL |
| 5 | Partial payment and outstanding | Issued invoice Rp10m, payments Rp2.5m + Rp3.5m, paid ledger Rp6m and outstanding Rp4m; status partially_paid | PASS SQL; not authenticated API or idempotency test |
| 6 | Reject PO overage | Attempt extra Rp2m against Rp1m available resulted in zero inserted expenses; matched balance stayed Rp9m | PASS conditional SQL; check constraint also installed |
| 7 | Concurrent transactions | Two independent concurrent SQL requests each attempt Rp700k on fresh Rp1m PO: 1 inserted, 1 rejected; final matched balance Rp700k, one expense row | PASS SQL concurrency sample; not HTTP API concurrency |
| 8 | Cross-tenant isolation | Two test organizations created; org-scoped SQL for the other org's events/quotes returned 0 rows; tenant-bound ownership lookups audited in API and guarded by regression tests | PASS for scoped SQL queries and static API checks; authenticated IDOR NOT YET VERIFIED |

**Final SQL reconciliation:** actual cost Rp9,700,000; all issued PO Rp11,000,000; remaining matched PO commitment Rp1,300,000; invoice cash recorded Rp6,000,000; outstanding Rp4,000,000. All values are exact numeric database amounts.

**Important limits and follow-ups:** Existing DB foreign keys enforce ID referential integrity but not universally composite (organization_id,id) ownership across all linked tables; application tenant guards are required, and authenticated two-organization IDOR testing remains mandatory. Synthetic direct SQL inserts bypass business API authorization, status transition handlers, and audit application code. A PASS here must never be described as proof of those flows. The disposable Neon branch is intentionally **retained** for reproducibility; deletion requires explicit user approval because it is destructive. Do not apply UAT test data to production or the principal UAT branch.

Next release gates: private Owner activation, authenticated live UAT of all eight API workflows with two distinct organization accounts, actual HTTP idempotency/concurrency, UI checks, and formal release signoff.
