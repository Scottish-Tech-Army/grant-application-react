# GrantFlow — Grant Application Manager

A full-stack, modern dashboard web application for managing grant and funding applications. Built for charities and non-profits to store reusable information, manage multiple applications, track field versions, and export formatted Q&A pairs.

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS        |
| Backend   | Node.js, Express                    |
| Database  | SQLite via `sql.js` (pure JS/WASM)  |
| Icons     | Lucide React                        |

## Features

- **Dashboard** — Overview stats, recent applications, field group summary
- **Common Fields** — Reusable Q&A pairs, grouped by category, with full version history
- **Applications** — Create, edit, and manage grant applications
  - Select common fields from a searchable, grouped picker
  - Add custom application-specific fields
  - Draft / Completed / Submitted status tracking
- **Export** — Clean Q&A export with per-field copy buttons and "Copy All" / Download as text
- **History** — Timeline of all applications grouped by month

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9

> No Python, no native build tools, no cloud services required.

## Getting Started

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 3. Start the backend API (port 3001)

```bash
cd backend
node server.js
```

The backend seeds sample data on first run:
- 5 field groups (Organisational Info, Mission & Impact, Financial Information, Project Details, Team & Governance)
- 21 pre-filled common fields
- 1 sample application (Arts Council England – Small Grants)

### 4. Start the frontend dev server (port 5173)

In a new terminal:

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

## Project Structure

```
├── src/                        Frontend (React + Vite + Tailwind)
│   ├── components/
│   │   ├── forms/
│   │   │   └── ApplicationForm.jsx
│   │   ├── layout/
│   │   │   ├── Layout.jsx
│   │   │   └── Sidebar.jsx
│   │   └── ui/
│   │       ├── ConfirmDialog.jsx
│   │       ├── EmptyState.jsx
│   │       ├── Modal.jsx
│   │       ├── SearchInput.jsx
│   │       └── VersionHistory.jsx
│   ├── pages/
│   │   ├── Applications.jsx
│   │   ├── CommonFields.jsx
│   │   ├── CreateApplication.jsx
│   │   ├── Dashboard.jsx
│   │   ├── EditApplication.jsx
│   │   ├── ExportApplication.jsx
│   │   └── History.jsx
│   ├── services/
│   │   └── api.js              Centralised API client
│   ├── App.jsx                 Router setup (lazy-loaded pages)
│   ├── index.css               Tailwind + custom component classes
│   └── main.jsx
│
└── backend/                    Node.js + Express API
    ├── db/
    │   ├── setup.js            sql.js init, helpers, schema, seed data
    │   └── database.sqlite     Auto-created on first run
    ├── routes/
    │   ├── applications.js
    │   ├── commonFields.js
    │   └── fieldGroups.js
    └── server.js               Express app entry point (port 3001)
```

## API Endpoints

| Method | Path                           | Description                     |
|--------|--------------------------------|---------------------------------|
| GET    | /api/field-groups              | List field groups with counts   |
| POST   | /api/field-groups              | Create field group              |
| PUT    | /api/field-groups/:id          | Update field group              |
| DELETE | /api/field-groups/:id          | Delete field group              |
| GET    | /api/common-fields             | List fields (filterable)        |
| GET    | /api/common-fields/:id         | Get field + version history     |
| POST   | /api/common-fields             | Create field                    |
| PUT    | /api/common-fields/:id         | Update field (auto-versions)    |
| DELETE | /api/common-fields/:id         | Delete field                    |
| GET    | /api/applications              | List applications               |
| GET    | /api/applications/:id          | Get application with fields     |
| POST   | /api/applications              | Create application              |
| PUT    | /api/applications/:id          | Update application              |
| DELETE | /api/applications/:id          | Delete application              |
| GET    | /api/applications/:id/export   | Get formatted Q&A export        |

## Build for Production

```bash
npm run build
```

Output is in `dist/`. Serve with `npm run preview` or any static file server.
