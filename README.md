# Bizora

> **Working project name pending brand clearance.** A configurable business operations platform for service-based businesses.

Bizora is a capstone full-stack SaaS project exploring how small service businesses can manage customers, appointments, payments, staff and service records in one secure workspace.

> **Project status:** Planning / initial repository setup. Features, hosting and integrations are not yet complete. This README must be updated as real work is merged and deployed.

## Project links

- **Live application:** Not deployed yet
- **Stitch project:** Add the actual Stitch URL after creating the project
- **Business overview:** [BUSINESS.md](BUSINESS.md)
- **Product requirements:** [docs/PRD.md](docs/PRD.md)
- **Implementation plan:** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

## MVP features

- Authentication and organisation workspaces
- Owner and employee roles
- Customer management
- Scheduling and attendance
- Invoices and manually recorded payments
- Customer/service records and basic reporting

## Technology stack

- Frontend: React, TypeScript, Vite and Tailwind CSS
- Backend: Node.js, Express and TypeScript
- Database: Supabase-hosted PostgreSQL
- Authentication: Supabase Auth
- Authorisation: Express middleware plus PostgreSQL Row Level Security
- Testing: Vitest, React Testing Library and Supertest
- Hosting target: Netlify (frontend), Render (API), Supabase (database/auth)
- CI: GitHub Actions

The final stack and deployment providers may be adjusted if required, but any change must be documented.

## Repository structure

```text
client/                 React frontend (planned)
server/                 Express API (planned)
supabase/migrations/    SQL migrations (planned)
docs/
  PRD.md
  designs/              Stitch exports (add actual exports)
  architecture.md
  testing.md
.github/workflows/      CI workflows
BUSINESS.md
IMPLEMENTATION_PLAN.md
README.md
```

## Architecture overview

The browser application communicates with the Express REST API. Supabase Auth provides identity. The API verifies access tokens and enforces organisation membership and role permissions. PostgreSQL stores organisation-scoped data. Row Level Security provides an additional database-level isolation boundary.

Never rely on frontend route hiding as an authorisation control. Never expose the Supabase service-role key in browser code.

## Local development

The application folders are being created during implementation. Once the frontend and backend packages exist, setup instructions will be added here with exact commands and required environment variables.

Expected environment configuration (use local `.env` files and hosting secrets; never commit secrets):

**Client**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`

**Server**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, if required)
- `PORT`
- `CORS_ORIGIN`

Add `.env.example` files containing placeholder variable names only. Do not put real credentials in Git.

## Tests and quality checks

Exact commands will be added when package scripts are implemented. Required PR checks:
- Lint
- Typecheck
- Unit and integration tests
- Production build

## Demo access

No demo accounts exist yet. Add dedicated test credentials only after creating non-sensitive demo accounts in the deployed environment. Never publish real user credentials or private customer data.

## Screenshots

Add genuine screenshots from the working application to `docs/designs/` or a dedicated `docs/screenshots/` directory. Do not use mockups as evidence of implemented functionality.

## Known issues / current limitations

- The application has not yet been implemented or deployed.
- Stitch designs have not yet been exported.
- Hosting URLs and test logins are not available.
- Brand name clearance is outstanding.
- Pilot workflows and pricing require customer validation.

## Business and product documentation

- [Business overview](BUSINESS.md)
- [Product requirements document](docs/PRD.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md)
