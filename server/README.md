# Server (Node + Express)

## Install

```bash
npm install
```

This server uses `sql.js` (SQLite in WASM) to avoid native build tooling.

If your environment needs the root npm registry config, run from repo root:

```bash
npm --prefix server --userconfig .npmrc install
```

## Run in development mode

```bash
npm run dev
```

## Run in production mode

```bash
npm start
```

## Environment variables

Copy `.env.example` to `.env` and adjust values:

- `PORT`: API server port. Default is `4000`.
- `CLIENT_ORIGIN`: Allowed CORS origin(s). Use comma-separated values for multiple origins.

## Endpoints

- `GET /api/health`
- `GET /api/time`

## UI Compatibility Endpoints

These endpoints match the current React UI store model (`CommonField`, `Application`):

- `GET /api/v1/ui/common-fields`
- `POST /api/v1/ui/common-fields`
- `PATCH /api/v1/ui/common-fields/:id`
- `DELETE /api/v1/ui/common-fields/:id`
- `GET /api/v1/ui/applications`
- `GET /api/v1/ui/applications/:id`
- `POST /api/v1/ui/applications`
- `PATCH /api/v1/ui/applications/:id`
- `DELETE /api/v1/ui/applications/:id`

## API Docs

- OpenAPI JSON: `GET /api/openapi.json`
- Swagger UI: `/api/docs`

## Persistence

Server state is persisted to:

- `server/data/app.sqlite` (SQLite database)

On first run, the server will seed the SQLite database from:

- `server/data/db.json` (if present)
