# MilestoneGuard AI — Comprehensive Audit Report

**Date:** November 12, 2026  
**Auditor:** Full-Stack QA & Security Engine  
**Payment Mode Under Test:** `mock` & `sandbox`  
**Test Personas:** Client (*Aarav Mehta*), Freelancer (*Sara Khan*)

---

## Executive Summary
This audit evaluates MilestoneGuard AI across six dimensions:
1. **Runtime Stability & Console Hygiene** (hydration, uncaught errors, network failures)
2. **State Machine Integrity & Role Authorization** (server-side enforcement, double-funding, double-payout)
3. **Data Integrity & Server Source of Truth** (DB-backed amounts, idempotency, event audit trails)
4. **Honesty, Copy & Regulatory Conformance** (no false escrow terminology, accurate model labeling)
5. **Fintech Design System & Accessibility** (visual hierarchy, tabular numerals, WCAG AA contrast, responsiveness)
6. **PayPal Sandbox & Production Readiness** (REST token handling, deterministic batch IDs, health endpoint)

---

## Detailed Findings Table

| ID | Area | Problem | Severity | Proposed Fix |
|:---|:---|:---|:---:|:---|
| **SEC-01** | Authorization | API routes (`/api/projects`, `/api/payments/*`, `/api/milestones/[id]/approve`, `/api/milestones/[id]/revision`) did not enforce role authorization server-side; a user acting as Freelancer could approve payouts or fund milestones by invoking API routes directly. | **Blocker** | Extract active role from `mg_role` session cookie in API routes; enforce Client-only on project creation, funding, approval, and revision; enforce Freelancer-only on code submission and verification. Return 403 Forbidden on role mismatch. |
| **FIN-01** | State Machine | A milestone could theoretically be funded twice if multiple capture calls with different order IDs occurred; milestone status did not guard against capturing payments on already-funded milestones. | **Blocker** | Add strict server-side transition checks in `/api/payments/capture`. If milestone is not in `Created` status, only allow idempotent replay if the orderId matches the existing completed payment. Reject all other attempts with HTTP 400. |
| **FIN-02** | Idempotency | `/api/milestones/[id]/approve` returned a 400 error on retry if the milestone was already `PaidOut`, causing UI error toasts on network retries instead of graceful idempotent confirmation. | **Major** | Check if milestone is already in `PaidOut` status with an existing Payout record. Return `{ success: true, alreadyApproved: true, payout }` with HTTP 200 idempotently. |
| **FIN-03** | PayPal Payouts | `createPayPalPayout` generated randomized `sender_batch_id` using `Math.random()`, preventing PayPal Payouts API from deduplicating duplicate disbursement requests on transient network failures. | **Major** | Use deterministic `sender_batch_id` formatted as `MG_PAYOUT_M_{milestoneId}`. If a payout is retried, PayPal's Payouts engine guarantees deduplication and prevents double payouts. |
| **ENV-01** | Client Bundles & Config | `NEXT_PUBLIC_PAYMENT_MODE` and `NEXT_PUBLIC_DEMO_REPO_URL` were referenced in client components, but the server `.env` only defined `PAYMENT_MODE` and `DEMO_REPO_URL`. In production, client components fell back to hardcoded defaults instead of reflecting real server env vars. | **Major** | Provide a central `/api/health` configuration route and pass configuration from server layout/components down to client components; ensure no secrets are leaked to the client. |
| **REG-01** | Regulatory & Copy | Term "Milestone Escrow Value" was used in `src/app/projects/[id]/milestones/[mid]/page.tsx`, conflicting with the strict requirement never to use the word "escrow" except in the explicit non-escrow disclaimer. | **Major** | Replace "Milestone Escrow Value" with "Milestone Value" across UI components and documentation. |
| **AI-01** | Honesty & AI Labeling | Hardcoded string "Gemini 2.0 Flash Verified" was rendered in `src/app/page.tsx` and "Static AST inspection" was used instead of the accurate model name and verified description. | **Major** | Dynamically display the actual model name from `GEMINI_MODEL` (via `/api/health` or server props) or clean generic tag, and replace "Static AST inspection" with "Static analysis of repository contents; code is not executed". |
| **DEV-01** | Tooling & Linting | `npm run lint` stalled waiting for interactive configuration prompts because `.eslintrc.json` was missing. | **Major** | Create standard Next.js `.eslintrc.json` extending `next/core-web-vitals` so `npm run lint` executes non-interactively in CI and local CLI. |
| **API-01** | Validation | `/api/paypal/webhook` lacked Zod schema validation for webhook event payloads and headers. | **Minor** | Add comprehensive Zod schema validation to `/api/paypal/webhook` and ensure structured logging for missing `PAYPAL_WEBHOOK_ID`. |
| **OBS-01** | Observability | Missing `/api/health` endpoint to monitor payment mode, database status, and presence of required environment variables without leaking secrets. | **Minor** | Implement `GET /api/health` reporting `status`, `paymentMode`, `database: "connected"`, and boolean flags for each configured environment variable. |
| **UI-01** | Layout & Hierarchy | Milestone hero page placed acceptance criteria and verification report in asymmetrical columns; next action button was nested inside card rather than immediately visible at the top. | **Minor** | Unify layout hierarchy: horizontal status stepper and high-priority Next Action card at the top, followed by 2-column or tabbed Acceptance Criteria and Verification Report below. |
| **UI-02** | Currency Formatting | Currency formatting was occasionally inconsistent between `$1,500` and `$1,500.00`. | **Minor** | Standardize `formatCurrency` utility to always format amounts consistently with tabular figures (`num-tabular`) and locale currency formatting. |
| **UI-03** | Accessibility | Several icon-only buttons lacked explicit `aria-label` tags, and focus rings needed high-contrast ring tokens. | **Minor** | Add explicit `aria-label` attributes to all icon buttons and verify WCAG AA focus rings. |

---

## Verification Plan
1. **Phase 2:** Implement server-side role enforcement, strict idempotency for capture and approval, and robust Zod validation.
2. **Phase 3:** Scrub all non-disclaimer uses of "escrow", remove hardcoded "Gemini 2.0 Flash Verified" tags, and eliminate any placeholder copy.
3. **Phase 4:** Polish UI spacing, typography, tabular numbers, contrast, mobile responsiveness, and skeleton loaders.
4. **Phase 5:** Implement `/api/health`, deterministic payout batch IDs, and PayPal error handling with debug ID logging.
5. **Phase 6:** Expand unit tests for state machine and Zod validation, and update README documentation.

