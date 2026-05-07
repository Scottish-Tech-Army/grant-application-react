import React from "react";
import { Box, Checkbox, Paper, Stack, TextField, Typography } from "@mui/material";
import CommonQAItem from "./CommonQAItem";
import CommonFieldHistoryDialog from "./CommonFieldHistoryDialog";

export default function Step1CommonInfo({
  applicationName,
  onApplicationNameCommit,
  commonItems,
  handleCommonItem,
  funderName,
  onFunderNameCommit,
  readOnly = false
}) {
  // ✅ LOCAL draft state (this is the key)
  const [nameDraft, setNameDraft] = React.useState(applicationName ?? "");
  const [funderNameDraft, setFunderNameDraft] = React.useState(funderName ?? "");
  
  const [historyItem, setHistoryItem] = React.useState(null);
  const allSelected =
  commonItems.length > 0 &&
  commonItems.every((x) => x.selected !== false);

  const noneSelected =
    commonItems.every((x) => x.selected === false);

  const someSelected = !allSelected && !noneSelected;
 
  const toggleSelectAll = (checked) => {
    handleCommonItem((prev) =>
      prev.map((x) => ({
        ...x,
        selected: checked
      }))
    );
  };

  const updateCommonAnswer = (id, answer) => {
    handleCommonItem((prev) =>
      prev.map((x) => (x.id === id ? { ...x, answer } : x))
    );
  };

  // ✅ Toggle inclusion of a common QA
      const toggleCommonSelection = (id, checked) => {
        handleCommonItem((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, selected: !x.selected } : x
          )
        );
      };

  // keep draft in sync if parent changes (rare, but safe)
  React.useEffect(() => {
    setNameDraft(applicationName ?? "");
  }, [applicationName]);

  const commitApplicationName = () => {
    onApplicationNameCommit(nameDraft.trim());
  };

  const commitFunderName = () => {
    onFunderNameCommit(funderNameDraft.trim());
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={900}>
        Application details
      </Typography>

      <TextField
        label="Application name"
        value={nameDraft}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={commitApplicationName}
        required
        fullWidth
        placeholder="e.g., ABC Foundation"
        disabled={readOnly}
      />
      <TextField
        label="Funder name"
        value={funderNameDraft}
        onChange={(e) => setFunderNameDraft(e.target.value)}
        onBlur={commitFunderName}
        fullWidth
        placeholder="e.g., Youth Program"
        margin-top="0px"
        disabled={readOnly}
      />
      <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Common Information
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which common questions should be included in this application.
              You can edit answers and view version history.
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 1 }}
          >
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={(e) => toggleSelectAll(e.target.checked)}
              disabled={readOnly}
            />

            <Typography fontWeight={700}>
              Select all common questions
            </Typography>
          </Stack>
    
          <Stack spacing={1.5}>
            {commonItems.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography color="text.secondary">
                  No common questions selected (you can proceed or add later via Common Information screen).
                </Typography>
              </Paper>
            ) : (
              commonItems.map((item: any) => (
                <CommonQAItem
                    item={item}
                    onCommit={(id: any, answer: any) => updateCommonAnswer(id, answer)}
                    toggleCommonSelection={(id: any, checked: boolean) => toggleCommonSelection(id, checked)}
                    onViewHistory={setHistoryItem}
                    readOnly={readOnly}
                />
              ))
            )}
          </Stack>
        </Box>
        <CommonFieldHistoryDialog
        open={Boolean(historyItem)}
        question={"What is the organization’s legal name and primary contact information?"}
        versions={ [
          {
            "version": 5,
            "answer": "Bright Futures Community Foundation. Address: 123 Hope Street, Springfield, IL 62701, USA. Phone: +1 (217) 555-0123. Email: info@brightfuturesfoundation.org. Website: https://www.brightfuturesfoundation.org",
            "updatedBy": "Sarah Mitchell (sarah.mitchell@brightfuturesfoundation.org)",
            "updatedDate": "2026-03-31T10:15:42.120Z"
          },
          {
            "version": 4,
            "answer": "Bright Futures Community Foundation, located at 123 Hope Street, Springfield, IL 62701. Primary contact email: info@brightfuturesfoundation.org. Phone: +1 (217) 555-0123.",
            "updatedBy": "David Reynolds (david.reynolds@brightfuturesfoundation.org)",
            "updatedDate": "2026-03-30T16:48:19.884Z"
          },
          {
            "version": 3,
            "answer": "Bright Futures Community Foundation. Address: 123 Hope Street, Springfield, Illinois 62701. Contact phone number: +1 (217) 555-0123.",
            "updatedBy": "Linda Chen (linda.chen@brightfuturesfoundation.org)",
            "updatedDate": "2026-03-29T14:22:03.417Z"
          },
          {
            "version": 2,
            "answer": "Bright Futures Community Foundation, 123 Hope Street, Springfield, IL. Email contact: info@brightfuturesfoundation.org.",
            "updatedBy": "Michael Alvarez (michael.alvarez@brightfuturesfoundation.org)",
            "updatedDate": "2026-03-28T11:05:36.902Z"
          },
          {
            "version": 1,
            "answer": "Bright Futures Community Foundation, Springfield, Illinois.",
            "updatedBy": "System Migration (system@brightfuturesfoundation.org)",
            "updatedDate": "2026-03-27T09:30:12.451Z"
          }
        ]}
        onClose={() => setHistoryItem(null)}
        onRestoreVersion={undefined}
      />
    </Stack>
  );
}