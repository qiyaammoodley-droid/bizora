
# Bizora Frontend

Bizora is a business operations platform designed to help service-based businesses manage their customers, bookings, employees, invoices and business activities from one central workspace.

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Vitest
- React Testing Library

## Getting Started

### Requirements

- Node.js
- npm

### Installation

From the `client` directory, install dependencies:

```bash
npm install
```

### Development Server

Start the local development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Runs TypeScript checks and creates a production build |
| `npm run preview` | Previews the production build |
| `npm run lint` | Runs ESLint |
| `npm run test` | Starts Vitest in watch mode |
| `npm run test:run` | Runs automated tests once |

## Project Structure

```text
client/
├── public/
├── src/
│   ├── assets/
│   ├── test/
│   │   ├── App.test.tsx
│   │   └── setup.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Design System

The frontend follows the Bizora Premium Dark design system.

- Background: `#10131C`
- Sidebar: `#131824`
- Surface: `#191E2B`
- Primary: `#8B7CFF`
- Success: `#27C99A`
- Typography: Inter

Design references and exported Stitch screens are available in:

`../docs/designs/`

## Testing

Automated tests are written using Vitest and React Testing Library.

Run the test suite:

```bash
npm run test:run
```

## Development Guidelines

- Use TypeScript for application components.
- Follow the established Bizora design system.
- Write tests for new functionality.
- Run linting and production builds before submitting changes.
- Submit development work through feature branches and Pull Requests.

## Project Status

Frontend foundation established.

Authentication, database integration, customer management, scheduling and other business features will be implemented in subsequent development phases.
