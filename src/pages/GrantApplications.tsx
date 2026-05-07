import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";

import ApplicationsTable from "../components/ApplicationsTable";
import NewApplicationDialog from "../components/NewApplicationDialog";
import { exportApplicationExcel, exportApplicationPdf } from "../utilities/exporters";
import { fetchApplications } from "../api/grandApplicationApi";

const PAGE_SIZES = [10, 25];

// ✅ backend -> UI status mapping
const mapStatus = (status) => {
  if (!status) return "Drafted";
  const s = String(status).toUpperCase();
  if (s === "SUBMITTED") return "Submitted";
  if (s === "DRAFTED") return "Drafted";
  if (s === "DELETED") return "Deleted";
  return status; // fallback for any future status
};

export default function GrantApplications({ isActive = true }) {
  // ✅ apps now represent the CURRENT server page (not whole dataset)
  const [apps, setApps] = React.useState([]);

  // server pagination metadata
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalElements, setTotalElements] = React.useState(0);

  // loading + error
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // search/filter/paging (UI)
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [page, setPage] = React.useState(1);      // UI 1-based
  const [pageSize, setPageSize] = React.useState(10);

  // edit/view dialog
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState("edit"); // edit | view
  const [activeApp, setActiveApp] = React.useState(null);

  // rename dialog
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");
  const [renameTarget, setRenameTarget] = React.useState(null);

  // delete (client side only for now)
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  // 🔁 Replace later with auth context
  const userId = "42391438-f47c-47f1-a4b7-c1078a8a7ccf";
  const tenantId = "0a055392-097c-4581-9ab7-6ce41af71dc0";

  /* -------------------- Fetch from API on navigation + pagination -------------------- */
  const loadApplications = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchApplications({
        userId,
        tenantId,
        pageNumber: page - 1, // backend expects 0-based
        pageSize,
      });

      // Map backend → UI model
      const mapped = (data.content || [])
        .filter((a) => String(a.status).toUpperCase() !== "DELETED") // hide deleted
        .map((a) => ({
          id: a.applicationId,
          applicationName: a.name,
          funderName: a.funderName,
          status: mapStatus(a.status),
          updatedAt: a.createdAt,
          updatedBy: a.createdBy,
          // optional: keep raw server object if needed later
          _server: a,
        }));

      setApps(mapped);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load applications");
      setApps([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [userId, tenantId, page, pageSize]);

  React.useEffect(() => {
    if (!isActive) return;
    loadApplications();
  }, [isActive, loadApplications]);

  /* -------------------- Client-side search/filter on current page -------------------- */
  const filteredApps = React.useMemo(() => {
    const q = search.toLowerCase().trim();
  
    return apps.filter((a) => {
      const matchesText =
        a.applicationName.toLowerCase().includes(q) ||
        a.funderName.toLowerCase().includes(q);
  
      const matchesStatus =
        statusFilter === "All" || a.status === statusFilter;
  
      return matchesText && matchesStatus;
    });
  }, [apps, search, statusFilter]);
  /* -------------------- Table Actions -------------------- */
  const onDelete = (app) => setDeleteTarget(app);

  const confirmDelete = () => {
    if (!deleteTarget) return;

    // Client-side removal (until you add server delete API)
    setApps((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const onEdit = (app) => {
    setActiveApp(app);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const onView = (app) => {
    setActiveApp(app);
    setDialogMode("view");
    setDialogOpen(true);
  };

  const onRename = (app) => {
    setRenameTarget(app);
    setRenameValue(app.applicationName);
    setRenameOpen(true);
  };

  const saveFromDialog = (updatedApp) => {
    // Update row on current page if present
    setApps((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));
  };

  const confirmRename = () => {
    if (!renameTarget) return;
    const newName = renameValue.trim();
    if (!newName) return;

    setApps((prev) =>
      prev.map((a) =>
        a.id === renameTarget.id
          ? {
              ...a,
              applicationName: newName,
              updatedAt: new Date().toISOString(),
              updatedBy: "current.user@org.com",
            }
          : a
      )
    );

    setRenameOpen(false);
    setRenameTarget(null);
  };

  const onExportPdf = (app) => {
    exportApplicationPdf(app.applicationName, app.funderName, app.commonItems, app.additionalItems);
  };

  const onExportExcel = (app) => {
    exportApplicationExcel(app.applicationName, app.funderName, app.commonItems, app.additionalItems);
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
          Grant Applications
        </Typography>

        {/* Search + status filter */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by application or funder (current page)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // no server call (API doesn't support search); keep page as-is
            }}
          />

          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Drafted">Drafted</MenuItem>
              <MenuItem value="Submitted">Submitted</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Rows</InputLabel>
            <Select
              label="Rows"
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value);
                setPage(1); // reset pagination on page size change
              }}
            >
              {PAGE_SIZES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Loading / Error */}
        {loading && (
          <Stack alignItems="center" sx={{ my: 3 }}>
            <CircularProgress />
          </Stack>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <ApplicationsTable
            rows={filteredApps}
            onEdit={onEdit}
            onView={onView}
            onRename={onRename}
            onExportPdf={onExportPdf}
            onExportExcel={onExportExcel}
            onDelete={onDelete}
          />
        )}

        {/* Server Pagination */}
        {totalPages > 1 && (
          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Total: {totalElements} applications
            </Typography>
          </Stack>
        )}

        {/* Rename dialog */}
        <Dialog open={renameOpen} onClose={() => setRenameOpen(false)}>
          <DialogTitle sx={{ fontWeight: 900 }}>Rename application</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              error={!renameValue.trim()}
              helperText={!renameValue.trim() ? "Application name is required" : " "}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button variant="contained" disabled={!renameValue.trim()} onClick={confirmRename}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete dialog */}
        <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
          <DialogTitle sx={{ fontWeight: 900 }}>Delete application?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete:
              <br />
              <b>{deleteTarget?.applicationName}</b>
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit/View dialog */}
        <NewApplicationDialog
          open={dialogOpen}
          mode={dialogMode}
          application={activeApp}
          onClose={() => setDialogOpen(false)}
          onSave={saveFromDialog}
        />
      </CardContent>
    </Card>
  );
}