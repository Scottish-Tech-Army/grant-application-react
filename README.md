# Grant Manager (GrantMatrix)

Grant Manager is a React + TypeScript + Vite app for managing grant applications. It supports reusable common fields, per-application field snapshots, version history, and structured exports.

## Walkthrough

See the full, step-by-step walkthrough in:
- `docs/app-walkthrough.md`

SQLite storage details:
- `docs/sqlite-schema.md`

Theme utility mappings:
- `docs/theme-mappings.md`

## Database

- **Engine**: SQLite via `sql.js` (no native toolchain required)
- **File**: `server/data/app.sqlite`
- **Seed**: `server/data/db.json` (only on first run if DB is empty)

## Features

- **Common Information library** with group-based fields and per-field history.
- **Application creation + editing** with selected common fields and custom fields.
- **Per-application field versioning** so older apps keep their saved values.
- **Snapshot history per save** with restore controls and export preview.
- **Search + group filters** on dashboard and applications list.
- **Export template** grouped by predefined common field group order.

## Tech Stack

- React 19 + TypeScript
- Vite 7
- React Router (HashRouter)
- LocalStorage for history/snapshots/field values

## Getting Started

```bash
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Routes

- `/` — Dashboard (recent apps + filters)
- `/common` — Common Information
- `/applications` — Applications list
- `/applications/new` — Create application
- `/applications/:id` — View application
- `/applications/:id/edit` — Edit application

## Data Persistence

- **Applications**: API-backed (`/api/v1/ui/applications`).
- **Common fields**: API-backed (`/api/v1/ui/common-fields`).
- **Local history**: Stored in localStorage for versioning and snapshots.
- **Per-app field values**: Stored in localStorage to keep past apps stable.

## Export Template Ordering

Exports are structured as:

1. Header (Application name + created date)
2. Common fields grouped by group name
3. Groups ordered by the predefined group order
4. Application-specific fields

## Notes

- Snapshot restore can optionally apply common field values.
- Backfill of per-app values runs once per common-field definition hash.
