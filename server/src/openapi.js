export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Grant Manager API",
    version: "1.0.0",
    description: "API for shared field management and funding applications.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Health" },
    { name: "Shared Fields" },
    { name: "Applications" },
    { name: "Custom Fields" },
    { name: "Exports" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Service health",
        responses: {
          "200": {
            description: "OK",
          },
        },
      },
    },
    "/api/v1/shared-fields": {
      post: {
        tags: ["Shared Fields"],
        summary: "Create shared field",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["key", "label"],
                properties: {
                  key: { type: "string" },
                  label: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  required: { type: "boolean" },
                  tags: { type: "array", items: { type: "string" } },
                  options: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
        },
      },
      get: {
        tags: ["Shared Fields"],
        summary: "List shared fields",
        responses: {
          "200": { description: "List" },
        },
      },
    },
    "/api/v1/shared-fields/{sharedFieldId}/versions": {
      post: {
        tags: ["Shared Fields"],
        summary: "Add shared field value version",
        parameters: [{ name: "sharedFieldId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["value"],
                properties: {
                  value: {},
                  changeNote: { type: "string" },
                  effectiveFrom: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
        },
      },
    },
    "/api/v1/applications": {
      post: {
        tags: ["Applications"],
        summary: "Create application",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  fundingBody: { type: "string" },
                  deadline: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
        },
      },
      get: {
        tags: ["Applications"],
        summary: "List applications",
        responses: {
          "200": { description: "List" },
        },
      },
    },
    "/api/v1/applications/{applicationId}/shared-selections/{sharedFieldId}": {
      put: {
        tags: ["Applications"],
        summary: "Pin shared field version to application",
        parameters: [
          { name: "applicationId", in: "path", required: true, schema: { type: "string" } },
          { name: "sharedFieldId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  versionId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Selection updated" },
        },
      },
    },
    "/api/v1/applications/{applicationId}/custom-fields": {
      post: {
        tags: ["Custom Fields"],
        summary: "Create application custom field",
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["key", "label"],
                properties: {
                  key: { type: "string" },
                  label: { type: "string" },
                  type: { type: "string" },
                  required: { type: "boolean" },
                  options: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
        },
      },
    },
    "/api/v1/applications/{applicationId}/assembled": {
      get: {
        tags: ["Applications"],
        summary: "Get assembled application payload",
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Assembled data" },
        },
      },
      patch: {
        tags: ["Applications"],
        summary: "Patch assembled data",
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Updated" },
        },
      },
    },
    "/api/v1/applications/{applicationId}/exports": {
      post: {
        tags: ["Exports"],
        summary: "Create export job",
        parameters: [{ name: "applicationId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "202": { description: "Accepted" },
        },
      },
    },
  },
};
