import { useEffect, useState } from "react";

import type { CharityProfile, MediaAttachment } from "../types/grants";
import { MediaUploadSection } from "../components/MediaUploadSection";

export function CharityProfilePage({
  profile,
  onSave,
  onAfterSave,
}: {
  profile?: CharityProfile;
  onSave: (
    profile: Omit<CharityProfile, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    }
  ) => void | Promise<void>;
  onAfterSave?: () => void;
}) {
  const [form, setForm] = useState<
    Omit<CharityProfile, "id" | "createdAt" | "updatedAt">
  >({
    name: "",
    mission: "",
    registrationNumber: "",
    address: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    mediaAttachments: [],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profile) {
      const { id, createdAt, updatedAt, ...rest } = profile;
      setForm({ ...rest, mediaAttachments: rest.mediaAttachments ?? [] });
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleMediaChange = (mediaAttachments: MediaAttachment[]) => {
    setForm((f) => ({ ...f, mediaAttachments }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await onSave({ ...form, id: profile?.id });
      setMessage("Profile saved!");
      if (onAfterSave) onAfterSave();
    } catch {
      setMessage("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <h2>Charity Profile</h2>
          <p className="muted">
            Store your organisation details once and reuse them across grant
            applications.
          </p>
        </div>
      </div>

      <form className="card form-grid profile-form" onSubmit={handleSubmit}>
        <div className="profile-section-label" style={{ gridColumn: "1 / -1" }}>
          <h3>Organisation Details</h3>
          <p className="muted small">Basic information about your charity.</p>
        </div>
        <label>
          Charity Name
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your organisation name"
            required
          />
        </label>
        <label>
          Registration Number
          <input
            name="registrationNumber"
            value={form.registrationNumber}
            onChange={handleChange}
            placeholder="e.g. 1234567"
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Mission Statement
          <textarea
            name="mission"
            value={form.mission}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your charity's mission and purpose"
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Address
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Full postal address"
          />
        </label>

        <div
          className="profile-section-label"
          style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}
        >
          <h3>Contact Information</h3>
          <p className="muted small">Primary contact for grant applications.</p>
        </div>
        <label>
          Contact Name
          <input
            name="contactName"
            value={form.contactName}
            onChange={handleChange}
            placeholder="Full name"
          />
        </label>
        <label>
          Contact Email
          <input
            name="contactEmail"
            value={form.contactEmail}
            onChange={handleChange}
            type="email"
            placeholder="email@example.org"
          />
        </label>
        <label>
          Contact Phone
          <input
            name="contactPhone"
            value={form.contactPhone}
            onChange={handleChange}
            placeholder="+44 ..."
          />
        </label>
        <label>
          Website
          <input
            name="website"
            value={form.website}
            onChange={handleChange}
            type="url"
            placeholder="https://..."
          />
        </label>
        <div className="row-actions" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Profile"}
          </button>
          {message && <span className="save-message">{message}</span>}
        </div>
      </form>

      <div
        className="card form-grid profile-form"
        style={{ marginTop: "1.5rem" }}
      >
        <MediaUploadSection
          attachments={form.mediaAttachments}
          onChange={handleMediaChange}
        />
        <div className="row-actions" style={{ gridColumn: "1 / -1" }}>
          <button type="button" disabled={saving} onClick={handleSubmit}>
            {saving ? "Saving…" : "Save Profile & Media"}
          </button>
          {message && <span className="save-message">{message}</span>}
        </div>
      </div>
    </section>
  );
}
