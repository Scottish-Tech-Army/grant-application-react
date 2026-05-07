import React from "react";
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";

export default function CommonFieldRow({ item, onUpdate, onDelete, onViewHistory }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(item.answer ?? "");

  // keep local draft in sync if parent updates (e.g., reload)
  React.useEffect(() => {
    if (!editing) setDraft(item.answer ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.answer]);

  const openEdit = () => {
    setDraft(item.answer ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(item.answer ?? "");
    setEditing(false);
  };

  const saveEdit = () => {
    onUpdate(item, draft);
    setEditing(false);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800 }}>{item.question}</Typography>

          {!editing ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
              {item.answer?.trim() ? item.answer : "(No answer yet)"}
            </Typography>
          ) : null}

          <Collapse in={editing} unmountOnExit>
            <TextField
              fullWidth
              multiline
              minRows={3}
              sx={{ mt: 1 }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}   // ✅ smooth typing
              placeholder="Type answer..."
            />

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button startIcon={<SaveIcon />} variant="contained" onClick={saveEdit}>
                Save
              </Button>
              <Button startIcon={<CloseIcon />} variant="outlined" onClick={cancelEdit}>
                Cancel
              </Button>
            </Stack>
          </Collapse>
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton onClick={openEdit}>
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton color="error" onClick={() => onDelete(item)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="View history">
            <IconButton
                onClick={() => onViewHistory(item)}
                
            >
                <HistoryIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}