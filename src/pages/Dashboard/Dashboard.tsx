import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiErrorBanner, Section } from "../../components";
import { useApplicationsStore, useCommonFieldsStore } from "../../store";
import { formatDateTime } from "../../utils";
import styles from "./styles.module.css";

export function Dashboard() {
  const navigate = useNavigate();
  const { applications, deleteApplication, error, clearError, reload } =
    useApplicationsStore();
  const { commonFields } = useCommonFieldsStore();
  const [query, setQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const groupOptions = useMemo(() => {
    const groupSet = new Set<string>();
    for (const field of commonFields) {
      groupSet.add(field.group);
    }
    return [...groupSet].sort((a, b) => a.localeCompare(b));
  }, [commonFields]);

  const applicationGroups = useMemo(() => {
    const fieldLookup = new Map(commonFields.map((field) => [field.id, field]));
    const map = new Map<string, Set<string>>();
    for (const app of applications) {
      const groupSet = new Set<string>();
      for (const fieldId of app.commonFieldIds) {
        const field = fieldLookup.get(fieldId);
        if (field) groupSet.add(field.group);
      }
      map.set(app.id, groupSet);
    }
    return map;
  }, [applications, commonFields]);

  const normalizedQuery = query.trim().toLowerCase();
  const hasFilters = normalizedQuery.length > 0 || selectedGroups.length > 0;

  const filteredApplications = useMemo(() => {
    const sorted = [...applications].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    const filtered = sorted.filter((app) => {
      if (normalizedQuery && !app.name.toLowerCase().includes(normalizedQuery)) {
        return false;
      }
      if (selectedGroups.length > 0) {
        const appGroupSet = applicationGroups.get(app.id);
        if (!appGroupSet) return false;
        return selectedGroups.some((group) => appGroupSet.has(group));
      }
      return true;
    });
    return filtered.slice(0, 5);
  }, [applications, applicationGroups, normalizedQuery, selectedGroups]);

  const toggleGroup = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((item) => item !== group) : [...prev, group],
    );
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Grant Application Manager</h1>
      </header>

      {error ? (
        <ApiErrorBanner
          message={error}
          onDismiss={clearError}
          onRetry={() => void reload()}
        />
      ) : null}

      <div className={styles.tabs}>
        <Link to="/" className={styles.tabActive}>
          Dashboard
        </Link>
        <Link to="/common" className={styles.tabInactive}>
          Common Information
        </Link>
        <Link to="/applications" className={styles.tabInactive}>
          Applications
        </Link>
        <Link to="/applications/new" className={styles.tabInactive}>
          + Create New Application
        </Link>
      </div>

      <Section title="Search & Filters">
        <div className={styles.filters}>
          <label className={styles.fieldLabel}>
            <span>Search by name</span>
            <input
              className={styles.input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search applications"
            />
          </label>
          <div className={styles.groupFilters}>
            <div className={styles.filterTitle}>Group filters</div>
            {groupOptions.length === 0 ? (
              <div className={styles.empty}>No groups available yet.</div>
            ) : (
              <div className={styles.groupChips}>
                {groupOptions.map((group) => {
                  const isActive = selectedGroups.includes(group);
                  return (
                    <button
                      key={group}
                      type="button"
                      className={isActive ? styles.groupChipActive : styles.groupChip}
                      onClick={() => toggleGroup(group)}
                    >
                      {group}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => {
              setQuery("");
              setSelectedGroups([]);
            }}
            disabled={!hasFilters}
          >
            Clear filters
          </button>
        </div>
      </Section>

      <Section title="Recent Applications">
        {filteredApplications.length === 0 ? (
          <div className={styles.empty}>
            {applications.length === 0
              ? "No applications yet."
              : "No applications match your filters."}
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div>Application Name</div>
              <div>Created On</div>
              <div>Actions</div>
            </div>
            {filteredApplications.map((app) => (
              <div key={app.id} className={styles.tableRow}>
                <div className={styles.cellTitle}>{app.name}</div>
                <div>{formatDateTime(app.createdAt)}</div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => navigate(`/applications/${app.id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() => {
                      void deleteApplication(app.id).catch(() => undefined);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}
