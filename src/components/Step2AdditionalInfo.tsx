import { Box, Paper, Stack, Typography } from "@mui/material";
import QAAddForm from "./QAAddForm";
import type { Key } from "react";

export default function Step2AdditionalInfo({
    additionalItems,
    handleAdditionalItems,
    readOnly = false
    // other props for common info
  }) {

     const updateQA = (id, field, value) => {
        handleAdditionalItems((prev) =>
          prev.map((x) => (x.id === id ? { ...x, [field]: value } : x))
        );
      };
    
      const deleteQA= (id) => {
        handleAdditionalItems((prev) => prev.filter((x) => x.id !== id));
      };

    return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
        Additional Information (application-specific)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add custom questions/answers needed only for this application.
      </Typography>
      {!readOnly && (
      <Stack spacing={1.5} sx={{ mb: 2}}>
        <QAAddForm
            title="Additional Information (application-specific)"
            questionPlaceholder="e.g., Describe project outcomes"
            answerPlaceholder="Type answer..."
            addButtonText="Add additional Q&A"
            addButtonEnabled={true}
            onAdd={({ question, answer }) => {
              handleAdditionalItems((prev: any) => [
                ...prev,
                { id: crypto.randomUUID(), question, answer }
              ]);
            } }
            validate={undefined}
            onDelete={undefined}
            id={undefined} 
            onUpdate={undefined}        
          />
      </Stack> 
      )}
      <Stack spacing={1.5}>
        {additionalItems.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography color="text.secondary">No additional questions added yet.</Typography>
          </Paper>
        ) : (
          additionalItems.map((item: { id: Key | null | undefined; question: string; answer: string; }) => (
            <QAAddForm
                questionPlaceholder="e.g., Describe project outcomes"
                answerPlaceholder="Type answer..."
                validate={undefined}
                initialQuestion={item.question}
                initialAnswer={item.answer} 
                id={item.id}
                addButtonEnabled={false}
                onAdd={undefined}
                deleteButtonEnabled={true}
                onDelete={(id: any) => deleteQA(id)}
                onUpdate={(id: any,question: any,answer: any) => updateQA(id,question,answer)}
                readOnly={readOnly}          
              />
          ))
        )}
      </Stack>
    </Box>
    );
  }