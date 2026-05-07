import React from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * Reusable Question + Answer add form with validation
 */
export default function QAAddForm({
  title = "",

  // Labels & placeholders
  questionLabel = "Question",
  answerLabel = "Answer",
  questionPlaceholder = "Type question...",
  answerPlaceholder = "Type answer...",

  // Validation rules
  questionRequired = true,
  answerRequired = false,
  questionMinLength = 3,
  answerMinLength = 0,
  questionMaxLength = 200,
  answerMaxLength = 2000,

  // Advanced validation
  existingQuestions = [], // e.g. Common Info list
  validate, // optional custom validator (q, a) => { question?: string, answer?: string }

  // Add Behaviour
  addButtonEnabled = false,
  addButtonText = "Add",
  dense = false,
  onAdd,

  // Delete behaviour
  deleteButtonEnabled = false,
  onDelete,

  onUpdate,

  // Initial values
  initialQuestion = "",
  initialAnswer = "",
  id,

  readOnly = false
}) {
  const [q, setQ] = React.useState<string>(initialQuestion);
  const [a, setA] = React.useState<string>(initialAnswer);
  const [touched, setTouched] = React.useState(false);

  const qTrim = q.trim();
  const aTrim = a.trim();

  // ---------- Validation ----------
  const errors = React.useMemo(() => {
    const e = {};

    // Question validations
    if (questionRequired && qTrim.length === 0) {
      e.question = "Question is required";
    } else if (qTrim.length < questionMinLength) {
      e.question = `Minimum ${questionMinLength} characters`;
    } else if (qTrim.length > questionMaxLength) {
      e.question = `Maximum ${questionMaxLength} characters`;
    } else if (
      existingQuestions.some(
        (x) => x.toLowerCase() === qTrim.toLowerCase()
      )
    ) {
      e.question = "This question already exists";
    }

    // Answer validations
    if (answerRequired && aTrim.length === 0) {
      e.answer = "Answer is required";
    } else if (aTrim.length < answerMinLength) {
      e.answer = `Minimum ${answerMinLength} characters`;
    } else if (aTrim.length > answerMaxLength) {
      e.answer = `Maximum ${answerMaxLength} characters`;
    }

    // Custom validation hook
    if (validate) {
      const customErrors = validate(qTrim, aTrim);
      Object.assign(e, customErrors);
    }

    return e;
  }, [
    qTrim,
    aTrim,
    questionRequired,
    answerRequired,
    questionMinLength,
    answerMinLength,
    questionMaxLength,
    answerMaxLength,
    existingQuestions,
    validate,
  ]);

  const hasErrors = Object.keys(errors).length > 0;
  const canAdd = !readOnly && !hasErrors;

  const handleAdd = () => {
    setTouched(true);
    if (hasErrors) return;

    onAdd?.({
      question: qTrim,
      answer: aTrim,
    });

    setQ("");
    setA("");
    setTouched(false);
  };

  return (
    <Paper key={id} variant="outlined" sx={{ p: dense ? 1.5 : 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        <Box sx={{ flex: 1 }}>
          <TextField
            label={questionLabel}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => onUpdate(id,"question",q)}
            placeholder={questionPlaceholder}
            fullWidth
            disabled={readOnly}
            error={touched && Boolean(errors.question)}
            helperText={touched ? errors.question || " " : " "}
          />

          <TextField
            label={answerLabel}
            value={a}
            onChange={(e) => setA(e.target.value)}
            onBlur={() => onUpdate(id,"answer",a)}
            placeholder={answerPlaceholder}
            fullWidth
            multiline
            minRows={2}
            disabled={readOnly}
            error={touched && Boolean(errors.answer)}
            helperText={touched ? errors.answer || " " : " "}
          />

          {addButtonEnabled && 
          <Box>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={handleAdd}
              disabled={!canAdd}
            >
              {addButtonText}
            </Button>
          </Box>}
        </Box>

        {deleteButtonEnabled && !readOnly && 
         <Tooltip title="Delete this additional Q&A">
            <IconButton color="error" onClick={() => onDelete(id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        }
      </Stack>
    </Paper>
  );
}