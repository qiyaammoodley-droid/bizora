# Bizora | 4–5 minute capstone pitch and demo script

## Before recording
- Open the production app: https://bizora-qiyaam.vercel.app
- Sign in with your own demo account.
- Make sure the dashboard contains safe demo data. Do not show private customer information.
- Close unrelated browser tabs and notifications.
- Record your screen and microphone in Loom.
- Do not show passwords, Supabase keys, environment files or private account settings.

## 0:00–0:35 | Introduction and problem

"Hi, my name is Qiyaam Moodley, and this is Bizora, a business operations workspace designed for small service-based businesses.

Many small businesses manage customers, bookings and payments across spreadsheets, messaging apps and separate calendars. That information becomes fragmented, making everyday administration harder.

Bizora brings key workflows into one workspace so a business can manage customers, appointments and invoice balances in one place."

## 0:35–1:10 | Sign-in and workspace

"Bizora uses Supabase Authentication. Once a user signs in, the application checks their organisation membership and role before loading the business workspace.

This example is the Qiyaam FX workspace. The application is designed around organisation-scoped data, so each business works within its own workspace."

Show the signed-in workspace and dashboard. Do not reveal private personal data beyond what is necessary for the demo.

## 1:10–1:55 | Dashboard

"The dashboard gives the business an at-a-glance view of its operations. It shows active customers, today's bookings, upcoming appointments and outstanding invoice balances.

These figures are based on the records in the workspace. The upcoming bookings section also gives the user a quick way to move into scheduling."

Point to the dashboard cards and upcoming bookings list.

## 1:55–2:35 | Customers

"Customer management allows the business to maintain its customer records in one place. Users can add customers, find existing records, update details and archive records when they are no longer active."

Open Customers. Show the list and, if safe, open a record or demonstrate the add form without creating unnecessary duplicate data.

## 2:35–3:15 | Bookings and scheduling

"The scheduling module helps the business manage appointments. Users can create bookings, associate them with customers, review the schedule and update booking statuses as work progresses."

Open Bookings & Scheduling. Show a calendar/list view and a booking detail or form.

## 3:15–4:00 | Invoices and payments

"The invoicing module allows authorised users to create invoices with line items and record payments. It supports partial payments, so the outstanding balance can be tracked until the invoice is settled.

For this capstone, payments are manually recorded. The application does not connect to a live bank or payment gateway."

Open Payments & Invoices. Show an invoice and its payment history if safe. Do not create fake claims about a gateway integration.

## 4:00–4:35 | Technology and security

"The frontend is built with React, TypeScript, Vite and Tailwind CSS. Supabase provides authentication and PostgreSQL data storage. Row Level Security policies are used to help enforce organisation-level data access.

The project includes automated checks using ESLint, TypeScript builds and Vitest. At the time of this recording, four automated authentication lifecycle tests pass."

## 4:35–5:00 | Close and honest next steps

"Bizora is a working capstone MVP. The core implemented workflows are authentication, workspace setup, dashboard, customers, bookings, invoices and manually recorded payments.

Further work includes expanding automated test coverage, employee invitation management, advanced reporting, additional business records and payment gateway integration.

Thank you for watching my Bizora demonstration."

## After recording
1. Set Loom access to anyone with the link, if permitted by your course.
2. Copy the share URL.
3. Add it to the README under "Loom pitch and demo".
4. Send the URL to ChatGPT so the final submission checklist can be completed.
