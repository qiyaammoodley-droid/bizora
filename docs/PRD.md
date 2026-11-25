# Bizora Product Requirements and Delivery Status

**Product:** Bizora  
**Version:** Capstone MVP, November 2026  
**Status:** Core operational MVP deployed; additional modules remain planned.

## 1. Product summary

Bizora is a multi-tenant business operations workspace for service-based businesses. It brings customer management, booking/scheduling, invoicing and manually recorded payments into one application.

## 2. Problem and intended users

Small service businesses may coordinate customers, appointments and payments across spreadsheets, messages, calendars and separate records. Bizora aims to centralise these core workflows.

Primary users are business owners and authorised staff members. The application currently supports an organisation workspace and role-aware access patterns.

## 3. Delivered MVP scope

The following core areas are implemented and have been exercised by the project owner:

### Authentication and workspace
- Supabase Auth sign-in and sign-out.
- Workspace setup for a business.
- Membership lookup to associate a signed-in user with an organisation.
- Role information loaded for the workspace.

### Dashboard
- Active customer count.
- Today's bookings.
- Upcoming bookings.
- Outstanding invoice balance and overdue invoice count for owner/admin users.
- Navigation shortcuts to core modules.

### Customers
- Customer records can be created, viewed, updated, searched and archived.
- Customer data is scoped to the organisation.

### Bookings and scheduling
- Booking creation and management.
- Customer association.
- Schedule/calendar views.
- Booking status updates.

### Invoices and payments
- Invoice creation with line items.
- Invoice status management.
- Manual recording of payments, including partial payments.
- Outstanding balance and payment history.
- Financial page access restricted to owner/admin roles in the application.

**Payment limitation:** The current implementation records payments entered by a user. It does not connect to a payment gateway or independently verify bank/card transactions.

## 4. Planned / incomplete scope

These areas may appear in navigation or initial product planning but are not completed end-to-end workflows in the current capstone build:
- Business Records / customer service notes
- Advanced Reports & Analytics
- Team & Employees management and invitation workflow
- Business Settings
- Roles & Permissions administration UI
- Automated payment gateway integration
- Advanced audit log and expanded end-to-end testing

Do not represent these as completed features in a presentation or portfolio.

## 5. Technology and architecture

- React 19, TypeScript, Vite 6 and Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase JavaScript client
- PostgreSQL Row Level Security (RLS)
- Vitest and React Testing Library
- GitHub Actions CI
- Vercel frontend deployment

The browser application communicates directly with Supabase. The current repository does not contain a separate Express API service.

## 6. Security requirements

- Authentication is handled by Supabase Auth.
- Organisation membership and role are loaded for the authenticated user.
- Organisation-scoped access must be enforced through database RLS policies, not only frontend navigation.
- The Supabase service-role key must never be exposed in browser code.
- Financial workflows must preserve invoice/payment integrity.
- Sensitive customer information must be minimised and protected.

## 7. Non-functional requirements

- Responsive desktop and mobile layouts.
- Clear loading, empty and error states.
- Form validation and understandable error messages.
- Persistent data stored in Supabase.
- Secrets excluded from source control.
- Accessible labels and keyboard interaction.
- Automated checks for critical logic.

## 8. Verification status

Latest local checks after dashboard integration:
- ESLint: passed.
- TypeScript and Vite production build: passed.
- Vitest: 4 tests passed.

The current four automated tests cover the app's authentication/session lifecycle. They do not provide comprehensive automated coverage for all customer, booking, invoice, RLS and tenant-isolation scenarios. The project owner also manually verified the core pages locally and shared a screenshot of the deployed dashboard.

## 9. Known limitations and future work

- Broaden automated tests, especially RLS/tenant isolation and customer, booking and invoice workflows.
- Complete unfinished sidebar modules or remove them from navigation until ready.
- Add employee invitations and membership management.
- Add advanced operational reporting.
- Add business records/service notes with appropriate access controls.
- Consider a payment gateway only after provider, security and reconciliation requirements are defined.
- Complete production privacy and security review before onboarding real businesses.
- Confirm commercial name availability before public commercial launch.

## 10. Privacy note

Businesses may store sensitive customer information. The MVP should use test data for demonstrations. Before real-world use, review applicable privacy obligations, data minimisation, retention, access controls and consent requirements, especially if the product is used to store children's information.
