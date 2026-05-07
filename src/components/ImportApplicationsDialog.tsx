import { useState } from "react";

export function ImportApplicationsDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (apps: Array<{ name: string; notes: string }>) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  // Flexible parser for Name|Notes, CSV, and raw text
  function parseApplications(input: string): Array<{ name: string; notes: string }> | string {
    const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return "No input provided.";

    // Try CSV (with or without header)
    if (lines[0].toLowerCase().includes(",")) {
      let startIdx = 0;
      let hasHeader = false;
      const header = lines[0].toLowerCase();
      if (header.includes("name") && header.includes("notes")) {
        hasHeader = true;
        startIdx = 1;
      }
      const csvApps = lines.slice(startIdx).map((line, i) => {
        const [name, ...rest] = line.split(",");
        const notes = rest.join(",");
        if (!name) return null;
        return { name: name.trim(), notes: notes.trim() };
      });
      if (csvApps.some((a) => a === null)) return `CSV line ${csvApps.findIndex((a) => a === null) + 1 + startIdx}: Name required.`;
      return csvApps as Array<{ name: string; notes: string }>;
    }

    // Try Name|Notes (current default)
    if (lines.some((l) => l.includes("|"))) {
      const pipeApps = lines.map((line, i) => {
        const [name, ...rest] = line.split("|");
        const notes = rest.join("|");
        if (!name) return null;
        return { name: name.trim(), notes: notes.trim() };
      });
      if (pipeApps.some((a) => a === null)) return `Line ${pipeApps.findIndex((a) => a === null) + 1}: Name required.`;
      return pipeApps as Array<{ name: string; notes: string }>;
    }

    // Try raw text: look for Application: ... Purpose: ...
    const rawApps: Array<{ name: string; notes: string }> = [];
    let current: { name?: string; notes?: string } = {};
    for (const line of lines) {
      if (/^application[:\-]/i.test(line)) {
        if (current.name) rawApps.push({ name: current.name, notes: current.notes || "" });
        current = { name: line.replace(/^application[:\-]/i, "").trim() };
      } else if (/^purpose[:\-]/i.test(line)) {
        current.notes = line.replace(/^purpose[:\-]/i, "").trim();
      } else if (current.name && line) {
        current.notes = (current.notes ? current.notes + " " : "") + line;
      }
    }
    if (current.name) rawApps.push({ name: current.name, notes: current.notes || "" });
    if (rawApps.length > 0) return rawApps;

    // Fallback: treat each line as a name
    return lines.map((name) => ({ name, notes: "" }));
  }

  const handleImport = () => {
    setError("");
    const result = parseApplications(text);
    if (typeof result === "string") {
      setError(result);
      return;
    }
    onImport(result);
    setText("");
    onClose();
  };

  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Import Applications</h3>
        <p>Paste applications in any of these formats:<br/>
          <code>Name | Notes</code> &nbsp;|&nbsp; <code>Name,Notes</code> (CSV) &nbsp;|&nbsp; <code>Application: ... Purpose: ...</code> (raw text)</p>
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Example:\nSpring Grant 2024 | For youth outreach\nWinter Fund 2023 | Emergency relief"
        />
        {error && <div className="error">{error}</div>}
        <div className="row-actions">
          <button type="button" onClick={handleImport}>Import</button>
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
