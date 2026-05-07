import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import type { GrantApplication } from "../data/mockApplications";
import { mockCreateApplicationResponse } from "../data/mockApplications"; // ✅ import your mock

type CILLocationState = {
    application?: GrantApplication;
};

type FreeTextField = {
    id: string;
    value: string;
};

type ApiFieldVersion = {
    value: string;
    timeStamp: string;
};

type ApiPredefinedField = {
    fieldKey: string;
    type: "PREDEFINED";
    currentVersion: number;
    versions: Record<string, ApiFieldVersion>;
};

// ✅ adjust response type to match your mock (fields only)
type PredefinedResponse = {
    userId: string;
    fields: ApiPredefinedField[];
    questions?: ApiPredefinedField[]; // optional (api might send later)
};


// --- helpers ---
function safeSlug(input: string) {
    return input
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function getCurrentVersionData(field: ApiPredefinedField) {
    const key = String(field.currentVersion);
    return field.versions?.[key];
}

export default function CommonInformationLibraryPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const application = (location.state as CILLocationState | null)?.application;

    const [freeFields, setFreeFields] = useState<FreeTextField[]>([]);
    const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

    // ✅ store full response (mock or API)
    const [predefinedData, setPredefinedData] = useState<PredefinedResponse | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const userId = "aaaaaaaa-0001-0001-0001-000000000001";

    useEffect(() => {
        let ignore = false;

        async function loadPredefined() {
            try {
                setPredefinedData(mockCreateApplicationResponse as PredefinedResponse);
            } catch (e: any) {
                // ✅ FALLBACK TO MOCK
                if (ignore) return;

                setPredefinedData(mockCreateApplicationResponse as PredefinedResponse);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        loadPredefined();
        return () => {
            ignore = true;
        };
    }, [userId]);

    function handleAddField() {
        setFreeFields((prev) => [
            ...prev,
            {
                id: `free-${Date.now()}`,
                value: "",
            },
        ]);
    }


    function handleFreeFieldChange(id: string, value: string) {
        setFreeFields((prev) =>
            prev.map((field) =>
                field.id === id ? { ...field, value } : field
            )
        );
    }

    // ✅ Updates the CURRENT VERSION VALUE in memory (frontend only)
    function handlePredefinedValueChange(fieldKey: string, value: string) {
        setPredefinedData((prev) => {
            if (!prev) return prev;

            const updatedFields = prev.fields.map((f) => {
                if (f.fieldKey !== fieldKey) return f;

                const currentVersionKey = String(f.currentVersion);

                return {
                    ...f,
                    versions: {
                        ...f.versions,
                        [currentVersionKey]: {
                            ...f.versions[currentVersionKey],
                            value,
                        },
                    },
                };
            });

            return { ...prev, fields: updatedFields };
        });
    }


    function handleSave() {
        localStorage.setItem(
            "commonInformationLibrary",
            JSON.stringify({ predefinedData, freeFields })
        );
    }

    function handleNext() {
        handleSave();
        navigate("/custom-questions", { state: { application } });
    }

    function renderHistory(field: ApiPredefinedField) {
        const versions = Object.entries(field.versions ?? {}).sort(
            (a, b) => Number(b[0]) - Number(a[0])
        );

        if (versions.length === 0) {
            return <p className="cil__history-item cil__history-item--muted">No versions available.</p>;
        }

        return (
            <>
                {versions.map(([ver, vData]) => (
                    <div key={ver} className="cil__history-item">
                        <div>
                            <strong>Version {ver}</strong>{" "}
                            <span className="cil__history-item--muted">({vData.timeStamp})</span>
                        </div>
                        <div className="cil__history-value">{vData.value}</div>
                    </div>
                ))}
            </>
        );
    }

    return (
        <AppShell
            title={
                application
                    ? `Common Information Library – ${application.applicationName}`
                    : "Common Information Library"
            }
            rightSlot={
                <div className="top-actions">
                    <button className="btn btn--ghost" type="button" title="More options">
                        •••
                    </button>
                    <button className="btn btn--ghost" type="button" onClick={() => navigate("/portal")}>
                        ✕
                    </button>
                </div>
            }
        >
            <div className="modal">
                <div className="modal__body">
                    <h2 className="cil__section-title">Common Information Fields</h2>
                    <hr className="cil__divider" />

                    {loading && <p className="cil__hint">Loading predefined fields…</p>}
                    {error && <p className="cil__error">⚠ {error}</p>}


                    <button
                        className="btn btn--primary cil__add-btn"
                        type="button"
                        onClick={handleAddField}
                    >
                        + Add New Field
                    </button>


                    <div className="cil__field-list">
                        {/* ✅ Predefined text fields from mock/API */}
                        {(predefinedData?.fields ?? []).map((field) => {
                            const id = safeSlug(field.fieldKey);
                            const current = getCurrentVersionData(field);
                            const isOpen = expandedHistory === id;

                            return (
                                <div key={id} className="cil__row cil__row--free">
                                    {/* ✅ fieldKey is the text field name */}
                                    <label className="cil__row-label" htmlFor={id}>
                                        {field.fieldKey}
                                    </label>

                                    {/* ✅ text field value = current version value */}
                                    <input
                                        id={id}
                                        className="cil__free-input"
                                        value={current?.value ?? ""}
                                        onChange={(e) => handlePredefinedValueChange(field.fieldKey, e.target.value)}
                                    />

                                    <button
                                        className="cil__history-toggle"
                                        type="button"
                                        onClick={() => setExpandedHistory((prev) => (prev === id ? null : id))}
                                    >
                                        Version {field.currentVersion} – Updated: {current?.timeStamp ?? "—"} ▾
                                    </button>

                                    {isOpen && <div className="cil__history">{renderHistory(field)}</div>}
                                </div>
                            );
                        })}

                        {/* ✅ Manual free fields remain as-is */}

                        {freeFields.map((field) => (
                            <div key={field.id} className="cil__row cil__row--free">
                                <input
                                    className="cil__free-input"
                                    type="text"
                                    placeholder="Enter value"
                                    value={field.value}
                                    onChange={(e) =>
                                        handleFreeFieldChange(field.id, e.target.value)
                                    }
                                />
                            </div>
                        ))}


                    </div>
                </div>

                <div className="modal__footer cil__footer">
                    <button className="btn btn--outline" type="button" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <div className="cil__footer-actions">
                        <button className="btn btn--primary" type="button" onClick={handleSave}>
                            Save Changes
                        </button>
                        <button className="btn btn--primary" type="button" onClick={handleNext}>
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}