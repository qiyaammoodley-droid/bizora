# Bizora Implementation Plan

**Status:** Initial plan  
**Method:** PRD → Stitch designs → plan → Issues/branches/PRs → TDD build → deploy

## Working agreements

- `main` remains deployable.
- Work through small, focused Issues and feature branches.
- Open a pull request for each coherent change.
- Run lint, typecheck, tests and build before merge.
- Write tests before or alongside implementation (TDD).
- Never commit secrets or real customer data.
- Do not mark a feature complete until its end-to-end acceptance criteria pass.

## Phase 0 — Repository and design foundation

Deliverables:
- Public repository and this documentation.
- Stitch project and exported designs in `docs/designs/`.
- Premium dark design system: charcoal surfaces, violet primary accent, restrained semantic colours.
- Responsive application shell and navigation.
- CI workflow.

Suggested issues:
1. Initialise client and server workspace.
2. Add linting, formatting and TypeScript configuration.
3. Establish design tokens and reusable UI primitives.
4. Build responsive application shell.
5. Add GitHub Actions CI.

## Phase 1 — Database, authentication and tenant security

Deliverables:
- Supabase project and hosted PostgreSQL.
- Versioned SQL migrations.
- Profiles, organisations and memberships.
- Supabase Auth integration.
- Owner and employee roles.
- RLS policies and API authorisation middleware.

Suggested issues:
6. Create initial schema and migrations.
7. Implement registration, login and logout.
8. Implement organisation creation and membership.
9. Implement owner/employee permissions.
10. Add cross-tenant isolation tests.

Security gate: do not proceed to real customer data until tenant isolation is tested through both API and database access paths.

## Phase 2 — Customer management

Deliverables:
- Customer list, search and filters.
- Create/edit/archive workflows.
- Customer detail view and service history shell.

Suggested issues:
11. Customer API and validation.
12. Customer list and search UI.
13. Customer create/edit forms.
14. Customer detail and archive workflow.

## Phase 3 — Scheduling and attendance

Deliverables:
- Appointment/session API.
- Calendar/list views.
- Staff assignment.
- Attendance status updates.

Suggested issues:
15. Appointment schema and API.
16. Scheduling UI.
17. Attendance workflow and tests.

## Phase 4 — Invoices and payments

Deliverables:
- Invoice creation and line items.
- Payment recording, including partial payments.
- Outstanding balance calculation.
- Transaction history.

Suggested issues:
18. Invoice API and calculations.
19. Invoice list and detail UI.
20. Record payment workflow.
21. Financial permissions and audit tests.

## Phase 5 — Records, dashboard and reports

Deliverables:
- Customer/service notes.
- Recent activity.
- Dashboard summaries derived from database records.
- Empty, loading and error states.

Suggested issues:
22. Customer records API/UI.
23. Dashboard metrics API.
24. Dashboard UI and responsive charts.
25. Operational report filters.

## Phase 6 — QA, deployment and handover

Deliverables:
- Unit, integration and end-to-end critical-path tests.
- CI required checks.
- Production environment variables and migrations.
- Frontend and API deployment.
- README with real URLs, screenshots, test instructions and known issues.
- Loom demonstration.

Suggested issues:
26. Complete critical-path test coverage.
27. Security and responsive QA.
28. Configure production deployment.
29. Add real screenshots and final documentation.
30. Prepare five-minute investor pitch and product demo.

## Branch naming

- `chore/project-setup`
- `feat/authentication`
- `feat/organisation-membership`
- `feat/customer-management`
- `feat/scheduling`
- `feat/invoices-payments`
- `feat/business-records`
- `feat/dashboard`
- `test/tenant-isolation`
- `docs/final-handover`

## Definition of done

A feature is complete only when:
1. Its acceptance criteria are met.
2. Data persists in the hosted database where applicable.
3. API authentication, authorisation and tenant scoping are enforced.
4. Loading, empty, success and error states are implemented.
5. Relevant tests pass.
6. Lint, typecheck and build pass.
7. The UI is responsive and consistent with Stitch designs.
8. Documentation is updated.
9. The PR is reviewed and merged.

## Deadline prioritisation

If time becomes constrained, prioritise secure authentication/tenant isolation, customer management, invoice/payment tracking and a minimal scheduling workflow. Reduce visual complexity and defer non-essential reporting rather than weakening access controls or presenting non-functional features as complete.
