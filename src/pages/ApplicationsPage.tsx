import React, { useEffect, useMemo, useState } from "react";
import { grantsStore } from "../store/grantsStore";
import { ImportApplicationsDialog } from "../components/ImportApplicationsDialog";
import type {
  ApplicationSpecificField,
  CharityProfile,
  CommonField,
  GrantApplication,
  MediaAttachment,
} from "../types/grants";

type SubTab = "create" | "saved" | "import";

interface ApplicationsPageProps {
  applications: GrantApplication[];
  commonFields: CommonField[];
  charityProfile?: CharityProfile;
  onCreateApplication: (input: {
    name: string;
    notes: string;
  }) => Promise<string> | string | void;
  onSaveApplication: (input: {
    applicationId: string;
    selectedCommonFieldSelections: Array<{ fieldId: string; version: number }>;
    specificFields: ApplicationSpecificField[];
    notes: string;
    funderName: string;
    projectOrService: string;
    outcomeStatus: GrantApplication["outcomeStatus"];
    attachedMediaIds?: string[];
  }) => void | Promise<void>;
  onOpenExport: (applicationId: string) => void;
}

export function ApplicationsPage({
  applications,
  commonFields,
  charityProfile,
  onCreateApplication,
  onSaveApplication,
  onOpenExport,
}: ApplicationsPageProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("saved");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string>("");
  const [selectedCommonFieldIds, setSelectedCommonFieldIds] = useState<
    string[]
  >([]);
  const [selectedCommonFieldVersions, setSelectedCommonFieldVersions] =
    useState<Record<string, number>>({});
  const [commonFieldSearch, setCommonFieldSearch] = useState("");
  const [specificFields, setSpecificFields] = useState<
    ApplicationSpecificField[]
  >([]);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftFunderName, setDraftFunderName] = useState("");
  const [draftProjectOrService, setDraftProjectOrService] = useState("");
  const [outcomeStatus, setOutcomeStatus] =
    useState<GrantApplication["outcomeStatus"]>("Draft");
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editApp, setEditApp] = useState<Partial<GrantApplication>>({});
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Create-form state for common fields & specific fields
  const [createCommonFieldIds, setCreateCommonFieldIds] = useState<string[]>(
    []
  );
  const [createCommonFieldVersions, setCreateCommonFieldVersions] = useState<
    Record<string, number>
  >({});
  const [createSpecificFields, setCreateSpecificFields] = useState<
    ApplicationSpecificField[]
  >([]);
  const [createFunderName, setCreateFunderName] = useState("");
  const [createProjectOrService, setCreateProjectOrService] = useState("");

  // Media attachment state for create and edit
  const [createAttachedMediaIds, setCreateAttachedMediaIds] = useState<
    string[]
  >([]);
  const [editAttachedMediaIds, setEditAttachedMediaIds] = useState<string[]>(
    []
  );

  const profileMedia: MediaAttachment[] =
    charityProfile?.mediaAttachments ?? [];

  useEffect(() => {
    if (!selectedApplicationId && applications.length > 0) {
      setSelectedApplicationId(applications[0].id);
    }
  }, [applications, selectedApplicationId]);

  const selectedApplication = useMemo(
    () =>
      applications.find(
        (application) => application.id === selectedApplicationId
      ) ?? null,
    [applications, selectedApplicationId]
  );

  const commonFieldVersionById = useMemo(
    () => new Map(commonFields.map((field) => [field.id, field.version])),
    [commonFields]
  );

  const groupedVisibleCommonFields = useMemo(() => {
    const query = commonFieldSearch.trim().toLowerCase();
    const filteredFields = query
      ? commonFields.filter((field) => {
          const haystack =
            `${field.label} ${field.group} ${field.value}`.toLowerCase();
          return haystack.includes(query);
        })
      : commonFields;

    const grouped = new Map<string, CommonField[]>();
    filteredFields.forEach((field) => {
      const group = field.group || "Ungrouped";
      if (!grouped.has(group)) {
        grouped.set(group, []);
      }
      grouped.get(group)!.push(field);
    });

    return Array.from(grouped.entries());
  }, [commonFieldSearch, commonFields]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedApplication) {
      return false;
    }

    const currentSelections = selectedCommonFieldIds
      .map((fieldId) => ({
        fieldId,
        version:
          selectedCommonFieldVersions[fieldId] ??
          commonFieldVersionById.get(fieldId) ??
          1,
      }))
      .sort((a, b) =>
        a.fieldId === b.fieldId
          ? a.version - b.version
          : a.fieldId.localeCompare(b.fieldId)
      );

    const baselineSelections = selectedApplication.commonFieldSnapshots
      .map((snapshot) => ({
        fieldId: snapshot.fieldId,
        version: snapshot.version,
      }))
      .sort((a, b) =>
        a.fieldId === b.fieldId
          ? a.version - b.version
          : a.fieldId.localeCompare(b.fieldId)
      );

    if (currentSelections.length !== baselineSelections.length) {
      return true;
    }

    for (let index = 0; index < currentSelections.length; index += 1) {
      const current = currentSelections[index];
      const baseline = baselineSelections[index];
      if (
        current.fieldId !== baseline.fieldId ||
        current.version !== baseline.version
      ) {
        return true;
      }
    }

    if (draftNotes.trim() !== selectedApplication.notes.trim()) {
      return true;
    }

    if (outcomeStatus !== selectedApplication.outcomeStatus) {
      return true;
    }

    if (
      draftFunderName.trim() !== (selectedApplication.funderName || "").trim()
    ) {
      return true;
    }

    if (
      draftProjectOrService.trim() !==
      (selectedApplication.projectOrService || "").trim()
    ) {
      return true;
    }

    const currentSpecificFields = specificFields.map((field) => ({
      id: field.id,
      label: field.label.trim(),
      value: field.value.trim(),
    }));
    const baselineSpecificFields = selectedApplication.specificFields.map(
      (field) => ({
        id: field.id,
        label: field.label.trim(),
        value: field.value.trim(),
      })
    );

    if (currentSpecificFields.length !== baselineSpecificFields.length) {
      return true;
    }

    for (let index = 0; index < currentSpecificFields.length; index += 1) {
      const current = currentSpecificFields[index];
      const baseline = baselineSpecificFields[index];
      if (
        current.id !== baseline.id ||
        current.label !== baseline.label ||
        current.value !== baseline.value
      ) {
        return true;
      }
    }

    return false;
  }, [
    commonFieldVersionById,
    draftFunderName,
    draftNotes,
    draftProjectOrService,
    outcomeStatus,
    selectedApplication,
    selectedCommonFieldIds,
    selectedCommonFieldVersions,
    specificFields,
  ]);

  useEffect(() => {
    if (!selectedApplication) {
      setSelectedCommonFieldIds([]);
      setSelectedCommonFieldVersions({});
      setSpecificFields([]);
      setDraftNotes("");
      setDraftFunderName("");
      setDraftProjectOrService("");
      setOutcomeStatus("Draft");
      setSaveMessage("");
      return;
    }

    const nextIds: string[] = [];
    const nextVersions: Record<string, number> = {};

    selectedApplication.commonFieldSnapshots.forEach((snapshot) => {
      if (!nextIds.includes(snapshot.fieldId)) {
        nextIds.push(snapshot.fieldId);
      }
      nextVersions[snapshot.fieldId] = snapshot.version;
    });

    setSelectedCommonFieldIds(nextIds);
    setSelectedCommonFieldVersions(nextVersions);
    setSpecificFields(selectedApplication.specificFields);
    setDraftNotes(selectedApplication.notes);
    setDraftFunderName(selectedApplication.funderName || "");
    setDraftProjectOrService(selectedApplication.projectOrService || "");
    setOutcomeStatus(selectedApplication.outcomeStatus);
    setSaveMessage("");
  }, [selectedApplication]);

  const handleCreateApplication = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    onCreateApplication({ name, notes });
    setName("");
    setNotes("");
  };

  const toggleCommonField = (fieldId: string) => {
    const field = commonFields.find((item) => item.id === fieldId);
    const defaultVersion = field?.version ?? 1;

    setSelectedCommonFieldIds((currentIds) => {
      if (currentIds.includes(fieldId)) {
        setSelectedCommonFieldVersions((currentVersions) => {
          const nextVersions = { ...currentVersions };
          delete nextVersions[fieldId];
          return nextVersions;
        });
        return currentIds.filter((id) => id !== fieldId);
      }

      setSelectedCommonFieldVersions((currentVersions) => ({
        ...currentVersions,
        [fieldId]: currentVersions[fieldId] ?? defaultVersion,
      }));
      return [...currentIds, fieldId];
    });

    setSaveMessage("");
  };

  const updateCommonFieldVersion = (fieldId: string, version: number) => {
    setSelectedCommonFieldVersions((currentVersions) => ({
      ...currentVersions,
      [fieldId]: version,
    }));
    setSaveMessage("");
  };

  const addSpecificField = () => {
    setSpecificFields((items) => [...items, grantsStore.createSpecificField()]);
    setSaveMessage("");
  };

  const updateSpecificField = (
    fieldId: string,
    patch: Partial<ApplicationSpecificField>
  ) => {
    setSpecificFields((items) =>
      items.map((field) =>
        field.id === fieldId ? { ...field, ...patch } : field
      )
    );
    setSaveMessage("");
  };

  const removeSpecificField = (fieldId: string) => {
    setSpecificFields((items) => items.filter((field) => field.id !== fieldId));
    setSaveMessage("");
  };

  const handleSaveConfiguration = async () => {
    if (!selectedApplication) {
      return;
    }

    setSaving(true);
    setSaveMessage("");
    try {
      await onSaveApplication({
        applicationId: selectedApplication.id,
        selectedCommonFieldSelections: selectedCommonFieldIds.map(
          (fieldId) => ({
            fieldId,
            version:
              selectedCommonFieldVersions[fieldId] ??
              commonFields.find((field) => field.id === fieldId)?.version ??
              1,
          })
        ),
        specificFields,
        notes: draftNotes,
        funderName: draftFunderName,
        projectOrService: draftProjectOrService,
        outcomeStatus,
      });
      setSaveMessage("Configuration saved. Opening document preview…");
      setTimeout(() => {
        setSaveMessage("");
        onOpenExport(selectedApplication.id);
      }, 800);
    } catch {
      setSaveMessage("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Filter applications based on search query
  const filteredApplications = applications.filter((app) => {
    if (!commonFieldSearch.trim()) return true;
    const searchLower = commonFieldSearch.toLowerCase();
    return (
      app.name.toLowerCase().includes(searchLower) ||
      (app.funderName || "").toLowerCase().includes(searchLower) ||
      app.outcomeStatus.toLowerCase().includes(searchLower) ||
      app.id.toLowerCase().includes(searchLower)
    );
  });

  // Create tab handlers
  const handleCreate = async () => {
    if (!name.trim()) return;
    const newId = await onCreateApplication({ name, notes });
    if (
      newId &&
      (createCommonFieldIds.length > 0 ||
        createSpecificFields.length > 0 ||
        createFunderName ||
        createProjectOrService ||
        createAttachedMediaIds.length > 0)
    ) {
      await onSaveApplication({
        applicationId: newId,
        selectedCommonFieldSelections: createCommonFieldIds.map((fieldId) => ({
          fieldId,
          version:
            createCommonFieldVersions[fieldId] ??
            commonFields.find((f) => f.id === fieldId)?.version ??
            1,
        })),
        specificFields: createSpecificFields,
        notes,
        funderName: createFunderName,
        projectOrService: createProjectOrService,
        outcomeStatus: "Draft",
        attachedMediaIds: createAttachedMediaIds,
      });
    }
    setName("");
    setNotes("");
    setCreateCommonFieldIds([]);
    setCreateCommonFieldVersions({});
    setCreateSpecificFields([]);
    setCreateFunderName("");
    setCreateProjectOrService("");
    setCreateAttachedMediaIds([]);
    // Switch to saved tab after creating
    setActiveSubTab("saved");
  };

  // Saved tab handlers
  const handleEdit = (app: GrantApplication) => {
    setSelectedApplicationId(app.id);
    setEditingId(app.id);
    setEditApp({ ...app });
    setEditAttachedMediaIds(app.attachedMediaIds ?? []);
  };

  const handleSave = async () => {
    if (editingId && editApp) {
      const app = applications.find((a) => a.id === editingId);
      if (!app) return;
      await onSaveApplication({
        applicationId: editingId,
        selectedCommonFieldSelections: selectedCommonFieldIds.map(
          (fieldId) => ({
            fieldId,
            version:
              selectedCommonFieldVersions[fieldId] ??
              commonFields.find((f) => f.id === fieldId)?.version ??
              1,
          })
        ),
        specificFields,
        notes: editApp.notes ?? app.notes,
        funderName: editApp.funderName ?? app.funderName,
        projectOrService: editApp.projectOrService ?? app.projectOrService,
        outcomeStatus: editApp.outcomeStatus ?? app.outcomeStatus,
        attachedMediaIds: editAttachedMediaIds,
      });
      setEditingId(null);
      setEditApp({});
      setEditAttachedMediaIds([]);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditApp({});
  };

  // Import tab handlers
  const handleImport = async () => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const parsed = JSON.parse(importJson);
      const apps: GrantApplication[] = Array.isArray(parsed)
        ? parsed
        : [parsed];
      // Basic validation
      for (const app of apps) {
        if (!app.id || !app.name) {
          throw new Error("Each application must have id and name.");
        }
      }
      for (const app of apps) {
        await onCreateApplication({ name: app.name, notes: app.notes || "" });
      }
      setImportSuccess(`Successfully imported ${apps.length} application(s).`);
      setImportJson("");
    } catch (e: unknown) {
      setImportError(
        e instanceof Error ? e.message : "Invalid JSON or application format."
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportJson((event.target?.result as string) || "");
    };
    reader.readAsText(file);
  };

  const toggleCreateCommonField = (fieldId: string) => {
    const field = commonFields.find((item) => item.id === fieldId);
    const defaultVersion = field?.version ?? 1;
    setCreateCommonFieldIds((currentIds) => {
      if (currentIds.includes(fieldId)) {
        setCreateCommonFieldVersions((v) => {
          const next = { ...v };
          delete next[fieldId];
          return next;
        });
        return currentIds.filter((id) => id !== fieldId);
      }
      setCreateCommonFieldVersions((v) => ({
        ...v,
        [fieldId]: v[fieldId] ?? defaultVersion,
      }));
      return [...currentIds, fieldId];
    });
  };

  const updateCreateCommonFieldVersion = (fieldId: string, version: number) => {
    setCreateCommonFieldVersions((v) => ({ ...v, [fieldId]: version }));
  };

  const addCreateSpecificField = () => {
    setCreateSpecificFields((items) => [
      ...items,
      grantsStore.createSpecificField(),
    ]);
  };

  const updateCreateSpecificField = (
    fieldId: string,
    patch: Partial<ApplicationSpecificField>
  ) => {
    setCreateSpecificFields((items) =>
      items.map((f) => (f.id === fieldId ? { ...f, ...patch } : f))
    );
  };

  const removeCreateSpecificField = (fieldId: string) => {
    setCreateSpecificFields((items) => items.filter((f) => f.id !== fieldId));
  };

  // Grouped common fields for create tab (uses separate search state to avoid conflicts)
  const [createFieldSearch, setCreateFieldSearch] = useState("");
  const groupedCreateCommonFields = useMemo(() => {
    const query = createFieldSearch.trim().toLowerCase();
    const filteredFields = query
      ? commonFields.filter((field) =>
          `${field.label} ${field.group} ${field.value}`
            .toLowerCase()
            .includes(query)
        )
      : commonFields;
    const grouped = new Map<string, CommonField[]>();
    filteredFields.forEach((field) => {
      const group = field.group || "Ungrouped";
      if (!grouped.has(group)) grouped.set(group, []);
      grouped.get(group)!.push(field);
    });
    return Array.from(grouped.entries());
  }, [createFieldSearch, commonFields]);

  // Render sub-tab navigation
  const renderSubTabs = () => (
    <div className="sub-tabs" role="tablist" aria-label="Application sections">
      <button
        role="tab"
        aria-selected={activeSubTab === "create"}
        aria-controls="panel-create"
        className={`sub-tab${
          activeSubTab === "create" ? " sub-tab--active" : ""
        }`}
        onClick={() => setActiveSubTab("create")}
      >
        Create Application
      </button>
      <button
        role="tab"
        aria-selected={activeSubTab === "saved"}
        aria-controls="panel-saved"
        className={`sub-tab${
          activeSubTab === "saved" ? " sub-tab--active" : ""
        }`}
        onClick={() => setActiveSubTab("saved")}
      >
        Saved Applications ({applications.length})
      </button>
      <button
        role="tab"
        aria-selected={activeSubTab === "import"}
        aria-controls="panel-import"
        className={`sub-tab${
          activeSubTab === "import" ? " sub-tab--active" : ""
        }`}
        onClick={() => setActiveSubTab("import")}
      >
        Import Applications
      </button>
    </div>
  );

  // Create Application Tab Content
  const renderCreateTab = () => (
    <div className="card">
      <h3>Create New Application</h3>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Start a new grant application by entering a name and optional notes.
      </p>
      <div className="form-group">
        <label>Application Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter application name"
        />
      </div>
      <div className="form-group">
        <label>Funder Name</label>
        <input
          type="text"
          value={createFunderName}
          onChange={(e) => setCreateFunderName(e.target.value)}
          placeholder="Enter funder name..."
        />
      </div>
      <div className="form-group">
        <label>Project / Service</label>
        <input
          type="text"
          value={createProjectOrService}
          onChange={(e) => setCreateProjectOrService(e.target.value)}
          placeholder="Enter project or service name..."
        />
      </div>
      <div className="form-group">
        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional notes for this application..."
        />
      </div>

      {/* Common Fields Selection */}
      <div
        style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--color-border-light)",
        }}
      >
        <h4 style={{ margin: "0 0 0.5rem" }}>Common Fields</h4>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--color-text-subdued)",
            marginBottom: "0.75rem",
          }}
        >
          Select common fields and their versions to include in this
          application.
        </p>
        <input
          type="text"
          placeholder="Search common fields..."
          value={createFieldSearch}
          onChange={(e) => setCreateFieldSearch(e.target.value)}
          style={{ marginBottom: "0.75rem", width: "100%" }}
        />
        {groupedCreateCommonFields.length === 0 ? (
          <p style={{ color: "var(--color-text-subdued)", fontSize: "0.9rem" }}>
            No common fields available. Add some in the Common Information
            Library.
          </p>
        ) : (
          groupedCreateCommonFields.map(([group, fields]) => (
            <div key={group} style={{ marginBottom: "0.75rem" }}>
              <strong
                style={{
                  fontSize: "0.85rem",
                  color: "var(--color-text-subdued)",
                }}
              >
                {group}
              </strong>
              {fields.map((field) => {
                const isSelected = createCommonFieldIds.includes(field.id);
                const selectedVersion =
                  createCommonFieldVersions[field.id] ?? field.version;
                return (
                  <div
                    key={field.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.65rem 0.75rem",
                      marginTop: "0.35rem",
                      border: `1px solid ${
                        isSelected
                          ? "var(--color-primary)"
                          : "var(--color-border-light)"
                      }`,
                      borderRadius: "var(--radius-sm)",
                      background: isSelected
                        ? "rgba(0,106,77,0.04)"
                        : "transparent",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                    onClick={() => toggleCreateCommonField(field.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCreateCommonField(field.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flexShrink: 0,
                        marginTop: "0.2rem",
                        width: "1rem",
                        height: "1rem",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            lineHeight: 1.3,
                          }}
                        >
                          {field.label}
                        </span>
                        {isSelected &&
                          field.versions &&
                          field.versions.length > 1 && (
                            <select
                              value={selectedVersion}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateCreateCommonFieldVersion(
                                  field.id,
                                  Number(e.target.value)
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.15rem 0.35rem",
                                width: "auto",
                                borderRadius: "var(--radius-sm)",
                              }}
                            >
                              {field.versions.map((v) => (
                                <option key={v.version} value={v.version}>
                                  v{v.version}
                                </option>
                              ))}
                            </select>
                          )}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-text-subdued)",
                          marginTop: "0.15rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {(() => {
                          const versionData = field.versions?.find(
                            (v) => v.version === selectedVersion
                          );
                          return versionData ? versionData.value : field.value;
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Application-Specific Fields */}
      <div
        style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--color-border-light)",
        }}
      >
        <h4 style={{ margin: "0 0 0.5rem" }}>Application-Specific Fields</h4>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--color-text-subdued)",
            marginBottom: "0.75rem",
          }}
        >
          Add custom fields unique to this application.
        </p>
        {createSpecificFields.map((field) => (
          <div
            key={field.id}
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "0.5rem",
              alignItems: "flex-start",
            }}
          >
            <input
              type="text"
              value={field.label}
              onChange={(e) =>
                updateCreateSpecificField(field.id, { label: e.target.value })
              }
              placeholder="Field label"
              style={{ flex: "0 0 35%" }}
            />
            <textarea
              value={field.value}
              onChange={(e) =>
                updateCreateSpecificField(field.id, { value: e.target.value })
              }
              placeholder="Field value"
              rows={2}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => removeCreateSpecificField(field.id)}
              style={{ flexShrink: 0, fontSize: "0.8rem" }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={addCreateSpecificField}
          style={{ fontSize: "0.85rem" }}
        >
          + Add Specific Field
        </button>
      </div>

      {/* Attach Profile Media */}
      {profileMedia.length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--color-border-light)",
          }}
        >
          <h4 style={{ margin: "0 0 0.5rem" }}>Attach Profile Media</h4>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--color-text-subdued)",
              marginBottom: "0.75rem",
            }}
          >
            Select images or videos from your Charity Profile to include with
            this application.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {profileMedia.map((media) => {
              const isSelected = createAttachedMediaIds.includes(media.id);
              return (
                <div
                  key={media.id}
                  onClick={() => {
                    setCreateAttachedMediaIds((prev) =>
                      isSelected
                        ? prev.filter((id) => id !== media.id)
                        : [...prev, media.id]
                    );
                  }}
                  style={{
                    border: `2px solid ${
                      isSelected
                        ? "var(--color-primary)"
                        : "var(--color-border-light)"
                    }`,
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    cursor: "pointer",
                    background: isSelected
                      ? "rgba(0,106,77,0.06)"
                      : "var(--color-bg-card)",
                    transition: "border-color 0.15s, background 0.15s",
                    position: "relative",
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: "0.3rem",
                        right: "0.3rem",
                        background: "var(--color-primary)",
                        color: "#fff",
                        borderRadius: "50%",
                        width: "1.3rem",
                        height: "1.3rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        zIndex: 1,
                      }}
                    >
                      ✓
                    </div>
                  )}
                  {media.type === "image" ? (
                    <img
                      src={media.dataUrl}
                      alt={media.caption || media.name}
                      style={{
                        width: "100%",
                        aspectRatio: "4/3",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <video
                      src={media.dataUrl}
                      muted
                      preload="metadata"
                      style={{
                        width: "100%",
                        aspectRatio: "4/3",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                  <div
                    style={{
                      padding: "0.35rem 0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {media.caption || media.name}
                  </div>
                </div>
              );
            })}
          </div>
          {createAttachedMediaIds.length > 0 && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-primary)",
                marginTop: "0.5rem",
                fontWeight: 600,
              }}
            >
              {createAttachedMediaIds.length} media file(s) selected
            </p>
          )}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleCreate}
        disabled={!name.trim()}
        style={{ marginTop: "1.5rem" }}
      >
        Create Application
      </button>
    </div>
  );

  // Saved Applications Tab Content
  const renderSavedTab = () => (
    <div>
      {/* Search Bar */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search applications by name, funder, status, or ID..."
            value={commonFieldSearch}
            onChange={(e) => setCommonFieldSearch(e.target.value)}
            className="search-input"
          />
          {commonFieldSearch && (
            <button
              className="btn btn-secondary"
              onClick={() => setCommonFieldSearch("")}
              style={{ marginLeft: "0.5rem" }}
            >
              Clear
            </button>
          )}
        </div>
        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          Showing {filteredApplications.length} of {applications.length}{" "}
          applications
        </p>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="card">
          <p style={{ color: "var(--text-secondary)" }}>
            {applications.length === 0
              ? "No applications yet. Create one in the 'Create Application' tab!"
              : "No applications match your search."}
          </p>
        </div>
      ) : (
        filteredApplications.map((app) => {
          const isEditing = editingId === app.id;
          return (
            <div className="card" key={app.id} style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h4 style={{ margin: 0 }}>{app.name}</h4>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      margin: "0.25rem 0",
                    }}
                  >
                    {app.funderName && <>Funder: {app.funderName} | </>}
                    Status:{" "}
                    <span
                      className={`status-badge status-badge--${app.outcomeStatus.toLowerCase()}`}
                    >
                      {app.outcomeStatus}
                    </span>
                  </p>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Created: {new Date(app.createdAt).toLocaleDateString()} |
                    Updated: {new Date(app.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {!isEditing ? (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEdit(app)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => onOpenExport(app.id)}
                      >
                        Export
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-primary" onClick={handleSave}>
                        Save
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isEditing && (
                <div
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div className="form-group">
                    <label>Outcome Status</label>
                    <select
                      value={editApp.outcomeStatus || "Draft"}
                      onChange={(e) =>
                        setEditApp({
                          ...editApp,
                          outcomeStatus: e.target
                            .value as GrantApplication["outcomeStatus"],
                        })
                      }
                    >
                      <option value="Draft">Draft</option>
                      <option value="Successful">Successful</option>
                      <option value="Unsuccessful">Unsuccessful</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Funder Name</label>
                    <input
                      type="text"
                      value={editApp.funderName || ""}
                      onChange={(e) =>
                        setEditApp({
                          ...editApp,
                          funderName: e.target.value,
                        })
                      }
                      placeholder="Enter funder name..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Project / Service</label>
                    <input
                      type="text"
                      value={editApp.projectOrService || ""}
                      onChange={(e) =>
                        setEditApp({
                          ...editApp,
                          projectOrService: e.target.value,
                        })
                      }
                      placeholder="Enter project or service name..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={editApp.notes || ""}
                      onChange={(e) =>
                        setEditApp({
                          ...editApp,
                          notes: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Add any notes for this application..."
                    />
                  </div>

                  {/* Common Fields Selection */}
                  <div
                    style={{
                      marginTop: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--color-border-light)",
                    }}
                  >
                    <h4 style={{ margin: "0 0 0.5rem" }}>Common Fields</h4>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--color-text-subdued)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Select common fields and their versions to include in this
                      application.
                    </p>
                    <input
                      type="text"
                      placeholder="Search common fields..."
                      value={commonFieldSearch}
                      onChange={(e) => setCommonFieldSearch(e.target.value)}
                      style={{ marginBottom: "0.75rem", width: "100%" }}
                    />
                    {groupedVisibleCommonFields.length === 0 ? (
                      <p
                        style={{
                          color: "var(--color-text-subdued)",
                          fontSize: "0.9rem",
                        }}
                      >
                        No common fields available. Add some in the Common
                        Information Library.
                      </p>
                    ) : (
                      groupedVisibleCommonFields.map(([group, fields]) => (
                        <div key={group} style={{ marginBottom: "0.75rem" }}>
                          <strong
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--color-text-subdued)",
                            }}
                          >
                            {group}
                          </strong>
                          {fields.map((field) => {
                            const isSelected = selectedCommonFieldIds.includes(
                              field.id
                            );
                            const selectedVersion =
                              selectedCommonFieldVersions[field.id] ??
                              field.version;
                            return (
                              <div
                                key={field.id}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "0.75rem",
                                  padding: "0.65rem 0.75rem",
                                  marginTop: "0.35rem",
                                  border: `1px solid ${
                                    isSelected
                                      ? "var(--color-primary)"
                                      : "var(--color-border-light)"
                                  }`,
                                  borderRadius: "var(--radius-sm)",
                                  background: isSelected
                                    ? "rgba(0,106,77,0.04)"
                                    : "transparent",
                                  cursor: "pointer",
                                  overflow: "hidden",
                                }}
                                onClick={() => toggleCommonField(field.id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleCommonField(field.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    flexShrink: 0,
                                    marginTop: "0.2rem",
                                    width: "1rem",
                                    height: "1rem",
                                  }}
                                />
                                <div
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        fontSize: "0.9rem",
                                        lineHeight: 1.3,
                                      }}
                                    >
                                      {field.label}
                                    </span>
                                    {isSelected &&
                                      field.versions &&
                                      field.versions.length > 1 && (
                                        <select
                                          value={selectedVersion}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            updateCommonFieldVersion(
                                              field.id,
                                              Number(e.target.value)
                                            );
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          style={{
                                            fontSize: "0.75rem",
                                            padding: "0.15rem 0.35rem",
                                            width: "auto",
                                            borderRadius: "var(--radius-sm)",
                                          }}
                                        >
                                          {field.versions.map((v) => (
                                            <option
                                              key={v.version}
                                              value={v.version}
                                            >
                                              v{v.version}
                                            </option>
                                          ))}
                                        </select>
                                      )}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "var(--color-text-subdued)",
                                      marginTop: "0.15rem",
                                      whiteSpace: "pre-wrap",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {(() => {
                                      const versionData = field.versions?.find(
                                        (v) => v.version === selectedVersion
                                      );
                                      return versionData
                                        ? versionData.value
                                        : field.value;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Specific Fields */}
                  <div
                    style={{
                      marginTop: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--color-border-light)",
                    }}
                  >
                    <h4 style={{ margin: "0 0 0.5rem" }}>
                      Application-Specific Fields
                    </h4>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--color-text-subdued)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Add custom fields unique to this application.
                    </p>
                    {specificFields.map((field) => (
                      <div
                        key={field.id}
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginBottom: "0.5rem",
                          alignItems: "flex-start",
                        }}
                      >
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateSpecificField(field.id, {
                              label: e.target.value,
                            })
                          }
                          placeholder="Field label"
                          style={{ flex: "0 0 35%" }}
                        />
                        <textarea
                          value={field.value}
                          onChange={(e) =>
                            updateSpecificField(field.id, {
                              value: e.target.value,
                            })
                          }
                          placeholder="Field value"
                          rows={2}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => removeSpecificField(field.id)}
                          style={{ flexShrink: 0, fontSize: "0.8rem" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={addSpecificField}
                      style={{ fontSize: "0.85rem" }}
                    >
                      + Add Specific Field
                    </button>
                  </div>

                  {/* Attach Profile Media */}
                  {profileMedia.length > 0 && (
                    <div
                      style={{
                        marginTop: "1rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid var(--color-border-light)",
                      }}
                    >
                      <h4 style={{ margin: "0 0 0.5rem" }}>
                        Attach Profile Media
                      </h4>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--color-text-subdued)",
                          marginBottom: "0.75rem",
                        }}
                      >
                        Select images or videos from your Charity Profile to
                        include with this application.
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(140px, 1fr))",
                          gap: "0.75rem",
                        }}
                      >
                        {profileMedia.map((media) => {
                          const isSelected = editAttachedMediaIds.includes(
                            media.id
                          );
                          return (
                            <div
                              key={media.id}
                              onClick={() => {
                                setEditAttachedMediaIds((prev) =>
                                  isSelected
                                    ? prev.filter((id) => id !== media.id)
                                    : [...prev, media.id]
                                );
                              }}
                              style={{
                                border: `2px solid ${
                                  isSelected
                                    ? "var(--color-primary)"
                                    : "var(--color-border-light)"
                                }`,
                                borderRadius: "var(--radius-sm)",
                                overflow: "hidden",
                                cursor: "pointer",
                                background: isSelected
                                  ? "rgba(0,106,77,0.06)"
                                  : "var(--color-bg-card)",
                                transition:
                                  "border-color 0.15s, background 0.15s",
                                position: "relative",
                              }}
                            >
                              {isSelected && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "0.3rem",
                                    right: "0.3rem",
                                    background: "var(--color-primary)",
                                    color: "#fff",
                                    borderRadius: "50%",
                                    width: "1.3rem",
                                    height: "1.3rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    zIndex: 1,
                                  }}
                                >
                                  ✓
                                </div>
                              )}
                              {media.type === "image" ? (
                                <img
                                  src={media.dataUrl}
                                  alt={media.caption || media.name}
                                  style={{
                                    width: "100%",
                                    aspectRatio: "4/3",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />
                              ) : (
                                <video
                                  src={media.dataUrl}
                                  muted
                                  preload="metadata"
                                  style={{
                                    width: "100%",
                                    aspectRatio: "4/3",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />
                              )}
                              <div
                                style={{
                                  padding: "0.35rem 0.5rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {media.caption || media.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {editAttachedMediaIds.length > 0 && (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-primary)",
                            marginTop: "0.5rem",
                            fontWeight: 600,
                          }}
                        >
                          {editAttachedMediaIds.length} media file(s) selected
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  // Import Applications Tab Content
  const renderImportTab = () => (
    <div className="card">
      <h3>Import Applications</h3>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
        Import grant applications from a JSON file or paste JSON directly.
      </p>
      <div className="form-group">
        <label>Upload JSON File</label>
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          style={{ display: "block", marginBottom: "1rem" }}
        />
      </div>
      <div className="form-group">
        <label>Or Paste JSON</label>
        <textarea
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          rows={8}
          placeholder={`[
  {
    "id": "app-123",
    "name": "My Grant Application",
    "notes": "",
    "createdAt": "2024-01-01",
    "updatedAt": "2024-01-01"
  }
]`}
        />
      </div>
      {importError && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          {importError}
        </div>
      )}
      {importSuccess && (
        <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
          {importSuccess}
        </div>
      )}
      <button
        className="btn btn-primary"
        onClick={handleImport}
        disabled={!importJson.trim()}
      >
        Import Applications
      </button>
    </div>
  );

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <h2>Applications</h2>
          <p className="muted">
            Create applications and capture exactly which common field versions
            were selected.
          </p>
        </div>
      </div>

      {/* <div className="row-actions section-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={() => setImportOpen(true)}
        >
          Import applications
        </button>
      </div> */}

      <ImportApplicationsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={async (apps) => {
          for (const app of apps) {
            await onCreateApplication(app);
          }
        }}
      />

      {renderSubTabs()}
      <div className="sub-tab-content">
        {activeSubTab === "create" && (
          <div role="tabpanel" id="panel-create">
            {renderCreateTab()}
          </div>
        )}
        {activeSubTab === "saved" && (
          <div role="tabpanel" id="panel-saved">
            {renderSavedTab()}
          </div>
        )}
        {activeSubTab === "import" && (
          <div role="tabpanel" id="panel-import">
            {renderImportTab()}
          </div>
        )}
      </div>
    </section>
  );
}
