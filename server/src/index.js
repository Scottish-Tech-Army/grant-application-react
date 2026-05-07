import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import { openApiSpec } from "./openapi.js";
import { initDb } from "./db.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

const rawOrigins = process.env.CLIENT_ORIGIN || "*";
const allowedOrigins = rawOrigins === "*" ? "*" : rawOrigins.split(",").map((x) => x.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan("dev"));

const API_BASE = "/api/v1";
const FIELD_TYPES = new Set(["text", "textarea", "long_text", "number", "currency", "date", "boolean", "enum", "json"]);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const db = await initDb();

const sharedFields = new Map();
const sharedFieldVersions = new Map();

const applications = new Map();
const applicationSharedSelections = new Map();

const customFieldsByApplication = new Map();
const customFieldVersions = new Map();

const exportJobsByApplication = new Map();
const submissionSnapshots = new Map();

const sharedFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(["text", "textarea", "long_text", "number", "currency", "date", "boolean", "enum", "json"]).optional(),
    required: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    options: z.array(z.string()).optional(),
  })
  .strict();

const sharedFieldVersionSchema = z
  .object({
    value: z.any(),
    changeNote: z.string().optional(),
    effectiveFrom: z.string().optional(),
  })
  .strict();

const sharedFieldPatchSchema = z
  .object({
    key: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    description: z.string().optional(),
    type: z.enum(["text", "textarea", "long_text", "number", "currency", "date", "boolean", "enum", "json"]).optional(),
    required: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    options: z.array(z.string()).optional(),
  })
  .strict();

const applicationCreateSchema = z
  .object({
    name: z.string().min(1),
    fundingBody: z.string().optional(),
    deadline: z.string().nullable().optional(),
  })
  .strict();

const applicationPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    fundingBody: z.string().optional(),
    deadline: z.string().nullable().optional(),
  })
  .strict();

const selectionBodySchema = z
  .object({
    versionId: z.string().optional(),
  })
  .strict();

const bulkSelectionSchema = z
  .object({
    items: z.array(z.object({ sharedFieldId: z.string().min(1), versionId: z.string().optional() }).strict()).min(1),
  })
  .strict();

const customFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(["text", "textarea", "long_text", "number", "currency", "date", "boolean", "enum", "json"]).optional(),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
  })
  .strict();

const customFieldPatchSchema = z
  .object({
    key: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    type: z.enum(["text", "textarea", "long_text", "number", "currency", "date", "boolean", "enum", "json"]).optional(),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
  })
  .strict();

const customFieldVersionSchema = z
  .object({
    value: z.any(),
    changeNote: z.string().optional(),
  })
  .strict();

const assembledPatchSchema = z
  .object({
    application: applicationPatchSchema.optional(),
    sharedSelections: z.array(z.object({ sharedFieldId: z.string().min(1), versionId: z.string().optional() }).strict()).optional(),
    customFieldValues: z.array(z.object({ customFieldId: z.string().min(1), value: z.any(), changeNote: z.string().optional() }).strict()).optional(),
  })
  .strict();

const exportCreateSchema = z
  .object({
    format: z.enum(["json", "pdf", "docx"]).optional(),
    includeHistory: z.boolean().optional(),
  })
  .strict();

const uiCommonFieldCreateSchema = z
  .object({
    label: z.string().min(1),
    group: z.string().min(1),
    type: z.enum(["text", "textarea", "number"]),
    value: z.string().default(""),
  })
  .strict();

const uiCommonFieldPatchSchema = z
  .object({
    label: z.string().min(1).optional(),
    group: z.string().min(1).optional(),
    type: z.enum(["text", "textarea", "number"]).optional(),
    value: z.string().optional(),
  })
  .strict();

const uiCustomFieldSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().min(1),
    type: z.enum(["text", "textarea", "number"]),
    value: z.string().default(""),
  })
  .strict();

const uiApplicationCreateSchema = z
  .object({
    name: z.string().min(1),
    commonFieldIds: z.array(z.string()).default([]),
    customFields: z.array(uiCustomFieldSchema).default([]),
  })
  .strict();

const uiApplicationPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    commonFieldIds: z.array(z.string()).optional(),
    customFields: z.array(uiCustomFieldSchema).optional(),
  })
  .strict();

const newId = (prefix) => `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 12)}`;

const parseCSV = (input) => (input ? String(input).split(",").map((x) => x.trim()).filter(Boolean) : []);

const parseBoolean = (input, fallback) => {
  if (input === undefined) {
    return fallback;
  }
  return String(input).toLowerCase() === "true";
};

const getPagination = (req) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
  return { page, pageSize };
};

const paginate = (items, page, pageSize) => {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
};

const sendError = (res, status, code, message, details = []) => {
  res.status(status).json({
    error: {
      code,
      message,
      details,
      requestId: newId("req"),
    },
  });
};

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.join("."), issue: issue.message }));
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid request body", details);
  }
  req.body = result.data;
  return next();
};

const toSerializableState = () => ({
  sharedFields: Array.from(sharedFields.entries()),
  sharedFieldVersions: Array.from(sharedFieldVersions.entries()),
  applications: Array.from(applications.entries()),
  applicationSharedSelections: Array.from(applicationSharedSelections.entries()).map(([appId, selections]) => [appId, Array.from(selections.entries())]),
  customFieldsByApplication: Array.from(customFieldsByApplication.entries()).map(([appId, fields]) => [appId, Array.from(fields.entries())]),
  customFieldVersions: Array.from(customFieldVersions.entries()),
  exportJobsByApplication: Array.from(exportJobsByApplication.entries()).map(([appId, jobs]) => [appId, Array.from(jobs.entries())]),
  submissionSnapshots: Array.from(submissionSnapshots.entries()),
});

const loadState = () => {
  if (!fs.existsSync(DATA_FILE)) {
    return;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    if (!raw.trim()) {
      return;
    }
    const parsed = JSON.parse(raw);

    for (const [k, v] of parsed.sharedFields || []) sharedFields.set(k, v);
    for (const [k, v] of parsed.sharedFieldVersions || []) sharedFieldVersions.set(k, v);
    for (const [k, v] of parsed.applications || []) applications.set(k, v);
    for (const [appId, selectionEntries] of parsed.applicationSharedSelections || []) {
      applicationSharedSelections.set(appId, new Map(selectionEntries));
    }
    for (const [appId, fieldEntries] of parsed.customFieldsByApplication || []) {
      customFieldsByApplication.set(appId, new Map(fieldEntries));
    }
    for (const [k, v] of parsed.customFieldVersions || []) customFieldVersions.set(k, v);
    for (const [appId, jobEntries] of parsed.exportJobsByApplication || []) {
      exportJobsByApplication.set(appId, new Map(jobEntries));
    }
    for (const [k, v] of parsed.submissionSnapshots || []) submissionSnapshots.set(k, v);
  } catch (error) {
    console.error("Failed to load persisted state", error);
  }
};

const persistState = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(toSerializableState(), null, 2), "utf8");
  } catch (error) {
    console.error("Failed to persist state", error);
  }
};

const getSharedField = (id) => sharedFields.get(id);
const getApplication = (id) => applications.get(id);

const getSharedFieldVersions = (sharedFieldId) => {
  if (!sharedFieldVersions.has(sharedFieldId)) {
    sharedFieldVersions.set(sharedFieldId, []);
  }
  return sharedFieldVersions.get(sharedFieldId);
};

const getApplicationSelections = (applicationId) => {
  if (!applicationSharedSelections.has(applicationId)) {
    applicationSharedSelections.set(applicationId, new Map());
  }
  return applicationSharedSelections.get(applicationId);
};

const getApplicationCustomFields = (applicationId) => {
  if (!customFieldsByApplication.has(applicationId)) {
    customFieldsByApplication.set(applicationId, new Map());
  }
  return customFieldsByApplication.get(applicationId);
};

const getCustomFieldVersions = (customFieldId) => {
  if (!customFieldVersions.has(customFieldId)) {
    customFieldVersions.set(customFieldId, []);
  }
  return customFieldVersions.get(customFieldId);
};

const getExportJobs = (applicationId) => {
  if (!exportJobsByApplication.has(applicationId)) {
    exportJobsByApplication.set(applicationId, new Map());
  }
  return exportJobsByApplication.get(applicationId);
};

const getLatest = (versions) => (versions.length ? versions[versions.length - 1] : null);

const setSelection = (applicationId, sharedFieldId, versionId, selectedBy = "system") => {
  const sharedField = getSharedField(sharedFieldId);
  if (!sharedField) {
    return { error: { status: 404, code: "NOT_FOUND", message: "Shared field not found" } };
  }

  const versions = getSharedFieldVersions(sharedFieldId);
  
  // Auto-create a default empty version if none exist
  if (!versions.length) {
    const now = new Date().toISOString();
    versions.push({
      id: newId("sfv"),
      sharedFieldId,
      version: 1,
      value: "",
      changeNote: "Auto-created default version",
      effectiveFrom: null,
      createdBy: "system",
      createdAt: now,
    });
  }

  const resolvedVersion = versionId ? versions.find((x) => x.id === versionId) : getLatest(versions);
  if (!resolvedVersion) {
    return {
      error: {
        status: 404,
        code: "NOT_FOUND",
        message: "Shared field value version not found",
      },
    };
  }

  const selection = {
    id: newId("asfs"),
    applicationId,
    sharedFieldId,
    selectedVersionId: resolvedVersion.id,
    selectedVersion: resolvedVersion.version,
    selectedAt: new Date().toISOString(),
    selectedBy,
  };

  const selections = getApplicationSelections(applicationId);
  selections.set(sharedFieldId, selection);
  return { selection };
};

const buildAssembledApplication = (applicationId) => {
  const application = getApplication(applicationId);
  if (!application) {
    return null;
  }

  const selections = Array.from(getApplicationSelections(applicationId).values()).map((selection) => {
    const field = getSharedField(selection.sharedFieldId);
    const version = getSharedFieldVersions(selection.sharedFieldId).find((x) => x.id === selection.selectedVersionId);
    return {
      selection,
      sharedField: field,
      selectedValueVersion: version,
    };
  });

  const customFields = Array.from(getApplicationCustomFields(applicationId).values()).map((field) => {
    const versions = getCustomFieldVersions(field.id);
    return {
      field,
      latestValueVersion: getLatest(versions),
    };
  });

  return {
    application,
    sharedSelections: selections,
    customFields,
  };
};

const mapDomainTypeToUiType = (type) => {
  if (type === "long_text" || type === "textarea") {
    return "textarea";
  }
  if (type === "number") {
    return "number";
  }
  return "text";
};

const mapUiTypeToDomainType = (type) => {
  if (type === "textarea") {
    return "long_text";
  }
  if (type === "number") {
    return "number";
  }
  return "text";
};

const selectUiCommonFields = db.prepare(
  "SELECT id, label, group_name, type, value, created_at, updated_at FROM ui_common_fields WHERE archived = 0 ORDER BY updated_at DESC",
);
const getUiCommonField = db.prepare(
  "SELECT id, label, group_name, type, value, created_at, updated_at, archived FROM ui_common_fields WHERE id = ?",
);
const insertUiCommonField = db.prepare(
  "INSERT INTO ui_common_fields (id, label, group_name, type, value, created_at, updated_at, archived) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
);
const updateUiCommonField = db.prepare(
  "UPDATE ui_common_fields SET label = ?, group_name = ?, type = ?, value = ?, updated_at = ? WHERE id = ?",
);
const archiveUiCommonField = db.prepare(
  "UPDATE ui_common_fields SET archived = 1, updated_at = ? WHERE id = ?",
);

const selectUiApplications = db.prepare(
  "SELECT id, name, created_at, updated_at FROM ui_applications WHERE archived = 0 ORDER BY created_at DESC",
);
const getUiApplication = db.prepare(
  "SELECT id, name, created_at, updated_at, archived FROM ui_applications WHERE id = ?",
);
const insertUiApplication = db.prepare(
  "INSERT INTO ui_applications (id, name, created_at, updated_at, archived) VALUES (?, ?, ?, ?, 0)",
);
const updateUiApplication = db.prepare(
  "UPDATE ui_applications SET name = ?, updated_at = ? WHERE id = ?",
);
const archiveUiApplication = db.prepare(
  "UPDATE ui_applications SET archived = 1, updated_at = ? WHERE id = ?",
);

const selectApplicationCommonFields = db.prepare(
  "SELECT common_field_id FROM ui_application_common_fields WHERE application_id = ? ORDER BY created_at ASC",
);
const deleteApplicationCommonFields = db.prepare(
  "DELETE FROM ui_application_common_fields WHERE application_id = ?",
);
const insertApplicationCommonField = db.prepare(
  "INSERT INTO ui_application_common_fields (application_id, common_field_id, created_at) VALUES (?, ?, ?)",
);

const selectApplicationCustomFields = db.prepare(
  "SELECT id, label, type, value FROM ui_custom_fields WHERE application_id = ? ORDER BY created_at ASC",
);
const deleteApplicationCustomFields = db.prepare(
  "DELETE FROM ui_custom_fields WHERE application_id = ?",
);
const insertApplicationCustomField = db.prepare(
  "INSERT INTO ui_custom_fields (id, application_id, label, type, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
);

const toUiCommonField = (row) => ({
  id: row.id,
  label: row.label,
  group: row.group_name,
  type: row.type,
  value: row.value ?? "",
});

const buildUiApplication = (row) => {
  const commonFieldIds = selectApplicationCommonFields
    .all(row.id)
    .map((item) => item.common_field_id);
  const customFields = selectApplicationCustomFields.all(row.id).map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    value: field.value ?? "",
  }));

  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    commonFieldIds,
    customFields,
  };
};

const validateCommonFieldIds = (ids) => {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT id FROM ui_common_fields WHERE id IN (${placeholders}) AND archived = 0`)
    .all(...ids);
  const existing = new Set(rows.map((row) => row.id));
  return ids.filter((id) => !existing.has(id));
};

const patchApplicationMeta = (application, patch) => {
  for (const key of ["name", "fundingBody", "deadline"]) {
    if (patch[key] !== undefined) {
      application[key] = patch[key];
    }
  }
};

const applySharedSelectionsPatch = (applicationId, items) => {
  for (const item of items) {
    if (!item.sharedFieldId) {
      return { status: 400, code: "VALIDATION_ERROR", message: "Each shared selection item requires sharedFieldId" };
    }
    const { error } = setSelection(applicationId, item.sharedFieldId, item.versionId, "system");
    if (error) {
      return error;
    }
  }
  return null;
};

const applyCustomFieldValuePatch = (applicationId, items) => {
  for (const item of items) {
    if (!item.customFieldId || item.value === undefined) {
      return {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Each custom field value item requires customFieldId and value",
      };
    }
    const customField = getApplicationCustomFields(applicationId).get(item.customFieldId);
    if (!customField) {
      return { status: 404, code: "NOT_FOUND", message: `Custom field not found: ${item.customFieldId}` };
    }
    const versions = getCustomFieldVersions(customField.id);
    versions.push({
      id: newId("acfv"),
      customFieldId: customField.id,
      version: versions.length + 1,
      value: item.value,
      changeNote: item.changeNote || "",
      createdBy: "system",
      createdAt: new Date().toISOString(),
    });
  }
  return null;
};

loadState();

app.get("/api/openapi.json", (_req, res) => {
  res.status(200).json(openApiSpec);
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "wishaw-react-server" });
});

app.get("/api/time", (_req, res) => {
  res.status(200).json({ now: new Date().toISOString() });
});

app.post(`${API_BASE}/shared-fields`, validateBody(sharedFieldSchema), (req, res) => {
  const { key, label, description = "", type = "text", required = false, tags = [], options = [] } = req.body || {};
  if (!key || !label) {
    return sendError(res, 400, "VALIDATION_ERROR", "'key' and 'label' are required");
  }
  if (!FIELD_TYPES.has(type)) {
    return sendError(res, 400, "VALIDATION_ERROR", "Unsupported field type");
  }
  if (type === "enum" && (!Array.isArray(options) || options.length === 0)) {
    return sendError(res, 400, "VALIDATION_ERROR", "Enum fields require non-empty 'options'");
  }

  const id = newId("sf");
  const now = new Date().toISOString();
  const sharedField = {
    id,
    key,
    label,
    description,
    type,
    required: Boolean(required),
    tags: Array.isArray(tags) ? tags : [],
    options: Array.isArray(options) ? options : [],
    createdBy: "system",
    createdAt: now,
    updatedAt: now,
    archived: false,
    revision: 1,
  };
  sharedFields.set(id, sharedField);
  persistState();
  return res.status(201).json(sharedField);
});

app.get(`${API_BASE}/shared-fields`, (req, res) => {
  const search = String(req.query.search || "").toLowerCase();
  const typeFilter = req.query.type ? String(req.query.type) : null;
  const archivedFilter = req.query.archived;
  const includeArchived = archivedFilter === undefined ? null : parseBoolean(archivedFilter, false);
  const { page, pageSize } = getPagination(req);

  let items = Array.from(sharedFields.values());
  if (search) {
    items = items.filter(
      (x) =>
        x.key.toLowerCase().includes(search) ||
        x.label.toLowerCase().includes(search) ||
        String(x.description || "").toLowerCase().includes(search),
    );
  }
  if (typeFilter) {
    items = items.filter((x) => x.type === typeFilter);
  }
  if (includeArchived !== null) {
    items = items.filter((x) => x.archived === includeArchived);
  }
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return res.status(200).json(paginate(items, page, pageSize));
});

app.get(`${API_BASE}/shared-fields/:sharedFieldId`, (req, res) => {
  const field = getSharedField(req.params.sharedFieldId);
  if (!field) {
    return sendError(res, 404, "NOT_FOUND", "Shared field not found");
  }
  return res.status(200).json(field);
});

app.patch(`${API_BASE}/shared-fields/:sharedFieldId`, validateBody(sharedFieldPatchSchema), (req, res) => {
  const field = getSharedField(req.params.sharedFieldId);
  if (!field) {
    return sendError(res, 404, "NOT_FOUND", "Shared field not found");
  }

  const allowedKeys = ["key", "label", "description", "type", "required", "tags", "options"];
  for (const key of allowedKeys) {
    if (req.body?.[key] !== undefined) {
      field[key] = req.body[key];
    }
  }
  if (!FIELD_TYPES.has(field.type)) {
    return sendError(res, 400, "VALIDATION_ERROR", "Unsupported field type");
  }
  if (field.type === "enum" && (!Array.isArray(field.options) || field.options.length === 0)) {
    return sendError(res, 400, "VALIDATION_ERROR", "Enum fields require non-empty 'options'");
  }

  field.updatedAt = new Date().toISOString();
  field.revision += 1;
  sharedFields.set(field.id, field);
  persistState();
  return res.status(200).json(field);
});

app.post(`${API_BASE}/shared-fields/:sharedFieldId/archive`, (req, res) => {
  const field = getSharedField(req.params.sharedFieldId);
  if (!field) {
    return sendError(res, 404, "NOT_FOUND", "Shared field not found");
  }
  field.archived = true;
  field.updatedAt = new Date().toISOString();
  field.revision += 1;
  persistState();
  return res.status(200).json(field);
});

app.post(`${API_BASE}/shared-fields/:sharedFieldId/versions`, validateBody(sharedFieldVersionSchema), (req, res) => {
  const field = getSharedField(req.params.sharedFieldId);
  if (!field) {
    return sendError(res, 404, "NOT_FOUND", "Shared field not found");
  }
  if (req.body?.value === undefined) {
    return sendError(res, 400, "VALIDATION_ERROR", "'value' is required");
  }

  const versions = getSharedFieldVersions(field.id);
  const version = {
    id: newId("sfv"),
    sharedFieldId: field.id,
    version: versions.length + 1,
    value: req.body.value,
    changeNote: req.body?.changeNote || "",
    effectiveFrom: req.body?.effectiveFrom || null,
    createdBy: "system",
    createdAt: new Date().toISOString(),
  };
  versions.push(version);
  persistState();
  return res.status(201).json(version);
});

app.get(`${API_BASE}/shared-fields/:sharedFieldId/versions`, (req, res) => {
  const field = getSharedField(req.params.sharedFieldId);
  if (!field) {
    return sendError(res, 404, "NOT_FOUND", "Shared field not found");
  }
  const versions = [...getSharedFieldVersions(field.id)].sort((a, b) => b.version - a.version);
  const { page, pageSize } = getPagination(req);
  return res.status(200).json(paginate(versions, page, pageSize));
});

app.get(`${API_BASE}/shared-fields/:sharedFieldId/versions/latest`, (req, res) => {
  const field = getSharedField(req.params.sharedFieldId);
  if (!field) {
    return sendError(res, 404, "NOT_FOUND", "Shared field not found");
  }
  const latest = getLatest(getSharedFieldVersions(field.id));
  if (!latest) {
    return sendError(res, 404, "NOT_FOUND", "No value versions found");
  }
  return res.status(200).json(latest);
});

app.get(`${API_BASE}/shared-fields/:sharedFieldId/versions/:versionId`, (req, res) => {
  const field = getSharedField(req.params.sharedFieldId);
  if (!field) {
    return sendError(res, 404, "NOT_FOUND", "Shared field not found");
  }
  const version = getSharedFieldVersions(field.id).find((x) => x.id === req.params.versionId);
  if (!version) {
    return sendError(res, 404, "NOT_FOUND", "Version not found");
  }
  return res.status(200).json(version);
});

app.post(`${API_BASE}/applications`, validateBody(applicationCreateSchema), (req, res) => {
  const { name, fundingBody = "", deadline = null } = req.body || {};
  if (!name) {
    return sendError(res, 400, "VALIDATION_ERROR", "'name' is required");
  }
  const now = new Date().toISOString();
  const id = newId("app");
  const application = {
    id,
    name,
    fundingBody,
    deadline,
    status: "draft",
    createdBy: "system",
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    archivedAt: null,
    revision: 1,
  };
  applications.set(id, application);
  persistState();
  return res.status(201).json(application);
});

app.get(`${API_BASE}/applications`, (req, res) => {
  const statuses = parseCSV(req.query.status);
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;
  const { page, pageSize } = getPagination(req);

  let items = Array.from(applications.values());
  if (statuses.length) {
    items = items.filter((x) => statuses.includes(x.status));
  }
  if (from) {
    items = items.filter((x) => new Date(x.createdAt) >= from);
  }
  if (to) {
    items = items.filter((x) => new Date(x.createdAt) <= to);
  }
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return res.status(200).json(paginate(items, page, pageSize));
});

app.get(`${API_BASE}/applications/history`, (req, res) => {
  const statuses = parseCSV(req.query.status);
  const defaultStatuses = ["submitted", "archived"];
  const includeStatuses = statuses.length ? statuses : defaultStatuses;
  const { page, pageSize } = getPagination(req);

  const items = Array.from(applications.values())
    .filter((x) => includeStatuses.includes(x.status))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return res.status(200).json(paginate(items, page, pageSize));
});

app.get(`${API_BASE}/applications/:applicationId`, (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  return res.status(200).json(application);
});

app.patch(`${API_BASE}/applications/:applicationId`, validateBody(applicationPatchSchema), (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  const allowedKeys = ["name", "fundingBody", "deadline"];
  for (const key of allowedKeys) {
    if (req.body?.[key] !== undefined) {
      application[key] = req.body[key];
    }
  }
  application.updatedAt = new Date().toISOString();
  application.revision += 1;
  persistState();
  return res.status(200).json(application);
});

app.post(`${API_BASE}/applications/:applicationId/submit`, (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  const now = new Date().toISOString();
  application.status = "submitted";
  application.submittedAt = now;
  application.updatedAt = now;
  application.revision += 1;

  const snapshot = {
    id: newId("snap"),
    type: "submission",
    createdAt: now,
    data: buildAssembledApplication(application.id),
  };
  submissionSnapshots.set(application.id, snapshot);
  persistState();

  return res.status(200).json(application);
});

app.post(`${API_BASE}/applications/:applicationId/archive`, (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  const now = new Date().toISOString();
  application.status = "archived";
  application.archivedAt = now;
  application.updatedAt = now;
  application.revision += 1;
  persistState();
  return res.status(200).json(application);
});

app.put(`${API_BASE}/applications/:applicationId/shared-selections/:sharedFieldId`, validateBody(selectionBodySchema), (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  const { selection, error } = setSelection(application.id, req.params.sharedFieldId, req.body?.versionId, "system");
  if (error) {
    return sendError(res, error.status, error.code, error.message);
  }

  application.updatedAt = new Date().toISOString();
  application.revision += 1;
  persistState();
  return res.status(200).json(selection);
});

app.put(`${API_BASE}/applications/:applicationId/shared-selections`, validateBody(bulkSelectionSchema), (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) {
    return sendError(res, 400, "VALIDATION_ERROR", "'items' must be a non-empty array");
  }

  const output = [];
  for (const item of items) {
    if (!item.sharedFieldId) {
      return sendError(res, 400, "VALIDATION_ERROR", "Each item requires sharedFieldId");
    }
    const { selection, error } = setSelection(application.id, item.sharedFieldId, item.versionId, "system");
    if (error) {
      return sendError(res, error.status, error.code, error.message, [{ sharedFieldId: item.sharedFieldId }]);
    }
    output.push(selection);
  }

  application.updatedAt = new Date().toISOString();
  application.revision += 1;
  persistState();
  return res.status(200).json({ items: output });
});

app.get(`${API_BASE}/applications/:applicationId/shared-selections`, (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  const items = Array.from(getApplicationSelections(application.id).values()).map((selection) => {
    const sharedField = getSharedField(selection.sharedFieldId);
    const selectedValueVersion = getSharedFieldVersions(selection.sharedFieldId).find((x) => x.id === selection.selectedVersionId) || null;
    return { selection, sharedField, selectedValueVersion };
  });

  return res.status(200).json({ items });
});

app.post(`${API_BASE}/applications/:applicationId/custom-fields`, validateBody(customFieldSchema), (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  const { key, label, type = "text", required = false, options = [] } = req.body || {};
  if (!key || !label) {
    return sendError(res, 400, "VALIDATION_ERROR", "'key' and 'label' are required");
  }
  if (!FIELD_TYPES.has(type)) {
    return sendError(res, 400, "VALIDATION_ERROR", "Unsupported field type");
  }
  if (type === "enum" && (!Array.isArray(options) || options.length === 0)) {
    return sendError(res, 400, "VALIDATION_ERROR", "Enum fields require non-empty 'options'");
  }

  const customField = {
    id: newId("acf"),
    applicationId: application.id,
    key,
    label,
    type,
    required: Boolean(required),
    options: Array.isArray(options) ? options : [],
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revision: 1,
  };

  getApplicationCustomFields(application.id).set(customField.id, customField);
  persistState();
  return res.status(201).json(customField);
});

app.get(`${API_BASE}/applications/:applicationId/custom-fields`, (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  const items = Array.from(getApplicationCustomFields(application.id).values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return res.status(200).json({ items });
});

app.patch(`${API_BASE}/applications/:applicationId/custom-fields/:customFieldId`, validateBody(customFieldPatchSchema), (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  const customField = getApplicationCustomFields(application.id).get(req.params.customFieldId);
  if (!customField) {
    return sendError(res, 404, "NOT_FOUND", "Custom field not found");
  }

  const allowedKeys = ["key", "label", "type", "required", "options"];
  for (const key of allowedKeys) {
    if (req.body?.[key] !== undefined) {
      customField[key] = req.body[key];
    }
  }
  if (!FIELD_TYPES.has(customField.type)) {
    return sendError(res, 400, "VALIDATION_ERROR", "Unsupported field type");
  }
  if (customField.type === "enum" && (!Array.isArray(customField.options) || customField.options.length === 0)) {
    return sendError(res, 400, "VALIDATION_ERROR", "Enum fields require non-empty 'options'");
  }

  customField.updatedAt = new Date().toISOString();
  customField.revision += 1;
  persistState();
  return res.status(200).json(customField);
});

app.post(`${API_BASE}/applications/:applicationId/custom-fields/:customFieldId/archive`, (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  const customField = getApplicationCustomFields(application.id).get(req.params.customFieldId);
  if (!customField) {
    return sendError(res, 404, "NOT_FOUND", "Custom field not found");
  }

  customField.archived = true;
  customField.updatedAt = new Date().toISOString();
  customField.revision += 1;
  persistState();
  return res.status(200).json(customField);
});

app.post(`${API_BASE}/applications/:applicationId/custom-fields/:customFieldId/versions`, validateBody(customFieldVersionSchema), (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  const customField = getApplicationCustomFields(application.id).get(req.params.customFieldId);
  if (!customField) {
    return sendError(res, 404, "NOT_FOUND", "Custom field not found");
  }
  if (req.body?.value === undefined) {
    return sendError(res, 400, "VALIDATION_ERROR", "'value' is required");
  }

  const versions = getCustomFieldVersions(customField.id);
  const version = {
    id: newId("acfv"),
    customFieldId: customField.id,
    version: versions.length + 1,
    value: req.body.value,
    changeNote: req.body?.changeNote || "",
    createdBy: "system",
    createdAt: new Date().toISOString(),
  };
  versions.push(version);
  persistState();
  return res.status(201).json(version);
});

app.get(`${API_BASE}/applications/:applicationId/custom-fields/:customFieldId/versions`, (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  const customField = getApplicationCustomFields(application.id).get(req.params.customFieldId);
  if (!customField) {
    return sendError(res, 404, "NOT_FOUND", "Custom field not found");
  }
  const versions = [...getCustomFieldVersions(customField.id)].sort((a, b) => b.version - a.version);
  return res.status(200).json({ items: versions });
});

app.get(`${API_BASE}/applications/:applicationId/custom-fields/:customFieldId/versions/latest`, (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  const customField = getApplicationCustomFields(application.id).get(req.params.customFieldId);
  if (!customField) {
    return sendError(res, 404, "NOT_FOUND", "Custom field not found");
  }
  const latest = getLatest(getCustomFieldVersions(customField.id));
  if (!latest) {
    return sendError(res, 404, "NOT_FOUND", "No value versions found");
  }
  return res.status(200).json(latest);
});

app.get(`${API_BASE}/applications/:applicationId/assembled`, (req, res) => {
  const assembled = buildAssembledApplication(req.params.applicationId);
  if (!assembled) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  return res.status(200).json(assembled);
});

app.patch(`${API_BASE}/applications/:applicationId/assembled`, validateBody(assembledPatchSchema), (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  patchApplicationMeta(application, req.body?.application || {});

  const sharedSelections = Array.isArray(req.body?.sharedSelections) ? req.body.sharedSelections : [];
  const selectionError = applySharedSelectionsPatch(application.id, sharedSelections);
  if (selectionError) {
    return sendError(res, selectionError.status, selectionError.code, selectionError.message);
  }

  const customFieldValues = Array.isArray(req.body?.customFieldValues) ? req.body.customFieldValues : [];
  const customFieldError = applyCustomFieldValuePatch(application.id, customFieldValues);
  if (customFieldError) {
    return sendError(res, customFieldError.status, customFieldError.code, customFieldError.message);
  }

  application.updatedAt = new Date().toISOString();
  application.revision += 1;
  persistState();
  return res.status(200).json(buildAssembledApplication(application.id));
});

app.post(`${API_BASE}/applications/:applicationId/exports`, validateBody(exportCreateSchema), (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  const format = req.body?.format || "json";
  const includeHistory = Boolean(req.body?.includeHistory);
  const assembled = buildAssembledApplication(application.id);

  const job = {
    jobId: newId("exp"),
    status: "completed",
    format,
    includeHistory,
    createdAt: new Date().toISOString(),
    downloadUrl: `${API_BASE}/applications/${application.id}/exports/download/${newId("file")}.${format}`,
    payload: assembled,
  };

  getExportJobs(application.id).set(job.jobId, job);
  persistState();
  return res.status(202).json({ jobId: job.jobId, status: job.status });
});

app.get(`${API_BASE}/applications/:applicationId/exports/:jobId`, (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  const job = getExportJobs(application.id).get(req.params.jobId);
  if (!job) {
    return sendError(res, 404, "NOT_FOUND", "Export job not found");
  }

  return res.status(200).json({
    jobId: job.jobId,
    status: job.status,
    format: job.format,
    includeHistory: job.includeHistory,
    createdAt: job.createdAt,
    downloadUrl: job.downloadUrl,
  });
});

app.get(`${API_BASE}/applications/:applicationId/snapshots/submission`, (req, res) => {
  const application = getApplication(req.params.applicationId);
  if (!application) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  const snapshot = submissionSnapshots.get(application.id);
  if (!snapshot) {
    return sendError(res, 404, "NOT_FOUND", "Submission snapshot not found");
  }
  return res.status(200).json(snapshot);
});

// UI compatibility endpoints for current frontend store shape.
app.get(`${API_BASE}/ui/common-fields`, (_req, res) => {
  const items = selectUiCommonFields.all().map(toUiCommonField);
  return res.status(200).json(items);
});

app.post(`${API_BASE}/ui/common-fields`, validateBody(uiCommonFieldCreateSchema), (req, res) => {
  const now = new Date().toISOString();
  const fieldId = newId("sf");
  insertUiCommonField.run(
    fieldId,
    req.body.label,
    req.body.group,
    req.body.type,
    req.body.value ?? "",
    now,
    now,
  );
  const field = getUiCommonField.get(fieldId);
  return res.status(201).json(toUiCommonField(field));
});

app.patch(`${API_BASE}/ui/common-fields/:id`, validateBody(uiCommonFieldPatchSchema), (req, res) => {
  const field = getUiCommonField.get(req.params.id);
  if (!field || field.archived) {
    return sendError(res, 404, "NOT_FOUND", "Common field not found");
  }

  const now = new Date().toISOString();
  const label = req.body.label ?? field.label;
  const group = req.body.group ?? field.group_name;
  const type = req.body.type ?? field.type;
  const value = req.body.value ?? field.value;

  updateUiCommonField.run(label, group, type, value, now, field.id);
  const updated = getUiCommonField.get(field.id);
  return res.status(200).json(toUiCommonField(updated));
});

app.delete(`${API_BASE}/ui/common-fields/:id`, (req, res) => {
  const field = getUiCommonField.get(req.params.id);
  if (!field || field.archived) {
    return sendError(res, 404, "NOT_FOUND", "Common field not found");
  }
  archiveUiCommonField.run(new Date().toISOString(), field.id);
  return res.status(204).send();
});

app.get(`${API_BASE}/ui/applications`, (_req, res) => {
  const items = selectUiApplications.all().map(buildUiApplication);
  return res.status(200).json(items);
});

app.get(`${API_BASE}/ui/applications/:id`, (req, res) => {
  const application = getUiApplication.get(req.params.id);
  if (!application || application.archived) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  return res.status(200).json(buildUiApplication(application));
});

app.post(`${API_BASE}/ui/applications`, validateBody(uiApplicationCreateSchema), (req, res) => {
  const now = new Date().toISOString();
  const id = newId("app");
  const name = req.body.name.trim() || "Untitled Application";

  const missing = validateCommonFieldIds(req.body.commonFieldIds);
  if (missing.length > 0) {
    return sendError(res, 404, "NOT_FOUND", "Common field not found", missing.map((idItem) => ({ id: idItem })));
  }

  insertUiApplication.run(id, name, now, now);

  const insertSelections = db.transaction((fieldIds) => {
    for (const sharedFieldId of fieldIds) {
      insertApplicationCommonField.run(id, sharedFieldId, now);
    }
  });
  insertSelections(req.body.commonFieldIds);

  const insertCustomFields = db.transaction((fields) => {
    for (const item of fields) {
      const customFieldId = item.id || newId("acf");
      insertApplicationCustomField.run(
        customFieldId,
        id,
        item.label,
        item.type,
        item.value ?? "",
        now,
        now,
      );
    }
  });
  insertCustomFields(req.body.customFields);

  const application = getUiApplication.get(id);
  return res.status(201).json(buildUiApplication(application));
});

app.patch(`${API_BASE}/ui/applications/:id`, validateBody(uiApplicationPatchSchema), (req, res) => {
  const application = getUiApplication.get(req.params.id);
  if (!application || application.archived) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }

  const now = new Date().toISOString();
  const nextName = req.body.name ?? application.name;

  if (req.body.commonFieldIds) {
    const missing = validateCommonFieldIds(req.body.commonFieldIds);
    if (missing.length > 0) {
      return sendError(res, 404, "NOT_FOUND", "Common field not found", missing.map((idItem) => ({ id: idItem })));
    }
    deleteApplicationCommonFields.run(application.id);
    for (const sharedFieldId of req.body.commonFieldIds) {
      insertApplicationCommonField.run(application.id, sharedFieldId, now);
    }
  }

  if (req.body.customFields) {
    deleteApplicationCustomFields.run(application.id);
    for (const item of req.body.customFields) {
      const customFieldId = item.id || newId("acf");
      insertApplicationCustomField.run(
        customFieldId,
        application.id,
        item.label,
        item.type,
        item.value ?? "",
        now,
        now,
      );
    }
  }

  updateUiApplication.run(nextName, now, application.id);
  const updated = getUiApplication.get(application.id);
  return res.status(200).json(buildUiApplication(updated));
});

app.delete(`${API_BASE}/ui/applications/:id`, (req, res) => {
  const application = getUiApplication.get(req.params.id);
  if (!application || application.archived) {
    return sendError(res, 404, "NOT_FOUND", "Application not found");
  }
  archiveUiApplication.run(new Date().toISOString(), application.id);
  return res.status(204).send();
});

app.use((req, res) => {
  return sendError(res, 404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
