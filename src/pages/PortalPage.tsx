import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppShell from "../components/AppShell";
import StatusPill from "../components/StatusPill";
import StatsCard from "../components/StatsCard";
import { mockApplications } from "../data/mockApplications";
import type { GrantApplication } from "../data/mockApplications";
import type { MoreAction } from "../components/RowMoreMenu";
import RowMoreMenu from "../components/RowMoreMenu";
import ConfirmDialog from "../components/ConfirmDialog";
type Tab = "All Applications" | "Drafts" | "Submitted" | "Archived";

// Helper function to format date (2026-02-01 -> Feb 01, 2026)
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// Get all unique field names from applications
function getColumnNames(apps: GrantApplication[]): string[] {
  const fields = new Set<string>();
  apps.forEach((app) => {
    Object.keys(app).forEach((key) => {
      if (key !== "applicationId") {
        fields.add(key);
      }
    });
  });
  // Return in consistent order
  const order = ["name", "funderName", "status", "createdDate"];
  return order.filter((f) => fields.has(f)).concat(
    Array.from(fields).filter((f) => !order.includes(f))
  );
}

export default function PortalPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("All Applications");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [apps, setApps] = useState<GrantApplication[]>([]);
  const [allApps, setAllApps] = useState<GrantApplication[]>([]);

  // useEffect(() => {
  //   if (tab === "All Applications") setApps(allApps);
  //   else {
  //     const map: Record<Exclude<Tab, "All Applications">, string> = {
  //       Drafts: "DRAFT",
  //       Submitted: "SUBMITTED",
  //       Archived: "ARCHIVED",
  //     };
  //     const temp = allApps.filter(
  //       (a) => a.status === map[tab as Exclude<Tab, "All Applications">]
  //     );
  //     setApps(temp);
  //   }
  // }, [tab, allApps]);

  const filtered = apps;

  // const filtered: GrantApplication[] = useMemo(() => {
  //   if (tab === "All Applications") return mockApplications;
  //   const map: Record<Exclude<Tab, "All Applications">, AppStatus> = {
  //     Drafts: "Draft",
  //     Submitted: "Submitted",
  //     Archived: "Archived",
  //   };
  //   return mockApplications.filter((a) => a.status === map[tab as Exclude<Tab, "All Applications">]);
  // }, [tab]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const userId = "aaaaaaaa-0001-0001-0001-000000000001";
        const response = await axios.get(
          `/api/v1/applications/user/aaaaaaaa-0001-0001-0001-000000000001`
        );
        
        // Use raw API response data directly
        setAllApps(response.data);
        debugger;
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        // Fall back to mock data on error
        setAllApps(mockApplications);
      }
    };

    fetchApplications();
  }, []);

  const toggleMenu = (id: string, el: HTMLElement) => {
    setOpenMenuForId((prev) => (prev === id ? null : id));
    setAnchorRect(el.getBoundingClientRect());
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);

  const closeMenu = useCallback(() => {
    setOpenMenuForId(null);
    setAnchorRect(null);
  }, []);

  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const activeRow = useMemo(
    () => allApps.find((a) => a.applicationId === openMenuForId) || null,
    [allApps, openMenuForId]
  );


  const stats = useMemo(() => {
    const total = allApps.length;
    const submitted = allApps.filter((a) => a.status === "SUBMITTED").length;
    const inProgress = allApps.filter((a) => a.status === "IN_PROGRESS").length;
    const archived = allApps.filter((a) => a.status === "ARCHIVED").length;
    return { total, submitted, inProgress, archived };
  }, [allApps]);

  function handleLogout() {
    localStorage.removeItem("auth");
    navigate("/");
  }

  const handleMoreAction = (rowId: string, action: MoreAction) => {
    if (action === "delete") {
      // open confirm dialog
      setConfirmDeleteId(rowId);
      closeMenu();
      return;
    }

    // other actions...
    closeMenu();
  };
 
const confirmDelete = async () => {
  if (!confirmDeleteId) return;

  const id = confirmDeleteId;

  // optimistic removal (store backup in case rollback needed)
  const backup = apps;
  setDeletingId(id);
  setConfirmDeleteId(id);
  setApps((prev) => prev.filter((a) => a.applicationId !== id));

  try {
    await Promise.resolve();
    setConfirmDeleteId(null);
  } catch (e) {
    // rollback on failure
    setApps(backup);
    console.error("Delete failed:", e);
  } finally {
    setDeletingId(null);
  }
};
  
  const cancelDelete = () => {
    if (deletingId) return; // prevent cancel mid-flight
    setConfirmDeleteId(null);
  };
 

  return (
    <AppShell
      title="Funding Application Portal"
      rightSlot={
        <div className="top-actions">
          <button className="link" type="button">Help</button>
          <div className="user-pill">User Profile</div>
          <button className="link" type="button" onClick={handleLogout}>Logout</button>
        </div>
      }
    >
      <div className="panel">
        <div className="panel__header">
          <div className="dropdown">
            <button className="btn btn--primary" onClick={() => navigate("/applications/new")}>
              Create New Application <span className="caret">▾</span>
            </button>
          </div>
        </div>

        <div className="tabs">
          {(["All Applications", "Drafts", "Submitted", "Archived"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={t === tab ? "tab tab--active" : "tab"}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                {getColumnNames(allApps).map((col) => (
                  <th key={col}>
                    {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </th>
                ))}
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allApps.map((row) => (
                <tr key={row.applicationId}>
                  <td>
                    <input type="checkbox" defaultChecked={row.applicationId === "1"} />
                  </td>
                  {getColumnNames(allApps).map((col) => (
                    <td key={`${row.applicationId}-${col}`} className={col === "name" ? "cell--strong" : ""}>
                      {col === "status" ? (
                        <StatusPill status={row.status} />
                      ) : col === "createdDate" ? (
                        formatDate(row[col])
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                  <td>
                    <div className="row-actions">
                      <button className="btn btn--tiny" type="button">Open</button>
                      <button className="btn btn--tiny" type="button">Export</button>
                      <button
                        className="btn btn--more"
                        type="button"
                        onClick={(e) => toggleMenu(row.applicationId, e.currentTarget)}
                        disabled={deletingId === row.applicationId}
                      >
                        More ▾
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {allApps.length === 0 && (
                <tr>
                  <td colSpan={getColumnNames(allApps).length + 2} className="empty">
                    No applications in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <div className="muted">Showing 1 to {allApps.length} of {allApps.length} entries</div>
          <div className="pager__right">
            <button className="btn btn--tiny btn--ghost" type="button">Previous</button>
            <span className="page-pill">1</span>
            <button className="btn btn--tiny btn--ghost" type="button">Next</button>
          </div>
        </div>
      </div>

      <div className="stats">
        <StatsCard label="Total Applications" value={stats.total} />
        <StatsCard label="Submitted" value={stats.submitted} />
        <StatsCard label="In Progress" value={stats.inProgress} />
        <StatsCard label="Archived" value={stats.archived} />
      </div>
      <RowMoreMenu
        open={!!openMenuForId && !!anchorRect}
        anchorRect={anchorRect}
        onClose={closeMenu}
        disableDelete={deletingId === openMenuForId}
        onAction={(action) => {
          if (openMenuForId) handleMoreAction(openMenuForId, action);
        }} />
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete application?"
        message={
          activeRow
            ? `Are you sure you want to delete "${activeRow.name}"? This action cannot be undone.`
            : "Are you sure you want to delete this item?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        isBusy={!!deletingId}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </AppShell>
  );
}