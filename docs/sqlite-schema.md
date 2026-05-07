# SQLite Storage Model

This document describes how the application data is stored in the local SQLite database used by the Node/Express server (`sql.js`).

## Database File

- Path: `server/data/app.sqlite`
- Created on first server start
- Seeded once from `server/data/db.json` if the DB is empty

## Tables

### 1) `ui_common_fields`
Stores common (shared) fields used across applications.

**Columns**
- `id` (TEXT, PK): Field ID
- `label` (TEXT): Display label
- `group_name` (TEXT): Group name (e.g., “Budgeting & Finance”)
- `type` (TEXT): `text | textarea | number`
- `value` (TEXT): Current field value
- `created_at` (TEXT): ISO date
- `updated_at` (TEXT): ISO date
- `archived` (INTEGER): 0 = active, 1 = archived

**Table format**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | TEXT | Primary key |
| `label` | TEXT | Display label |
| `group_name` | TEXT | Field group name |
| `type` | TEXT | `text \| textarea \| number` |
| `value` | TEXT | Current value |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |
| `archived` | INTEGER | 0 = active, 1 = archived |

**Notes**
- Soft deletes are implemented via `archived = 1`.

### 2) `ui_applications`
Stores application records.

**Columns**
- `id` (TEXT, PK): Application ID
- `name` (TEXT): Application name
- `created_at` (TEXT): ISO date
- `updated_at` (TEXT): ISO date
- `archived` (INTEGER): 0 = active, 1 = archived

**Table format**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | TEXT | Primary key |
| `name` | TEXT | Application name |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |
| `archived` | INTEGER | 0 = active, 1 = archived |

### 3) `ui_application_common_fields`
Join table linking applications to common fields.

**Columns**
- `application_id` (TEXT): Application ID
- `common_field_id` (TEXT): Common field ID
- `created_at` (TEXT): ISO date

**Primary Key**
- `(application_id, common_field_id)`

**Table format**

| Column | Type | Notes |
| --- | --- | --- |
| `application_id` | TEXT | Application ID |
| `common_field_id` | TEXT | Common field ID |
| `created_at` | TEXT | ISO timestamp |

### 4) `ui_custom_fields`
Stores application-specific fields.

**Columns**
- `id` (TEXT, PK): Custom field ID
- `application_id` (TEXT): Application ID
- `label` (TEXT): Field label
- `type` (TEXT): `text | textarea | number`
- `value` (TEXT): Field value
- `created_at` (TEXT): ISO date
- `updated_at` (TEXT): ISO date

**Table format**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | TEXT | Primary key |
| `application_id` | TEXT | Application ID |
| `label` | TEXT | Field label |
| `type` | TEXT | `text \| textarea \| number` |
| `value` | TEXT | Field value |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

## API Mapping (UI Endpoints)

The following endpoints map directly to these tables:

- `GET /api/v1/ui/common-fields`
- `POST /api/v1/ui/common-fields`
- `PATCH /api/v1/ui/common-fields/:id`
- `DELETE /api/v1/ui/common-fields/:id`

- `GET /api/v1/ui/applications`
- `GET /api/v1/ui/applications/:id`
- `POST /api/v1/ui/applications`
- `PATCH /api/v1/ui/applications/:id`
- `DELETE /api/v1/ui/applications/:id`

## Seeding Behavior

On first run, the server will:

1. Create the tables if they do not exist.
2. Check if `ui_common_fields` is empty.
3. If empty, seed all UI data from `server/data/db.json`.

After the first seed, all writes go to `app.sqlite`.
