# Funding Application API Design

## Goals Covered

This API design supports:
- Shared information fields reusable across many applications.
- Versioned values for shared fields over time.
- Multiple funding applications.
- Per-application field selection from shared fields, pinned to a specific value version.
- Additional application-specific fields and their values.
- Complete application view, edit, and export.
- Historic application retrieval.

## Design Principles

- Resource-oriented REST endpoints.
- Append-only value versioning (no destructive overwrite of history).
- Explicit references from applications to selected shared field value versions.
- Soft-delete and status transitions for auditability.
- Pagination and filtering for list endpoints.

## Base

- Base URL: `/api/v1`
- Content type: `application/json`
- Auth: bearer token (assumed)

## Core Entities

### 1) SharedFieldDefinition
Defines a reusable field that can appear in many applications.

```json
{
  "id": "sf_123",
  "key": "organisation.legalName",
  "label": "Legal Organisation Name",
  "description": "Registered legal entity name",
  "type": "text",
  "required": true,
  "tags": ["organisation", "identity"],
  "createdBy": "user_1",
  "createdAt": "2026-03-30T09:00:00Z",
  "updatedAt": "2026-03-30T09:00:00Z",
  "archived": false
}
```

### 2) SharedFieldValueVersion
Immutable value version for a shared field.

```json
{
  "id": "sfv_456",
  "sharedFieldId": "sf_123",
  "version": 3,
  "value": "Wishaw Technologies Ltd",
  "changeNote": "Updated after registration amendment",
  "effectiveFrom": "2026-03-20",
  "createdBy": "user_1",
  "createdAt": "2026-03-30T09:10:00Z"
}
```

### 3) Application
A funding application container.

```json
{
  "id": "app_1001",
  "name": "Innovation Grant Spring 2026",
  "fundingBody": "Example Council",
  "deadline": "2026-05-01",
  "status": "draft",
  "createdBy": "user_1",
  "createdAt": "2026-03-30T10:00:00Z",
  "updatedAt": "2026-03-30T10:00:00Z",
  "submittedAt": null,
  "archivedAt": null
}
```

### 4) ApplicationSharedFieldSelection
Pins one shared field value version into an application.

```json
{
  "id": "asfs_001",
  "applicationId": "app_1001",
  "sharedFieldId": "sf_123",
  "selectedVersionId": "sfv_456",
  "selectedVersion": 3,
  "selectedAt": "2026-03-30T10:10:00Z",
  "selectedBy": "user_1"
}
```

### 5) ApplicationCustomFieldDefinition
Field defined only for one application.

```json
{
  "id": "acf_001",
  "applicationId": "app_1001",
  "key": "project.partnerLettersSummary",
  "label": "Partner Letters Summary",
  "type": "long_text",
  "required": false,
  "createdAt": "2026-03-30T10:20:00Z",
  "updatedAt": "2026-03-30T10:20:00Z"
}
```

### 6) ApplicationCustomFieldValueVersion
Immutable value version for an application custom field.

```json
{
  "id": "acfv_100",
  "customFieldId": "acf_001",
  "version": 2,
  "value": "Received 3 letters and summarized key commitments",
  "changeNote": "Added final letter",
  "createdBy": "user_1",
  "createdAt": "2026-03-30T10:30:00Z"
}
```

## Endpoint Design

## Shared Field Definitions

### Create shared field
`POST /api/v1/shared-fields`

Body:
```json
{
  "key": "organisation.legalName",
  "label": "Legal Organisation Name",
  "description": "Registered legal entity name",
  "type": "text",
  "required": true,
  "tags": ["organisation"]
}
```

### List shared fields
`GET /api/v1/shared-fields?search=legal&type=text&archived=false&page=1&pageSize=20`

### Get shared field
`GET /api/v1/shared-fields/{sharedFieldId}`

### Update shared field metadata
`PATCH /api/v1/shared-fields/{sharedFieldId}`

### Archive shared field
`POST /api/v1/shared-fields/{sharedFieldId}/archive`

## Shared Field Values (Versioned)

### Add new value version
`POST /api/v1/shared-fields/{sharedFieldId}/versions`

Body:
```json
{
  "value": "Wishaw Technologies Ltd",
  "changeNote": "Annual update",
  "effectiveFrom": "2026-03-20"
}
```

### List value versions
`GET /api/v1/shared-fields/{sharedFieldId}/versions?page=1&pageSize=20`

### Get latest value version
`GET /api/v1/shared-fields/{sharedFieldId}/versions/latest`

### Get a specific value version
`GET /api/v1/shared-fields/{sharedFieldId}/versions/{versionId}`

## Applications

### Create application
`POST /api/v1/applications`

Body:
```json
{
  "name": "Innovation Grant Spring 2026",
  "fundingBody": "Example Council",
  "deadline": "2026-05-01"
}
```

### List applications (current + historic)
`GET /api/v1/applications?status=draft,submitted,archived&from=2025-01-01&to=2026-12-31&page=1&pageSize=20`

### Get application
`GET /api/v1/applications/{applicationId}`

### Update application metadata
`PATCH /api/v1/applications/{applicationId}`

### Submit application
`POST /api/v1/applications/{applicationId}/submit`

### Archive application
`POST /api/v1/applications/{applicationId}/archive`

## Select Shared Fields for an Application

### Add or replace one selection
`PUT /api/v1/applications/{applicationId}/shared-selections/{sharedFieldId}`

Body:
```json
{
  "versionId": "sfv_456"
}
```

Rules:
- If `versionId` is omitted, server pins latest available version at request time.
- Selection always stores exact selected version.

### Bulk set selections
`PUT /api/v1/applications/{applicationId}/shared-selections`

Body:
```json
{
  "items": [
    { "sharedFieldId": "sf_123", "versionId": "sfv_456" },
    { "sharedFieldId": "sf_124" }
  ]
}
```

### List selected shared fields
`GET /api/v1/applications/{applicationId}/shared-selections`

## Application Custom Fields

### Create custom field for application
`POST /api/v1/applications/{applicationId}/custom-fields`

Body:
```json
{
  "key": "project.partnerLettersSummary",
  "label": "Partner Letters Summary",
  "type": "long_text",
  "required": false
}
```

### List custom fields
`GET /api/v1/applications/{applicationId}/custom-fields`

### Update custom field metadata
`PATCH /api/v1/applications/{applicationId}/custom-fields/{customFieldId}`

### Delete/retire custom field
`POST /api/v1/applications/{applicationId}/custom-fields/{customFieldId}/archive`

## Application Custom Field Values (Versioned)

### Add custom field value version
`POST /api/v1/applications/{applicationId}/custom-fields/{customFieldId}/versions`

Body:
```json
{
  "value": "Received 3 letters and summarized commitments",
  "changeNote": "Added final draft"
}
```

### List custom field value versions
`GET /api/v1/applications/{applicationId}/custom-fields/{customFieldId}/versions`

### Get latest custom field value
`GET /api/v1/applications/{applicationId}/custom-fields/{customFieldId}/versions/latest`

## Complete Application View / Alter / Export

### Get fully assembled application data
`GET /api/v1/applications/{applicationId}/assembled`

Response includes:
- Application metadata.
- Selected shared fields with pinned version metadata and values.
- Custom fields with latest values.

### Patch assembled data
`PATCH /api/v1/applications/{applicationId}/assembled`

Use this for UI convenience when editing multiple fields together. Server should internally translate to versioned writes.

### Export application
`POST /api/v1/applications/{applicationId}/exports`

Body:
```json
{
  "format": "json",
  "includeHistory": false
}
```

Returns export job:
```json
{
  "jobId": "exp_1",
  "status": "queued"
}
```

### Get export job status / download URL
`GET /api/v1/applications/{applicationId}/exports/{jobId}`

## Historic Applications

### Query historic applications
`GET /api/v1/applications/history?status=submitted,archived&page=1&pageSize=20`

### View historic assembled data at submission time
`GET /api/v1/applications/{applicationId}/snapshots/submission`

## Validation and Types

Allowed field types (initial):
- `text`
- `long_text`
- `number`
- `currency`
- `date`
- `boolean`
- `enum`
- `json`

For `enum`, require `options` in definition.

## Error Shape

Use consistent errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'deadline' must be an ISO date",
    "details": [{ "field": "deadline", "issue": "invalid_format" }],
    "requestId": "req_abc123"
  }
}
```

## Concurrency and Audit

- Add `etag` or `revision` to mutable metadata resources.
- Require `If-Match` for update operations to avoid lost updates.
- Keep immutable value-version records.
- Add audit event stream endpoint later:
  - `GET /api/v1/audit-events?entityType=application&entityId=app_1001`

## Suggested MVP Delivery Order

1. Shared field definitions + versioned values.
2. Applications + shared field selection pinning.
3. Custom fields + versioned values.
4. Assembled view endpoint.
5. Export jobs and history snapshot endpoints.
