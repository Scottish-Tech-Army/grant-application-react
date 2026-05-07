import { Box, Button, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";
import React from "react";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";


export default function Step3Preview({
    applicationName,
    funderName,
    allItems
  }) {
    const [copyToastOpen, setCopyToastOpen] = React.useState(false);
    const [copyToastError, setCopyToastError] = React.useState("");

    const buildPreviewText = () => {
      const lines: string[] = [];

      const sectionBlock = (items: any[]) => {
        if (!items.length) {
          lines.push("(none)");
          lines.push("");
          return;
        }
        items.forEach((x: { question: any; answer: string; }) => {
          lines.push(`${x.question}: ${x.answer?.trim() ? x.answer : "(No answer yet)"}`);
          lines.push("");
        });
      };

      sectionBlock(allItems);

      return lines.join("\n");
    };

    const handleCopyPreview = async () => {
      try {
        const text = buildPreviewText();

        // Modern clipboard API (requires user gesture; works on HTTPS or localhost)
        await navigator.clipboard.writeText(text);  // [1](https://stackoverflow.com/questions/39501289/in-reactjs-how-to-copy-text-to-clipboard)
        setCopyToastError("");
        setCopyToastOpen(true);
      } catch (err) {
        setCopyToastError("Copy failed. Please try again or use Export.");
        setCopyToastOpen(true);
      }
    };
    return (
      <Box>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
              Application name
          </Typography>
          <Typography sx={{ fontWeight: 900 }}>
              {applicationName.trim() || "(Not set)"}
          </Typography>
        </Paper>
        {funderName && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                  Funder name
              </Typography>
              <Typography sx={{ fontWeight: 900 }}>
                  {funderName.trim() || "(Not set)"}
              </Typography>
            </Paper>
        )}
        
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Preview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review everything together before exporting.
            </Typography>
          </Box>

          <Button
            startIcon={<ContentCopyIcon />}
            variant="outlined"
            onClick={handleCopyPreview}
            disabled={allItems.length === 0}
          >
            Copy Preview
          </Button>
        </Stack>
  
        <Paper variant="outlined">
          <List dense>
            {allItems.length === 0 ? (
              <ListItemText
                  primary="Nothing to preview yet."
                  secondary="Add common or additional information first."
                />
            ) : (
              allItems.map((x) => (
                <React.Fragment key={x.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontWeight: 700 }}>{x.question}</Typography>
                        </Stack>
                      }
                      secondary={
                        x.answer?.trim()
                          ? x.answer
                          : <Typography component="span" color="text.secondary">(No answer yet)</Typography>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))
            )}
          </List>
        </Paper>
        <Snackbar
          open={copyToastOpen}
          autoHideDuration={500}
          onClose={() => setCopyToastOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          {copyToastError ? (
            <Alert severity="error" variant="filled" onClose={() => setCopyToastOpen(false)}>
              {copyToastError}
            </Alert>
          ) : (
            <Alert severity="success" variant="filled" onClose={() => setCopyToastOpen(false)}>
              Preview copied to clipboard
            </Alert>
          )}
        </Snackbar>
      </Box>
    );
  }