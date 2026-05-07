import {
  type ApplicationCommonFieldSnapshot,
  type ApplicationSpecificField,
  type CommonField,
  type GrantApplication,
  type GrantsData,
  type Id,
} from "../types/grants";
import { createSeedFields } from "./seedData";

const DB_NAME = "grant-app-db";
const DB_VERSION = 3;
const COMMON_FIELDS_STORE = "commonFields";
const APPLICATIONS_STORE = "applications";
const CHARITY_PROFILE_STORE = "charityProfile";
const META_STORE = "meta";

const now = () => new Date().toISOString();

const createId = (): Id => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// ── IndexedDB helpers ──

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(COMMON_FIELDS_STORE)) {
        db.createObjectStore(COMMON_FIELDS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(APPLICATIONS_STORE)) {
        db.createObjectStore(APPLICATIONS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(CHARITY_PROFILE_STORE)) {
        db.createObjectStore(CHARITY_PROFILE_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txGetAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function txGet<T>(
  db: IDBDatabase,
  storeName: string,
  key: string
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function txPut<T>(db: IDBDatabase, storeName: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function txDelete(
  db: IDBDatabase,
  storeName: string,
  key: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function txPutMany<T>(
  db: IDBDatabase,
  storeName: string,
  items: T[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Seed on first use ──

async function ensureSeeded(db: IDBDatabase): Promise<void> {
  const marker = await txGet<{ key: string; value: boolean }>(
    db,
    META_STORE,
    "seeded"
  );
  if (marker) {
    return;
  }

  const seedFields = createSeedFields();
  await txPutMany(db, COMMON_FIELDS_STORE, seedFields);
  await txPut(db, META_STORE, { key: "seeded", value: true });
}

// ── Snapshot helper ──

const normalizeCommonField = (field: CommonField): CommonField => {
  const versionTimestamp = field.updatedAt || now();
  const fallbackVersion = {
    version: field.version || 1,
    label: field.label,
    value: field.value,
    updatedAt: versionTimestamp,
  };

  const versionHistory = Array.isArray((field as Partial<CommonField>).versions)
    ? [...(field as CommonField).versions]
    : [fallbackVersion];

  if (versionHistory.length === 0) {
    versionHistory.push(fallbackVersion);
  }

  versionHistory.sort((a, b) => a.version - b.version);
  const latest = versionHistory[versionHistory.length - 1];

  return {
    ...field,
    label: latest.label,
    value: latest.value,
    version: latest.version,
    updatedAt: latest.updatedAt,
    versions: versionHistory,
  };
};

const normalizeApplication = (
  application: GrantApplication
): GrantApplication => ({
  ...application,
  outcomeStatus: application.outcomeStatus || "Draft",
  funderName: application.funderName || "",
  projectOrService: application.projectOrService || "",
  attachedMediaIds: application.attachedMediaIds ?? [],
});

const createSnapshotFromVersion = (
  field: CommonField,
  versionNumber: number
): ApplicationCommonFieldSnapshot => {
  const selectedVersion = field.versions.find(
    (v) => v.version === versionNumber
  );
  const resolvedVersion =
    selectedVersion || field.versions[field.versions.length - 1];

  return {
    fieldId: field.id,
    label: resolvedVersion.label,
    value: resolvedVersion.value,
    version: resolvedVersion.version,
    selectedAt: now(),
  };
};

// ── Public async store ──

import type { CharityProfile } from "../types/grants";

export const grantsStore = {
  async getData(): Promise<GrantsData> {
    const db = await openDb();
    await ensureSeeded(db);

    const [rawCommonFields, rawApplications, charityProfiles] =
      await Promise.all([
        txGetAll<CommonField>(db, COMMON_FIELDS_STORE),
        txGetAll<GrantApplication>(db, APPLICATIONS_STORE),
        txGetAll<CharityProfile>(db, CHARITY_PROFILE_STORE),
      ]);

    const commonFields = rawCommonFields.map(normalizeCommonField);
    const applications = rawApplications.map(normalizeApplication);

    const commonFieldsNeedPersist = rawCommonFields.some(
      (field) => !Array.isArray((field as Partial<CommonField>).versions)
    );
    const applicationsNeedPersist = rawApplications.some(
      (application) =>
        !application.outcomeStatus ||
        application.funderName === undefined ||
        application.projectOrService === undefined
    );

    if (commonFieldsNeedPersist) {
      await txPutMany(db, COMMON_FIELDS_STORE, commonFields);
    }

    if (applicationsNeedPersist) {
      await txPutMany(db, APPLICATIONS_STORE, applications);
    }

    // Sort newest first (consistent with previous behaviour)
    commonFields.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    applications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      commonFields,
      applications,
      charityProfile: charityProfiles[0],
    };
  },

  async getCharityProfile(): Promise<CharityProfile | undefined> {
    const db = await openDb();
    const profiles = await txGetAll<CharityProfile>(db, CHARITY_PROFILE_STORE);
    return profiles[0];
  },

  async saveCharityProfile(
    input: Omit<CharityProfile, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    }
  ): Promise<void> {
    const db = await openDb();
    const timestamp = now();
    let profile: CharityProfile;
    if (input.id) {
      // Update existing – preserve original createdAt if possible
      const existing = await txGet<CharityProfile>(
        db,
        CHARITY_PROFILE_STORE,
        input.id
      );
      profile = {
        ...input,
        id: input.id,
        mediaAttachments: input.mediaAttachments ?? [],
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
    } else {
      // Create new
      profile = {
        ...input,
        id: createId(),
        mediaAttachments: input.mediaAttachments ?? [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }
    await txPut(db, CHARITY_PROFILE_STORE, profile);
  },

  async createCommonField(input: {
    label: string;
    value: string;
    group?: string;
  }) {
    const db = await openDb();
    const timestamp = now();
    const trimmedLabel = input.label.trim();
    const trimmedValue = input.value.trim();

    const field: CommonField = {
      id: createId(),
      group: input.group?.trim() || "Custom",
      label: trimmedLabel,
      value: trimmedValue,
      version: 1,
      versions: [
        {
          version: 1,
          label: trimmedLabel,
          value: trimmedValue,
          updatedAt: timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await txPut(db, COMMON_FIELDS_STORE, field);
  },

  async updateCommonField(id: Id, input: { label: string; value: string }) {
    const db = await openDb();
    const existingRaw = await txGet<CommonField>(db, COMMON_FIELDS_STORE, id);
    if (!existingRaw) return;

    const existing = normalizeCommonField(existingRaw);
    const timestamp = now();
    const nextVersion = existing.version + 1;
    const trimmedLabel = input.label.trim();
    const trimmedValue = input.value.trim();

    const updated: CommonField = {
      ...existing,
      label: trimmedLabel,
      value: trimmedValue,
      version: nextVersion,
      updatedAt: timestamp,
      versions: [
        ...existing.versions,
        {
          version: nextVersion,
          label: trimmedLabel,
          value: trimmedValue,
          updatedAt: timestamp,
        },
      ],
    };

    await txPut(db, COMMON_FIELDS_STORE, updated);
  },

  async deleteCommonField(id: Id) {
    const db = await openDb();
    await txDelete(db, COMMON_FIELDS_STORE, id);
  },

  async createApplication(input: {
    name: string;
    notes?: string;
  }): Promise<string> {
    const db = await openDb();
    const timestamp = now();

    const application: GrantApplication = {
      id: createId(),
      name: input.name.trim(),
      notes: input.notes?.trim() ?? "",
      funderName: (input as { funderName?: string }).funderName?.trim() ?? "",
      projectOrService:
        (input as { projectOrService?: string }).projectOrService?.trim() ?? "",
      outcomeStatus: "Draft",
      commonFieldSnapshots: [],
      specificFields: [],
      attachedMediaIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await txPut(db, APPLICATIONS_STORE, application);
    return application.id;
  },

  async updateApplicationConfiguration(input: {
    applicationId: Id;
    selectedCommonFieldSelections: Array<{ fieldId: Id; version: number }>;
    specificFields: Array<
      Pick<ApplicationSpecificField, "id" | "label" | "value">
    >;
    notes: string;
    funderName: string;
    projectOrService: string;
    outcomeStatus: GrantApplication["outcomeStatus"];
    attachedMediaIds?: string[];
  }) {
    const db = await openDb();
    const [rawApplication, rawCommonFields] = await Promise.all([
      txGet<GrantApplication>(db, APPLICATIONS_STORE, input.applicationId),
      txGetAll<CommonField>(db, COMMON_FIELDS_STORE),
    ]);

    if (!rawApplication) return;

    const application = normalizeApplication(rawApplication);
    const commonFields = rawCommonFields.map(normalizeCommonField);

    const fieldsById = new Map(commonFields.map((f) => [f.id, f]));
    const existingSnapshotsByFieldAndVersion = new Map(
      application.commonFieldSnapshots.map((s) => [
        `${s.fieldId}:${s.version}`,
        s,
      ])
    );

    const snapshots = input.selectedCommonFieldSelections
      .map(({ fieldId, version }) => {
        const existing = existingSnapshotsByFieldAndVersion.get(
          `${fieldId}:${version}`
        );
        if (existing) return existing;

        const commonField = fieldsById.get(fieldId);
        if (!commonField) return null;

        return createSnapshotFromVersion(commonField, version);
      })
      .filter((s): s is ApplicationCommonFieldSnapshot => s !== null);

    const updated: GrantApplication = {
      ...application,
      notes: input.notes.trim(),
      funderName: input.funderName.trim(),
      projectOrService: input.projectOrService.trim(),
      outcomeStatus: input.outcomeStatus,
      commonFieldSnapshots: snapshots,
      specificFields: input.specificFields.map((f) => ({
        id: f.id,
        label: f.label.trim(),
        value: f.value.trim(),
      })),
      attachedMediaIds:
        input.attachedMediaIds ?? application.attachedMediaIds ?? [],
      updatedAt: now(),
    };

    await txPut(db, APPLICATIONS_STORE, updated);
  },

  createSpecificField(): ApplicationSpecificField {
    return {
      id: createId(),
      label: "",
      value: "",
    };
  },

  async getExportText(applicationId: Id): Promise<string> {
    const db = await openDb();
    const application = await txGet<GrantApplication>(
      db,
      APPLICATIONS_STORE,
      applicationId
    );

    if (!application) {
      return "No application selected.";
    }

    const header = `# ${application.name}`;
    const statusSection = `## Outcome Status\n${
      application.outcomeStatus || "Draft"
    }`;
    const notesSection = application.notes
      ? `## Notes\n${application.notes}`
      : "## Notes\nNo notes provided.";

    const commonFieldsSection =
      application.commonFieldSnapshots.length === 0
        ? "## Common Fields\nNo common fields selected."
        : `## Common Fields\n${application.commonFieldSnapshots
            .map(
              (f) =>
                `### ${f.label}\nVersion: v${f.version}\nSelected: ${new Date(
                  f.selectedAt
                ).toLocaleString()}\n\n${f.value}`
            )
            .join("\n\n")}`;

    const specificFieldsSection =
      application.specificFields.length === 0
        ? "## Application-Specific Fields\nNo application-specific fields added."
        : `## Application-Specific Fields\n${application.specificFields
            .map((f) => `### ${f.label || "Untitled field"}\n${f.value || "-"}`)
            .join("\n\n")}`;

    return [
      header,
      statusSection,
      notesSection,
      commonFieldsSection,
      specificFieldsSection,
    ].join("\n\n");
  },
};
