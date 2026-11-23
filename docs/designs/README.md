# Bizora Stitch Design Handoff

This folder contains the exported Google Stitch design references for Bizora.

## Screens

| Screen | Screenshot | Source |
|---|---|---|
| Dashboard | `dashboard/screen.png` | `dashboard/code.html` |
| Customers | `customers/screen.png` | `customers/code.html` |
| Customer Profile | `customer-profile/screen.png` | `customer-profile/code.html` |
| Bookings & Scheduling | `bookings-scheduling/screen.png` | `bookings-scheduling/code.html` |
| Payments & Invoices | `payments-invoices/screen.png` | `payments-invoices/code.html` |
| Business Records | `business-records/screen.png` | `business-records/code.html` |
| Team & Employees | `team-employees/screen.png` | `team-employees/code.html` |
| Business Settings | `business-settings/screen.png` | `business-settings/code.html` |

## Design system

`DESIGN_SYSTEM.md` contains the exported Obsidian Orbit design system, including colours, typography, spacing, surfaces, component styling, and responsive layout guidance.

## Stitch project

[Open the Bizora Stitch project](https://stitch.google.com/projects/3372755946267105423)

## How to use these files

- Use each `screen.png` as the visual reference when implementing that page.
- Use the matching `code.html` as a supplementary reference for layout, content, and styling ideas.
- Use `DESIGN_SYSTEM.md` as the shared visual source of truth.
- Treat the exported HTML as design reference, not production-ready React code. Rebuild components in the project's React/TypeScript architecture and use the project's installed dependencies.
- Some HTML exports reference remote Google-hosted images, Google Fonts, Material Symbols, and the Tailwind CDN. Those dependencies may require an internet connection when previewing the HTML. They are not bundled local assets and should not be assumed available in production.
- Keep functionality, accessibility, responsiveness, and the approved Bizora requirements in mind while implementing. A screenshot is a design reference, not proof that a feature is functional.

## Export contents

- 8 screen screenshots (`screen.png`)
- 8 corresponding HTML source exports (`code.html`)
- 1 design-system document (`DESIGN_SYSTEM.md`)
