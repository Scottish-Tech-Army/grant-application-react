import type { GrantApplication, MediaAttachment } from "../types/grants";

// ── Build structured HTML for the document preview and Word export ──

export function buildDocumentHtml(
  application: GrantApplication,
  attachedMedia?: MediaAttachment[]
): string {
  const lines: string[] = [];

  lines.push(`<h1>${esc(application.name)}</h1>`);
  lines.push(
    `<p class="doc-meta">Created: ${new Date(
      application.createdAt
    ).toLocaleDateString()} · Last updated: ${new Date(
      application.updatedAt
    ).toLocaleDateString()}</p>`
  );
  lines.push(
    `<p><strong>Outcome status:</strong> ${esc(application.outcomeStatus)}</p>`
  );

  if (application.notes) {
    lines.push(`<h2>Notes</h2>`);
    lines.push(`<p>${esc(application.notes)}</p>`);
  }

  if (application.commonFieldSnapshots.length > 0) {
    lines.push(`<h2>Common Fields</h2>`);
    for (const field of application.commonFieldSnapshots) {
      lines.push(`<h3>${esc(field.label)}</h3>`);
      lines.push(
        `<p class="doc-meta">Version: v${field.version} · Selected: ${new Date(
          field.selectedAt
        ).toLocaleDateString()}</p>`
      );
      lines.push(`<p>${esc(field.value)}</p>`);
    }
  }

  if (application.specificFields.length > 0) {
    lines.push(`<h2>Application-Specific Fields</h2>`);
    for (const field of application.specificFields) {
      lines.push(`<h3>${esc(field.label || "Untitled field")}</h3>`);
      lines.push(`<p>${esc(field.value || "-")}</p>`);
    }
  }

  // Attached media
  if (attachedMedia && attachedMedia.length > 0) {
    lines.push(`<h2>Supporting Media</h2>`);
    for (const media of attachedMedia) {
      if (media.type === "image") {
        lines.push(`<div style="margin-bottom:16px;">`);
        if (media.caption) {
          lines.push(
            `<p style="font-weight:600;margin-bottom:4px;">${esc(
              media.caption
            )}</p>`
          );
        }
        lines.push(
          `<img src="${media.dataUrl}" alt="${esc(
            media.caption || media.name
          )}" style="max-width:100%;border-radius:8px;border:1px solid #ddd;" />`
        );
        lines.push(`<p class="doc-meta">${esc(media.name)}</p>`);
        lines.push(`</div>`);
      } else {
        lines.push(`<div style="margin-bottom:16px;">`);
        if (media.caption) {
          lines.push(
            `<p style="font-weight:600;margin-bottom:4px;">${esc(
              media.caption
            )}</p>`
          );
        }
        lines.push(
          `<video src="${media.dataUrl}" controls style="max-width:100%;border-radius:8px;border:1px solid #ddd;"></video>`
        );
        lines.push(`<p class="doc-meta">${esc(media.name)}</p>`);
        lines.push(`</div>`);
      }
    }
  }

  return lines.join("\n");
}

// ── Plain text export ──

export function buildPlainText(application: GrantApplication): string {
  const lines: string[] = [];

  lines.push(application.name);
  lines.push("=".repeat(application.name.length));
  lines.push("");
  lines.push(`Outcome status: ${application.outcomeStatus}`);
  lines.push("");

  if (application.notes) {
    lines.push("NOTES");
    lines.push("-".repeat(5));
    lines.push(application.notes);
    lines.push("");
  }

  if (application.commonFieldSnapshots.length > 0) {
    lines.push("COMMON FIELDS");
    lines.push("-".repeat(13));
    for (const field of application.commonFieldSnapshots) {
      lines.push("");
      lines.push(`${field.label} (v${field.version})`);
      lines.push(
        `Selected: ${new Date(field.selectedAt).toLocaleDateString()}`
      );
      lines.push("");
      lines.push(field.value);
    }
    lines.push("");
  }

  if (application.specificFields.length > 0) {
    lines.push("APPLICATION-SPECIFIC FIELDS");
    lines.push("-".repeat(27));
    for (const field of application.specificFields) {
      lines.push("");
      lines.push(field.label || "Untitled field");
      lines.push(field.value || "-");
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── Download helpers ──

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAsText(application: GrantApplication) {
  const text = buildPlainText(application);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${safeName(application.name)}.txt`);
}

export function downloadAsWord(
  application: GrantApplication,
  attachedMedia?: MediaAttachment[]
) {
  const html = buildDocumentHtml(application, attachedMedia);

  // Extract base64 images and replace with CID references for Word MHTML
  const images: { cid: string; mimeType: string; base64: string }[] = [];
  let processedHtml = html;

  if (attachedMedia) {
    attachedMedia.forEach((media, idx) => {
      if (media.type === "image" && media.dataUrl) {
        const cid = `image${idx}@grantapp`;
        const match = media.dataUrl.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
          images.push({ cid, mimeType: match[1], base64: match[2] });
          processedHtml = processedHtml.split(media.dataUrl).join(`cid:${cid}`);
        }
      }
    });
  }

  const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${esc(application.name)}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; line-height: 1.6; color: #222; margin: 2cm; }
  h1 { font-size: 22pt; color: #1f4a7f; margin-bottom: 4pt; }
  h2 { font-size: 16pt; color: #1f4a7f; border-bottom: 1px solid #ccc; padding-bottom: 4pt; margin-top: 18pt; }
  h3 { font-size: 13pt; margin-bottom: 2pt; }
  p { margin: 4pt 0 8pt 0; }
  .doc-meta { color: #666; font-size: 10pt; font-style: italic; }
</style>
</head>
<body>
${processedHtml}
</body>
</html>`;

  // If no images, use simple HTML blob
  if (images.length === 0) {
    const blob = new Blob([wordHtml], { type: "application/msword" });
    downloadBlob(blob, `${safeName(application.name)}.doc`);
    return;
  }

  // Build MHTML document so Word can render embedded images
  const boundary = "----=_NextPart_GrantApp";
  const mhtmlParts: string[] = [];

  mhtmlParts.push("MIME-Version: 1.0");
  mhtmlParts.push(`Content-Type: multipart/related; boundary="${boundary}"`);
  mhtmlParts.push("");
  mhtmlParts.push(`--${boundary}`);
  mhtmlParts.push('Content-Type: text/html; charset="utf-8"');
  mhtmlParts.push("Content-Transfer-Encoding: quoted-printable");
  mhtmlParts.push("");
  mhtmlParts.push(wordHtml);

  for (const img of images) {
    mhtmlParts.push("");
    mhtmlParts.push(`--${boundary}`);
    mhtmlParts.push(`Content-Type: ${img.mimeType}`);
    mhtmlParts.push("Content-Transfer-Encoding: base64");
    mhtmlParts.push(`Content-ID: <${img.cid}>`);
    mhtmlParts.push("");
    // Break base64 into 76-char lines per MIME spec
    const b64 = img.base64;
    for (let i = 0; i < b64.length; i += 76) {
      mhtmlParts.push(b64.slice(i, i + 76));
    }
  }

  mhtmlParts.push("");
  mhtmlParts.push(`--${boundary}--`);

  const mhtml = mhtmlParts.join("\r\n");
  const blob = new Blob([mhtml], { type: "application/msword" });
  downloadBlob(blob, `${safeName(application.name)}.doc`);
}

export function printAsPdf(previewElementId: string) {
  const el = document.getElementById(previewElementId);
  if (!el) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Print Application</title>
<style>
  body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; line-height: 1.6; color: #222; margin: 2cm; }
  h1 { font-size: 22pt; color: #1f4a7f; margin-bottom: 4pt; }
  h2 { font-size: 16pt; color: #1f4a7f; border-bottom: 1px solid #ccc; padding-bottom: 4pt; margin-top: 18pt; }
  h3 { font-size: 13pt; margin-bottom: 2pt; }
  p { margin: 4pt 0 8pt 0; }
  .doc-meta { color: #666; font-size: 10pt; font-style: italic; }
  img { max-width: 100%; }
</style>
</head>
<body>
${el.innerHTML}
</body>
</html>`);
  printWindow.document.close();

  // Wait for all images to fully decode/load before printing
  const images = printWindow.document.querySelectorAll("img");
  if (images.length === 0) {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    return;
  }

  let loaded = 0;
  const total = images.length;
  const onImageReady = () => {
    loaded++;
    if (loaded >= total) {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  images.forEach((img) => {
    if (img.complete && img.naturalWidth > 0) {
      onImageReady();
    } else {
      img.addEventListener("load", onImageReady);
      img.addEventListener("error", onImageReady);
    }
  });
}

// ── Utilities ──

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function safeName(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 80) || "application"
  );
}
