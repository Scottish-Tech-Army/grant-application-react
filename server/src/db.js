import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs from "sql.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "app.sqlite");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const mapDomainTypeToUiType = (type) => {
  if (type === "long_text" || type === "textarea") {
    return "textarea";
  }
  if (type === "number" || type === "currency") {
    return "number";
  }
  return "text";
};

const getLatestVersion = (versions) => {
  if (!Array.isArray(versions) || versions.length === 0) return null;
  const sorted = [...versions].sort((left, right) => (left.version ?? 0) - (right.version ?? 0));
  return sorted[sorted.length - 1] ?? null;
};

const initializeSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ui_common_fields (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      group_name TEXT NOT NULL,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ui_applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ui_application_common_fields (
      application_id TEXT NOT NULL,
      common_field_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (application_id, common_field_id)
    );

    CREATE TABLE IF NOT EXISTS ui_custom_fields (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ui_common_fields_archived ON ui_common_fields(archived);
    CREATE INDEX IF NOT EXISTS idx_ui_applications_archived ON ui_applications(archived);
    CREATE INDEX IF NOT EXISTS idx_ui_app_common ON ui_application_common_fields(application_id);
    CREATE INDEX IF NOT EXISTS idx_ui_custom_fields_app ON ui_custom_fields(application_id);
  `);
};

const seedCommonFields = ({ sharedFields, sharedFieldVersions, insertCommonField }) => {
  for (const field of sharedFields.values()) {
    const versions = sharedFieldVersions.get(field.id) ?? [];
    const latest = getLatestVersion(versions);
    const createdAt = field.createdAt ?? new Date().toISOString();
    const updatedAt = field.updatedAt ?? createdAt;
    insertCommonField.run(
      field.id,
      field.label ?? "",
      field.tags?.[0] ?? "Other",
      mapDomainTypeToUiType(field.type),
      latest?.value == null ? "" : String(latest.value),
      createdAt,
      updatedAt,
      field.archived ? 1 : 0,
    );
  }
};

const seedApplicationSelections = ({ applicationId, selections, createdAt, insertAppCommon }) => {
  if (!selections) return;
  for (const [sharedFieldId, selection] of selections.entries()) {
    const selectedAt = selection?.selectedAt ?? createdAt;
    insertAppCommon.run(applicationId, sharedFieldId, selectedAt);
  }
};

const seedApplicationCustomFields = ({
  applicationId,
  customFields,
  customFieldVersions,
  createdAt,
  insertCustomField,
}) => {
  if (!customFields) return;
  for (const field of customFields.values()) {
    const versions = customFieldVersions.get(field.id) ?? [];
    const latest = getLatestVersion(versions);
    const fieldCreated = field.createdAt ?? createdAt;
    const fieldUpdated = field.updatedAt ?? fieldCreated;
    insertCustomField.run(
      field.id,
      applicationId,
      field.label ?? "",
      mapDomainTypeToUiType(field.type),
      latest?.value == null ? "" : String(latest.value),
      fieldCreated,
      fieldUpdated,
    );
  }
};

const seedApplications = ({
  applications,
  applicationSharedSelections,
  customFieldsByApplication,
  customFieldVersions,
  insertApplication,
  insertAppCommon,
  insertCustomField,
}) => {
  for (const application of applications.values()) {
    const createdAt = application.createdAt ?? new Date().toISOString();
    const updatedAt = application.updatedAt ?? createdAt;
    const archived = application.status === "archived" ? 1 : 0;
    insertApplication.run(application.id, application.name ?? "Untitled", createdAt, updatedAt, archived);

    seedApplicationSelections({
      applicationId: application.id,
      selections: applicationSharedSelections.get(application.id),
      createdAt,
      insertAppCommon,
    });

    seedApplicationCustomFields({
      applicationId: application.id,
      customFields: customFieldsByApplication.get(application.id),
      customFieldVersions,
      createdAt,
      insertCustomField,
    });
  }
};

const seedFromJson = (db) => {
  const existingCount = db.prepare("SELECT COUNT(*) as count FROM ui_common_fields").get();
  if (existingCount?.count > 0) return;
  if (!fs.existsSync(DATA_FILE)) return;

  const raw = fs.readFileSync(DATA_FILE, "utf8");
  if (!raw.trim()) return;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  const sharedFields = new Map(parsed.sharedFields ?? []);
  const sharedFieldVersions = new Map(parsed.sharedFieldVersions ?? []);
  const applications = new Map(parsed.applications ?? []);

  const applicationSharedSelections = new Map();
  for (const [appId, selectionEntries] of parsed.applicationSharedSelections ?? []) {
    applicationSharedSelections.set(appId, new Map(selectionEntries));
  }

  const customFieldsByApplication = new Map();
  for (const [appId, fieldEntries] of parsed.customFieldsByApplication ?? []) {
    customFieldsByApplication.set(appId, new Map(fieldEntries));
  }

  const customFieldVersions = new Map(parsed.customFieldVersions ?? []);

  const insertCommonField = db.prepare(
    "INSERT INTO ui_common_fields (id, label, group_name, type, value, created_at, updated_at, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const insertApplication = db.prepare(
    "INSERT INTO ui_applications (id, name, created_at, updated_at, archived) VALUES (?, ?, ?, ?, ?)",
  );
  const insertAppCommon = db.prepare(
    "INSERT INTO ui_application_common_fields (application_id, common_field_id, created_at) VALUES (?, ?, ?)",
  );
  const insertCustomField = db.prepare(
    "INSERT INTO ui_custom_fields (id, application_id, label, type, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );

  const seedTransaction = db.transaction(() => {
    seedCommonFields({ sharedFields, sharedFieldVersions, insertCommonField });
    seedApplications({
      applications,
      applicationSharedSelections,
      customFieldsByApplication,
      customFieldVersions,
      insertApplication,
      insertAppCommon,
      insertCustomField,
    });
  });

  seedTransaction();
};

const persistDb = (db) => {
  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
};

const wrapDb = (db) => {
  let transactionDepth = 0;

  const shouldPersist = () => transactionDepth === 0;

  return {
    exec: (sql) => {
      db.exec(sql);
      if (shouldPersist()) {
        persistDb(db);
      }
    },
    pragma: (sql) => {
      db.exec(`PRAGMA ${sql}`);
    },
    prepare: (sql) => {
      return {
        run: (...params) => {
          const stmt = db.prepare(sql);
          stmt.run(params);
          stmt.free();
          if (shouldPersist()) {
            persistDb(db);
          }
        },
        get: (...params) => {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const hasRow = stmt.step();
          const row = hasRow ? stmt.getAsObject() : undefined;
          stmt.free();
          return row;
        },
        all: (...params) => {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return rows;
        },
      };
    },
    transaction: (fn) => {
      return (...args) => {
        const savepoint = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const savepointName = `"${savepoint}"`;
        let savepointActive = false;
        try {
          db.exec(`SAVEPOINT ${savepointName}`);
          savepointActive = true;
        } catch {
          // If SAVEPOINT fails, continue without transaction.
        }
        transactionDepth += 1;
        try {
          const result = fn(...args);
          try {
            if (savepointActive) {
              db.exec(`RELEASE SAVEPOINT ${savepointName}`);
            }
          } catch {
            // ignore release failures when no savepoint is active
          }
          if (savepointActive || shouldPersist()) {
            persistDb(db);
          }
          return result;
        } catch (error) {
          try {
            if (savepointActive) {
              db.exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
              db.exec(`RELEASE SAVEPOINT ${savepointName}`);
            }
          } catch {
            // ignore rollback failures when no savepoint is active
          }
          throw error;
        } finally {
          transactionDepth = Math.max(0, transactionDepth - 1);
        }
      };
    },
  };
};

export const initDb = async () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, "..", "node_modules", "sql.js", "dist", file),
  });

  let db;
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(new Uint8Array(fileBuffer));
  } else {
    db = new SQL.Database();
  }

  initializeSchema(db);
  seedFromJson(wrapDb(db));
  persistDb(db);
  return wrapDb(db);
};
