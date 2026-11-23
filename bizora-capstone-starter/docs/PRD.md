# Product Requirements Document — Bizora

**Version:** 1.0  
**Status:** Initial specification; validate with users before treating assumptions as final.

## 1. Product summary

Bizora is a multi-tenant business operations SaaS for small and medium-sized service businesses. It provides a shared workspace for customer records, staff, scheduling, invoices, payments and service histories.

## 2. Problem

Target businesses often coordinate customers, schedules, payments and records across disconnected tools. This increases administrative effort and makes operational information harder to reconcile.

## 3. Goals

- Centralise common service-business workflows.
- Make payment status and outstanding balances visible.
- Support scheduling and attendance.
- Maintain useful customer and service histories.
- Allow multiple organisations to use the same application without accessing one another's data.
- Deliver a responsive, accessible interface.

## 4. Non-goals for MVP

- Inventory and warehouse management
- Payroll
- Full accounting, tax filing or bookkeeping
- Online payment gateway processing
- Marketing automation
- Native mobile applications
- Complex workflow builder
- Public customer portal

## 5. Users and permissions

### Owner
- Manage organisation settings and workspace.
- Invite and manage employees.
- Create, view and update customers, appointments, invoices and payments.
- View organisation reports.

### Employee
- View permitted customers and assigned appointments.
- Create/update operational records within assigned permissions.
- Record attendance and service notes.
- Cannot manage billing settings, invite owners or access restricted financial reports unless explicitly granted.

Platform support access is not part of the MVP. Any future support access must be audited and tightly controlled.

## 6. Functional requirements

### FR-01 Authentication and workspace
- Users can register, sign in and sign out.
- An owner can create an organisation.
- An owner can invite an employee.
- Users must belong to an organisation before accessing its workspace.
- API requests must verify identity, membership, role and organisation scope.

### FR-02 Customer management
- Create, view, update, search and archive customers.
- Store only information needed for the business workflow.
- Support customer category and contact details.
- Maintain organisation-scoped customer records.
- Where a business works with children, support guardian contact and consent metadata only where necessary and after privacy review.

### FR-03 Scheduling and attendance
- Create appointments or group sessions.
- Assign a service, staff member and one or more customers as appropriate.
- Store start/end time and status.
- Record attendance.
- Detect conflicting assignments where applicable.

### FR-04 Invoices and payments
- Create invoices with line descriptions, amounts, due dates and customer.
- Record full or partial payments.
- Calculate outstanding balance from invoice total less valid recorded payments.
- Maintain payment history and audit events.
- Do not claim that a manually recorded payment has been verified by a bank or gateway.

### FR-05 Business records
- Create dated customer/service notes.
- Attribute records to the staff member who created them.
- Restrict sensitive notes by role.
- Allow authorised users to review a customer's service history.

### FR-06 Dashboard and reports
- Display organisation-scoped counts and summaries.
- Show upcoming appointments, recent activity and invoice/payment summaries.
- Derive figures from persisted records, not hardcoded sample data.
- Clearly handle empty states.

## 7. Non-functional requirements

- Responsive layouts for mobile, tablet and desktop.
- Server-side validation for all writes.
- PostgreSQL foreign keys and constraints.
- Organisation isolation enforced by database policies and API authorisation.
- Passwords handled by Supabase Auth, not stored by the application.
- Secrets kept out of source control.
- Accessible labels, keyboard focus and status text.
- Useful error handling and auditability for financial changes.

## 8. Data model — initial entities

- `profiles`: application profile linked to auth identity
- `organisations`: tenant/business workspaces
- `memberships`: user-to-organisation relationship and role
- `customers`: organisation-owned customer records
- `services`: services offered by an organisation
- `appointments`: scheduled service events
- `appointment_customers`: customers attending an event
- `invoices`: customer billing documents
- `invoice_items`: invoice line items
- `payments`: recorded payments against invoices
- `customer_records`: dated service notes/observations
- `audit_logs`: important changes to financial and access records

Every tenant-owned table must include `organisation_id`, with appropriate composite foreign keys or equivalent constraints to prevent cross-tenant references.

## 9. Acceptance criteria

- An unauthenticated user cannot access protected API endpoints.
- An employee cannot perform owner-only actions.
- A user in Organisation A cannot read or modify Organisation B data by changing an ID in a request.
- Customer create/read/update/archive workflows persist in the hosted database.
- Appointment creation and attendance updates persist and are organisation-scoped.
- Invoice totals and outstanding balances are calculated consistently.
- Payment records are linked to the correct organisation and invoice.
- Dashboard summaries are derived from real records.
- Critical workflows have automated tests.
- The deployed application works at desktop and mobile breakpoints.

## 10. Privacy and safety

The product may be used by organisations working with children. The MVP should collect the minimum data required, use least-privilege permissions, protect sensitive notes, record consent where appropriate and undergo a POPIA review before real children's information is entered. The platform is not a medical or developmental diagnostic tool.

## 11. Success measures

Pilot targets will be set after baseline interviews. Measure task completion time, payment reconciliation accuracy, scheduling reliability, active usage and user satisfaction. Do not report targets as achieved results.
