import React, { useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";

import QAAddForm from "../components/QAAddForm";
import CommonFieldRow from "../components/CommonFieldRow";
import CommonFieldHistoryDialog from "../components/CommonFieldHistoryDialog";
import Pagination from "@mui/material/Pagination";
import TextField from "@mui/material/TextField";
import { createCommonQuestion, deleteCommonInfo, fetchCommonQuestions, fetchCommonQuestionVersions, updateCommonInfo } from "../api/commonInformationApi";

export default function CommonInfo() {
  
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [searchText, setSearchText] = React.useState("");
  
  const tenantId = "0eadf87c-fe41-4a62-bb79-3eebdd37be70";
  const userId = "42391438-f47c-47f1-a4b7-c1078a8a7ccf";

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [questions, setQuestions] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);
  const [toast, setToast] = React.useState({ open: false, type: "success", msg: "" });

  
const [historyOpen, setHistoryOpen] = React.useState(false);
const [historyItem, setHistoryItem] = React.useState(null);
const [versions, setVersions] = React.useState([]);



  const loadPage = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchCommonQuestions({
        tenantId,
        pageNumber: page,
        pageSize,
      });

      setQuestions(data.questions || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load common information");
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, pageSize]);



  React.useEffect(() => {
    loadPage();
  }, [loadPage]);


  /* ---------------- UI states ---------------- */

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

 
const handleCreateCommon = async ({ question, answer }) => {
  try {
    await createCommonQuestion({
      tenantId,
      userId,
      question,
      answer,
    });

    setToast({ open: true, type: "success", msg: "Common field added successfully" });

    // ✅ Refresh page data (recommended)
    await loadPage();
  } catch (err) {
    console.error(err);
    setToast({ open: true, type: "error", msg: "Failed to add common field" });
  }
};

  const handleUpdateAnswer = async (item, newAnswer) => {
    // Optimistic update (instant UI)
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === item.id
          ? {
            ...q,
            answer: newAnswer,
            // optimistic version bump (optional)
            currentVersion: (q.currentVersion ?? 0) + 1,
          }
          : q
      )
    );

    try {
      await updateCommonInfo({
        questionId: item.id,
        tenantId,
        userId,
        question: item.question, // API requires it
        answer: newAnswer,
      });

      setToast({ open: true, type: "success", msg: "Saved successfully" });

      // ✅ Recommended: re-fetch page to sync real server version
      await loadPage();
    } catch (err) {
      console.error(err);

      setToast({ open: true, type: "error", msg: "Save failed. Please retry." });

      // rollback by reloading from server
      await loadPage();
      throw err;
    }
  };

  const handleDeleteRequest = (item) => {
    setDeleteTarget(item);
  };
  
  const confirmDelete = async () => {
    if (!deleteTarget) return;
  
    try {
      await deleteCommonInfo({
        questionId: deleteTarget.id,
        tenantId,
      });
  
      setToast({
        open: true,
        type: "success",
        msg: "Common field deleted successfully",
      });
  
      // ✅ reload page to stay in sync with pagination
      await loadPage();
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        type: "error",
        msg: "Failed to delete common field",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleViewHistory = async (item) => {
    try {
      const data = await fetchCommonQuestionVersions({
        questionId: item.id,
        tenantId,
      });
  
      setVersions(data || []);
      setHistoryItem(item);
      setHistoryOpen(true);
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        type: "error",
        msg: "Failed to load version history",
      });
    }
  };
  
  const handleRestoreVersion = (fieldId, version) => {
    // setCommonFields((prev) =>
    //   prev.map((x) => {
    //     if (x.id !== fieldId) return x;

    //     return {
    //       ...x,
    //       answer: version.answer,
    //       versions: [
    //         ...(x.versions ?? []),
    //         {
    //           id: crypto.randomUUID(),
    //           answer: x.answer, // ✅ current value becomes a new version
    //           updatedAt: new Date().toISOString(),
    //           updatedBy: "current.user@org.com", // later from auth
    //         },
    //       ],
    //     };
    //   })
    // )

    setHistoryItem(null); // close dialog after restore
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
          Common Information
        </Typography>

        {/* Reusable add form */}
        <QAAddForm
          title="Add new common field"
          questionLabel="Common question"
          answerLabel="Default answer"
          addButtonText="Add to Common Info"
          questionRequired
          answerRequired
          addButtonEnabled={true}
          onAdd={handleCreateCommon}
          validate={undefined}
          onDelete={undefined}
          onUpdate={undefined}
          id={undefined}
        />

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
            Existing common fields
          </Typography>

          <Box sx={{ mt: 3, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search common fields..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1); // ✅ reset page on new search
              }}
            />
          </Box>

          <Stack spacing={1.5}>
            {questions.length === 0 ? (
              <Typography color="text.secondary">
                No matching common fields found.
              </Typography>
            ) : (
              questions.map((item) => (
                <CommonFieldRow
                  key={item.id}
                  item=
                  {{
                    id: item.id,
                    question: item.question,
                    answer: item.answer,
                    currentVersion: item.currentVersion,
                    isActive: item.isActive,
                  }}

                  onUpdate={handleUpdateAnswer}
                  onDelete={handleDeleteRequest}
                  onViewHistory={handleViewHistory}
                />
              ))
            )}
          </Stack>

          {totalPages > 1 && (
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            </Stack>
          )}

        </Box>

        {/* Delete confirm dialog */}
        <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
          <DialogTitle sx={{ fontWeight: 900 }}>Delete common field?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete:
              <br />
              <b>{deleteTarget?.question}</b>
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)} color="inherit">
              Cancel
            </Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        <CommonFieldHistoryDialog
          open={historyOpen}
          question={historyItem?.question}
          versions={versions}
          onClose={() => {
            setHistoryOpen(false);
            setHistoryItem(null);
            setVersions([]);
          }}
          onRestoreVersion={handleRestoreVersion}
        />
        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setToast((t) => ({ ...t, open: false }))}
            severity={toast.type}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {toast.msg}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}