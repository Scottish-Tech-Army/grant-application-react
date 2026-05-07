import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Paper,
  Divider,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";

export default function CommonFieldHistoryDialog({
  open,
  question,
  versions,
  onClose,
  onRestoreVersion

}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Version history
      </DialogTitle>

      <DialogContent dividers>
        <Typography sx={{ mb: 2 }}>
          <b>Question:</b> {question}
        </Typography>

        {versions?.length ? (
          <Stack spacing={2}>
            {[...versions].reverse().map((v) => (
              <Paper variant="outlined" sx={{ p: 2 }}>
              {/* Header row: left meta + right restore */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Typography variant="caption" color="text.secondary">
                  Version {v.version} •{" "}
                  {new Date(v.updatedDate).toLocaleString()} •{" "}
                  {v.updatedBy}
                </Typography>
            
                <Button
                  size="small"
                  startIcon={<RestoreIcon />}
                  onClick={() => onRestoreVersion(v.question, v)}
                >
                  Restore this version
                </Button>
              </Stack>
            
              <Divider sx={{ my: 1 }} />
            
              <Typography sx={{ whiteSpace: "pre-wrap" }}>
                {v.answer || "(Empty answer)"}
              </Typography>
            </Paper>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">
            No previous versions available.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}