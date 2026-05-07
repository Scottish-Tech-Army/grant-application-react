import { useRef, useState } from "react";
import type { MediaAttachment, Id } from "../types/grants";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function createMediaId(): Id {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

interface MediaUploadSectionProps {
  attachments: MediaAttachment[];
  onChange: (attachments: MediaAttachment[]) => void;
}

export function MediaUploadSection({
  attachments: rawAttachments,
  onChange,
}: MediaUploadSectionProps) {
  const attachments = rawAttachments ?? [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editCaptionId, setEditCaptionId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");

  const processFiles = async (files: FileList | File[]) => {
    setError("");
    const newAttachments: MediaAttachment[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(
          `"${file.name}" is not a supported format. Use JPEG, PNG, GIF, WebP, MP4, WebM, or OGG.`
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 50 MB limit.`);
        continue;
      }

      try {
        setUploading(true);
        const dataUrl = await readFileAsDataUrl(file);
        const mediaType: "image" | "video" = ACCEPTED_IMAGE_TYPES.includes(
          file.type
        )
          ? "image"
          : "video";

        newAttachments.push({
          id: createMediaId(),
          name: file.name,
          type: mediaType,
          mimeType: file.type,
          dataUrl,
          size: file.size,
          addedAt: new Date().toISOString(),
          caption: "",
        });
      } catch {
        setError(`Failed to read "${file.name}".`);
      }
    }

    setUploading(false);

    if (newAttachments.length > 0) {
      onChange([...attachments, ...newAttachments]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleRemove = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
    if (previewId === id) setPreviewId(null);
  };

  const handleSaveCaption = (id: string) => {
    onChange(
      attachments.map((a) =>
        a.id === id ? { ...a, caption: captionDraft } : a
      )
    );
    setEditCaptionId(null);
    setCaptionDraft("");
  };

  const startEditCaption = (attachment: MediaAttachment) => {
    setEditCaptionId(attachment.id);
    setCaptionDraft(attachment.caption);
  };

  const previewAttachment = previewId
    ? attachments.find((a) => a.id === previewId)
    : null;

  return (
    <div className="media-upload-section">
      <div className="profile-section-label" style={{ gridColumn: "1 / -1" }}>
        <h3>Mission Media &amp; Feasibility Evidence</h3>
        <p className="muted small">
          Upload images and videos showcasing your charity's missions, impact,
          and project feasibility to strengthen your applications.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`media-dropzone ${dragOver ? "media-dropzone--active" : ""}`}
        style={{ gridColumn: "1 / -1" }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <div className="media-dropzone__icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="media-dropzone__text">
          {uploading
            ? "Processing files…"
            : "Drag & drop images or videos here, or click to browse"}
        </p>
        <p className="media-dropzone__hint">
          Supports JPEG, PNG, GIF, WebP, MP4, WebM, OGG — max 50 MB each
        </p>
      </div>

      {error && (
        <div className="media-error" style={{ gridColumn: "1 / -1" }}>
          {error}
        </div>
      )}

      {/* Gallery */}
      {attachments && attachments.length > 0 && (
        <div className="media-gallery" style={{ gridColumn: "1 / -1" }}>
          {attachments.map((attachment) => (
            <div key={attachment.id} className="media-card">
              <div
                className="media-card__preview"
                onClick={() => setPreviewId(attachment.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setPreviewId(attachment.id);
                }}
              >
                {attachment.type === "image" ? (
                  <img
                    src={attachment.dataUrl}
                    alt={attachment.caption || attachment.name}
                    className="media-card__img"
                  />
                ) : (
                  <video
                    src={attachment.dataUrl}
                    className="media-card__video"
                    muted
                    preload="metadata"
                  />
                )}
                <div className="media-card__type-badge">
                  {attachment.type === "image" ? "IMG" : "VID"}
                </div>
              </div>
              <div className="media-card__info">
                <span className="media-card__name" title={attachment.name}>
                  {attachment.name}
                </span>
                <span className="media-card__size">
                  {formatFileSize(attachment.size)}
                </span>
              </div>

              {editCaptionId === attachment.id ? (
                <div className="media-card__caption-edit">
                  <input
                    type="text"
                    value={captionDraft}
                    onChange={(e) => setCaptionDraft(e.target.value)}
                    placeholder="Add a caption…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveCaption(attachment.id);
                      if (e.key === "Escape") setEditCaptionId(null);
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn-sm btn-primary"
                    onClick={() => handleSaveCaption(attachment.id)}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="media-card__caption">
                  {attachment.caption ? (
                    <span
                      className="caption-text"
                      onClick={() => startEditCaption(attachment)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") startEditCaption(attachment);
                      }}
                    >
                      {attachment.caption}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => startEditCaption(attachment)}
                    >
                      + Add caption
                    </button>
                  )}
                </div>
              )}

              <div className="media-card__actions">
                <button
                  type="button"
                  className="btn-sm btn-danger-outline"
                  onClick={() => handleRemove(attachment.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-screen preview modal */}
      {previewAttachment && (
        <div
          className="media-preview-overlay"
          onClick={() => setPreviewId(null)}
          role="dialog"
          aria-label="Media preview"
        >
          <div
            className="media-preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="media-preview-close"
              onClick={() => setPreviewId(null)}
              aria-label="Close preview"
            >
              ✕
            </button>
            {previewAttachment.type === "image" ? (
              <img
                src={previewAttachment.dataUrl}
                alt={previewAttachment.caption || previewAttachment.name}
                className="media-preview__img"
              />
            ) : (
              <video
                src={previewAttachment.dataUrl}
                controls
                autoPlay
                className="media-preview__video"
              />
            )}
            {previewAttachment.caption && (
              <p className="media-preview__caption">
                {previewAttachment.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
