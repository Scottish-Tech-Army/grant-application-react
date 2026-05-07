import React from "react";
import { Paper, Stack, Typography, TextField, IconButton, Tooltip, Checkbox } from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";

export default function CommonQAItem({ item, onCommit, toggleCommonSelection, onViewHistory, readOnly }) {
  const [draft, setDraft] = React.useState(item.answer ?? "");

  // Keep local draft in sync if item changes (e.g., reset/restore)
  React.useEffect(() => {
    setDraft(item.answer ?? "");
  }, [item.id, item.answer]);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Checkbox
            checked={item.selected}
            disabled={readOnly}
            onChange={() => toggleCommonSelection(item.id, item.selected)}
          />

          <Typography fontWeight={800}>
            {item.question}
          </Typography>
        </Stack>
        {!readOnly && (
        <Tooltip title="View history">
          <IconButton
            onClick={() => onViewHistory(item)}
          >
            <HistoryIcon />
          </IconButton>
        </Tooltip>
        )}
      </Stack>
      {item.selected && (
        <TextField
          fullWidth
          multiline
          minRows={2}
          sx={{ mt: 1 }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}     // ✅ smooth typing
          onBlur={() => onCommit(item.id, draft)}        // ✅ commit once
          placeholder="Type answer..."
          disabled={readOnly}
        />)}
    </Paper>
  );
}