# Bizora

**A business operations workspace for service-based businesses.**

Bizora is a multi-tenant SaaS capstone project that brings customer management, appointment scheduling, invoices and manually recorded payments into one workspace.

## Project links

- **Live application:** https://bizora-qiyaam.vercel.app
- **GitHub repository:** https://github.com/qiyaammoodley-droid/bizora
- **Portfolio:** https://qiyaam-moodley.netlify.app/
- **Loom pitch and demo:** _Add the recording URL here after recording._

## What Bizora does

Bizora is designed to help small service businesses keep essential operational information together instead of relying on disconnected spreadsheets, messages and calendars.

### Implemented in the current MVP

- **Authentication:** Supabase Auth registration, sign-in and sign-out.
- **Business workspace:** organisation setup and workspace membership lookup.
- **Dashboard:** live workspace summaries for active customers, today's bookings, upcoming bookings and outstanding invoice balances.
- **Customer management:** create, view, update, search and archive customer records.
- **Bookings and scheduling:** create and manage bookings, view schedules and update booking statuses.
- **Invoices and payments:** create invoices with line items, manage invoice status and manually record cash, EFT, card or other payments, including partial payments.
- **Role restrictions:** financial pages are restricted to owner/admin roles in the application.
- **Tenant-aware data access:** organisation-scoped queries and Supabase Row Level Security policies.

### Not implemented / future work

The sidebar includes additional planned areas such as Business Records, Reports & Analytics, Team & Employees, Business Settings and Roles & Permissions. These should not be considered completed workflows in this capstone build.

Other future work includes employee invitation management, advanced reporting, customer/service notes, automated payment gateway integration, stronger end-to-end test coverage and production hardening.

**Payment note:** Bizora currently records payments entered by an authorised user. It does not process or independently verify bank or card transactions through a payment gateway.

## Technology stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 3
- Supabase Auth
- Supabase PostgreSQL
- PostgreSQL Row Level Security (RLS)
- Vitest and React Testing Library
- GitHub Actions
- Vercel (production frontend hosting)

The frontend communicates directly with Supabase using the Supabase JavaScript client. This repository does not currently use a separate Express API server.

## Architecture overview

1. A user authenticates through Supabase Auth.
2. The application retrieves the user's organisation membership and role.
3. The application loads organisation-scoped records from Supabase.
4. PostgreSQL RLS policies provide database-level access control in addition to the application's role-based UI restrictions.
5. Dashboard summaries are calculated from stored customer, booking and invoice/payment records.

The Supabase publishable/anon key is intended for browser use with correctly configured RLS. Never place a Supabase service-role key or other privileged secret in frontend code.

## Run locally

### Requirements

- Node.js (22.x recommended for the deployed project)
- npm
- Access to the Bizora Supabase project, or your own configured Supabase project

### Setup

```bash
git clone https://github.com/qiyaammoodley-droid/bizora.git
cd bizora
cd client
npm install
```

Create a `.env.local` file inside the `client` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit real credentials. Use your own Supabase project credentials if you are setting up a separate environment.

Start the development server:

```bash
npm run dev
```

Vite will print the local development URL, usually http://localhost:5173.

## Quality checks

Run these commands from the repository root:

```bash
npm --prefix client run lint
npm --prefix client run build
npm --prefix client run test:run
```

Latest local verification recorded for the dashboard integration:
- ESLint: passed
- TypeScript and Vite production build: passed
- Vitest: 4 tests passed

The current automated tests focus on the app's authentication/session lifecycle. They do not represent comprehensive end-to-end coverage of every customer, booking or invoice workflow.

The production build currently emits a Vite chunk-size advisory for a JavaScript bundle above 500 kB. The build still succeeds; code splitting is a future optimisation.

## Security and privacy notes

- Keep Supabase credentials out of source control.
- Do not expose the Supabase service-role key to the browser.
- Keep RLS enabled and review policies whenever schema or access rules change.
- Do not use real sensitive customer or children's data in a demo environment without an appropriate privacy review, lawful basis and safeguards.
- The application is a capstone MVP, not a certified accounting, payment-processing or compliance product.

## Current limitations

- Additional sidebar modules are placeholders/planned rather than completed workflows.
- Payments are manually recorded; no payment gateway is connected.
- The automated test suite is small and needs broader workflow and security coverage.
- Production readiness, privacy compliance and commercial name clearance require further review.
- Dashboard figures depend on the records available in the signed-in workspace.

## Product documentation

- [Business overview](BUSINESS.md)
- [Product requirements](docs/PRD.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md)

## Demo

A short Loom walkthrough will be linked here after the final recording is published.

---

**Built as a full-stack development capstone project.**
