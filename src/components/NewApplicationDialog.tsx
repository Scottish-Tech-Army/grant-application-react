import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  LinearProgress
} from "@mui/material";

import Step1CommonInfo from "./Step1CommonInfo";
import Step2AdditionalInfo from "./Step2AdditionalInfo";
import Step3Preview from "./Step3Preview";
import Step4Export from "./Step4Export";

import StepButton from "@mui/material/StepButton";
import { fetchCommonQuestions } from "../api/commonInformationApi";
import { createOrUpdateApplication } from "../api/grandApplicationApi";

const steps = [
  "Common information",
  "Additional information",
  "Preview",
  "Submit & Export",
];

export interface intialCommonInfo {
  id: number;
  question: string;
  answer: string;
}

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export default function NewApplicationDialog({
  open,
  mode = "create", 
  application = null,
  onClose,
  onSave,
}) {

  const [activeStep, setActiveStep] = React.useState(0);
  const progress = Math.round((activeStep / (steps.length - 1)) * 100);
  const [applicationName, setApplicationName] = React.useState("");
  const [funderName, setFunderName] = React.useState("");
  const canGoNext = activeStep < steps.length - 1;
  const canGoBack = activeStep > 0;
  const [completed, setCompleted] = React.useState({});
  const [maxVisitedStep, setMaxVisitedStep] = React.useState(0);
  const readOnly = mode === "view";
  
  const [commonLoading, setCommonLoading] = React.useState(false);
  const [commonLoadError, setCommonLoadError] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  
  React.useEffect(() => {
    if (!open) return;
  
    let mounted = true;
  
    const init = async () => {
      try {
        setCommonLoading(true);
        setCommonLoadError(null);
  
        // Reset stepper state
        setActiveStep(0);
        setMaxVisitedStep(0);
        setCompleted({});
        //setNameError(false);
  
        // Existing app (edit/view) – keep your current logic
        if (application) {
          setApplicationName(application.applicationName ?? "");
          setFunderName(application.funderName ?? "");
          setCommonItems(application.commonItems ?? []);
          setAdditionalItems(application.additionalItems ?? []);
          return;
        }
  
        // ✅ New application – fetch common questions from API
        const tenantId = "0eadf87c-fe41-4a62-bb79-3eebdd37be70";
  
        // Keep pageSize high enough for now; later we can iterate totalPages if needed.
        const data = await fetchCommonQuestions({
          tenantId,
          pageNumber: 1,
          pageSize: -1,
        });
  
        if (!mounted) return;
  
        const apiQuestions = data.questions ?? [];
  
        // ✅ map API → Step 1 commonItems (selected by default)
        const mapped = apiQuestions
          .filter((q) => q.isActive !== false)
          .map((q) => ({
            id: q.id,
            question: q.question,
            answer: q.answer ?? "",
            selected: true,                 // ✅ selected by default
            currentVersion: q.currentVersion,
            isActive: q.isActive,
          }));
  
        setCommonItems(mapped);
        setAdditionalItems([]);
        setApplicationName("");
        setFunderName("");
      } catch (err) {
        console.error(err);
        if (mounted) setCommonLoadError("Failed to load common questions");
        // still allow dialog to open with empty common set
        if (mounted) setCommonItems([]);
      } finally {
        if (mounted) setCommonLoading(false);
      }
    };
  
    init();
  
    return () => {
      mounted = false;
    };
  }, [open, application]);

  // Step1: Common Information
  const [commonItems, setCommonItems] = React.useState([]);
  
  const handleApplicationNameCommit = (value: React.SetStateAction<string>) => {
    setApplicationName(value);
  };

  const handleFunderNameCommit = (value: React.SetStateAction<string>) => {
    setFunderName(value);
  };

  const appNameValid = applicationName.trim().length > 0;
  const disableNext = !appNameValid;
  
  // Step2: Additional Q&A
  const [additionalItems, setAdditionalItems] = React.useState([]);

   // Step3: preview
   const allItems = React.useMemo(
    () => [
      ...commonItems.filter((x) => x.selected === true).map((x) => ({ ...x, section: "Common" })),
      ...additionalItems.map((x) => ({ ...x, section: "Additional" })),
    ],
    [commonItems, additionalItems]
  );

  const buildSubmitPayload = () => {
    const qaDetails = [];
  
    // ✅ Common questions (only selected)
    commonItems
      .filter((q) => q.selected !== false)
      .forEach((q) => {
        qaDetails.push({
          questionId: q.id,
          question: q.question,
          answer: q.answer ?? "",
          section: "Common",
          checked: true,
        });
      });
  
    // ✅ Additional questions
    additionalItems.forEach((q) => {
      qaDetails.push({
        questionId: q.id,
        question: q.question,
        answer: q.answer ?? "",
        section: "Additional",
      });
    });
  
    return {
      applicationId: application?.id ?? crypto.randomUUID(),
      userId: "user123",          // 🔁 replace with auth context later
      tenantId: "987e6543-e21b-12d3-a456-426614174999",
      applicationName: applicationName.trim(),
      funderName: funderName.trim(),
      status: "SUBMITTED",
      applicationQADetails: qaDetails,
    };
  };

  const handleSubmit = async () => {
    if (!applicationName.trim()) {
      //setNameError(true);
      setActiveStep(0);
      return;
    }
  
    try {
      setSubmitting(true);
  
      const payload = buildSubmitPayload();
      await createOrUpdateApplication(payload);
  
      // ✅ Close dialog & refresh dashboard/list
      onClose();
      onSave?.({
        ...payload,
        status: "SUBMITTED",
        updatedAt: new Date().toISOString(),
        updatedBy: payload.userId,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- handlers ----------
  
  const handleNext = () => {
    // your validation for step 0 etc stays same
    // mark completed if needed
    setCompleted((prev) => ({ ...prev, [activeStep]: true }));
    goToStep(activeStep + 1);

    if(activeStep == 2){
      //API call to submit
    }
  };
  
  const handleBack = () => {
    goToStep(activeStep - 1);
  };

  const handleSave = () => {
    const now = new Date().toISOString();

    const updated = {
      ...(application ?? {}),
      id: application?.id ?? uid(),
      applicationName: applicationName.trim(),
      funderName: funderName.trim(),
      status: application?.status ?? "Drafted",
      updatedAt: now,
      updatedBy: "current.user@org.com",
      commonItems,
      additionalItems,
    };

    onSave?.(updated);
    onClose();
  }

  // Optional: "Finish" action
  const handleFinish = () => {
    onClose();
  };


  // ---------- UI Step Contents ----------
  const Step1Common = () => (
    <Step1CommonInfo
      applicationName={applicationName}
      onApplicationNameCommit={handleApplicationNameCommit}
      commonItems={commonItems}
      handleCommonItem={setCommonItems} 
      funderName={funderName} 
      onFunderNameCommit={handleFunderNameCommit}
      readOnly={readOnly} 
      />
  );

  const Step2Additional = () => (
    <Step2AdditionalInfo
      additionalItems={additionalItems}
      handleAdditionalItems={setAdditionalItems}
      readOnly={readOnly} 
    />
  );

  const Step3PreviewData = () => (
    <Step3Preview
      applicationName={applicationName}
      funderName={funderName}
      allItems={allItems}
    />
  );

  const Step4ExportData = () => (
    <Step4Export
      applicationName={applicationName}
      funderName={funderName}
      commonItems={commonItems}
      additionalItems={additionalItems}
    />
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: return <Step1Common />;
      case 1: return <Step2Additional />;
      case 2: return <Step3PreviewData />;
      case 3: return <Step4ExportData />;
      default: return null;
    }
  };

  React.useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setMaxVisitedStep(0);
    setCompleted({});
    // also reset other state as you already do
  }, [open]);

  const goToStep = (step: number) => {
    setActiveStep(step);
    setMaxVisitedStep((prev) => Math.max(prev, step));
  };

  const handleStepClick = (targetStep: number) => {
    // ✅ Block future steps
    if (targetStep > maxVisitedStep) return;
  
    // allow visiting already visited steps
    goToStep(targetStep);
  };

  const handleSaveButton = () => {
    if(activeStep == 0 || activeStep == 1){
      if(!readOnly){
        return "Save";
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900 }}>
        {mode === "create" ? "Create New Application" : mode === "edit" ? "Edit Application" : "View Application"}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          {commonLoading && <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 2, mb: 2 }} />}
          <Stepper nonLinear activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label} completed={completed[index] === true}>
                <StepButton
                  onClick={() => handleStepClick(index)}
                  disabled={index > maxVisitedStep}   // ✅ future steps disabled
                >
                  {label}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step body */}
        {renderStepContent()}
      </DialogContent>

      {/* Bottom navigation: Previous / Next */}
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button onClick={handleBack} disabled={!canGoBack} variant="text">
        Previous
        </Button>

        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        )}
 
        {handleSaveButton() && 
        (<Button onClick={handleSave} variant="outlined">
            Save
        </Button>)}
        
      </DialogActions>
    </Dialog>
  );
}