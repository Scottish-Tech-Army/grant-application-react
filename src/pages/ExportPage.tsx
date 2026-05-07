import { useEffect, useMemo, useState } from "react";
import {
  buildDocumentHtml,
  buildPlainText,
  downloadAsText,
  downloadAsWord,
  printAsPdf,
} from "../store/exportHelpers";
import type {
  CharityProfile,
  GrantApplication,
  MediaAttachment,
} from "../types/grants";

interface ExportPageProps {
  applications: GrantApplication[];
  selectedApplicationId: string;
  onChangeSelectedApplicationId: (applicationId: string) => void;
  charityProfile?: CharityProfile;
}

export function ExportPage({
  applications,
  selectedApplicationId,
  onChangeSelectedApplicationId,
  charityProfile,
}: ExportPageProps) {
  const [copyStatus, setCopyStatus] = useState("");
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<
    "pdf" | "word" | "text" | null
  >(null);

  useEffect(() => {
    if (!selectedApplicationId && applications.length > 0) {
      onChangeSelectedApplicationId(applications[0].id);
    }
  }, [applications, onChangeSelectedApplicationId, selectedApplicationId]);

  const selectedApp = useMemo(
    () => applications.find((a) => a.id === selectedApplicationId) ?? null,
    [applications, selectedApplicationId]
  );

  // Resolve attached media from profile
  const attachedMedia: MediaAttachment[] = useMemo(() => {
    if (!selectedApp || !charityProfile?.mediaAttachments) return [];
    const ids = selectedApp.attachedMediaIds ?? [];
    return charityProfile.mediaAttachments.filter((m) => ids.includes(m.id));
  }, [selectedApp, charityProfile]);

  // Calculate export readiness
  const exportReadiness = useMemo(() => {
    if (!selectedApp) return { score: 0, issues: [] };

    const issues: string[] = [];
    let score = 100;

    if (selectedApp.commonFieldSnapshots.length === 0) {
      issues.push("No common fields linked");
      score -= 30;
    }
    if (!selectedApp.funderName) {
      issues.push("Funder name missing");
      score -= 15;
    }
    if (!selectedApp.projectOrService) {
      issues.push("Project/service description missing");
      score -= 15;
    }
    if (selectedApp.specificFields.length === 0) {
      issues.push("No application-specific fields added");
      score -= 20;
    }

    return { score: Math.max(0, score), issues };
  }, [selectedApp]);

  const documentHtml = useMemo(
    () => (selectedApp ? buildDocumentHtml(selectedApp, attachedMedia) : ""),
    [selectedApp, attachedMedia]
  );

  const plainText = useMemo(
    () => (selectedApp ? buildPlainText(selectedApp) : ""),
    [selectedApp]
  );

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopyStatus(
        "✓ Copied to clipboard – ready to paste into your application form"
      );
      setTimeout(() => setCopyStatus(""), 4000);
    } catch {
      setCopyStatus("Copy failed. Use the text tab to copy manually.");
    }
  };

  const handleExportConfirm = (type: "pdf" | "word" | "text") => {
    setPendingExportType(type);
    setShowExportConfirm(true);
  };

  const handleConfirmDownload = () => {
    if (!selectedApp || !pendingExportType) return;

    if (pendingExportType === "pdf") {
      printAsPdf("doc-preview");
    } else if (pendingExportType === "word") {
      downloadAsWord(selectedApp, attachedMedia);
    } else if (pendingExportType === "text") {
      downloadAsText(selectedApp);
    }

    setShowExportConfirm(false);
    setPendingExportType(null);
  };

  const handleCancelDownload = () => {
    setShowExportConfirm(false);
    setPendingExportType(null);
  };

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <h2>Export Application</h2>
          <p className="muted">
            Preview and export your completed application for copy-paste into
            funder forms.
          </p>
        </div>
      </div>

      <div className="card form-grid">
        <label>
          Select application
          <select
            value={selectedApplicationId}
            onChange={(e) => onChangeSelectedApplicationId(e.target.value)}
          >
            {applications.length === 0 ? (
              <option value="">No applications available</option>
            ) : null}
            {applications.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.outcomeStatus === "Draft" ? "(Draft)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedApp ? (
        <>
          {/* Export Readiness Indicator */}
          <div
            className={`export-readiness ${
              exportReadiness.score >= 80
                ? "export-readiness--good"
                : exportReadiness.score >= 50
                ? "export-readiness--warning"
                : "export-readiness--poor"
            }`}
          >
            <div className="export-readiness__header">
              <span className="export-readiness__label">Export Readiness</span>
              <span className="export-readiness__score">
                {exportReadiness.score}%
              </span>
            </div>
            <div className="export-readiness__bar">
              <div
                className="export-readiness__fill"
                style={{ width: `${exportReadiness.score}%` }}
              />
            </div>
            {exportReadiness.issues.length > 0 && (
              <ul className="export-readiness__issues">
                {exportReadiness.issues.map((issue, idx) => (
                  <li key={idx}>⚠️ {issue}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="card export-toolbar">
            <span className="export-toolbar-label">Export as:</span>
            <button type="button" onClick={() => handleExportConfirm("pdf")}>
              📄 PDF (Print)
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => handleExportConfirm("word")}
            >
              📝 Word (.doc)
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => handleExportConfirm("text")}
            >
              📋 Text (.txt)
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={handleCopyText}
            >
              📎 Copy All to Clipboard
            </button>
          </div>

          {copyStatus && (
            <div className="copy-success-banner">{copyStatus}</div>
          )}

          <div className="export-app-info">
            <div className="dash-stat dash-stat--blue">
              <span className="dash-stat__number">
                {selectedApp.commonFieldSnapshots.length}
              </span>
              <span className="dash-stat__label">Common Fields</span>
            </div>
            <div className="dash-stat dash-stat--green">
              <span className="dash-stat__number">
                {selectedApp.specificFields.length}
              </span>
              <span className="dash-stat__label">Specific Fields</span>
            </div>
            <div className="dash-stat dash-stat--slate">
              <span
                className="dash-stat__number"
                style={{ fontSize: "1.2rem" }}
              >
                {selectedApp.outcomeStatus}
              </span>
              <span className="dash-stat__label">Status</span>
            </div>
            {attachedMedia.length > 0 && (
              <div className="dash-stat dash-stat--green">
                <span className="dash-stat__number">
                  {attachedMedia.length}
                </span>
                <span className="dash-stat__label">Attached Media</span>
              </div>
            )}
          </div>

          <div className="card doc-preview-card">
            <div className="doc-preview-header">
              <h4>📋 Document Preview</h4>
              <p className="muted small">
                This is how your exported application will appear
              </p>
            </div>
            <div
              id="doc-preview"
              className="doc-preview"
              dangerouslySetInnerHTML={{ __html: documentHtml }}
            />
          </div>

          {showExportConfirm && (
            <div className="modal-overlay" onClick={handleCancelDownload}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Confirm Download</h3>
                <p>
                  Download "{selectedApp.name}" as{" "}
                  {pendingExportType?.toUpperCase()}?
                </p>
                {exportReadiness.issues.length > 0 && (
                  <div className="modal-warning">
                    <p>
                      <strong>Note:</strong> This application has{" "}
                      {exportReadiness.issues.length} incomplete item(s)
                    </p>
                  </div>
                )}
                <div className="row-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleCancelDownload}
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={handleConfirmDownload}>
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <p className="muted">Select an application to preview and export.</p>
        </div>
      )}
    </section>
  );
}
