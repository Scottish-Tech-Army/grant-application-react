import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import type { GrantApplication } from "../data/mockApplications";
import { mockFAQs } from "../data/mockApplications";
import axios from "axios";

type LocationState = {
    application?: GrantApplication;
};

type Question = {
    id: string;
    label: string;
    enabled: boolean;
    answer: string;
};

const defaultQuestions: Question[] = [
    {
        id: "q1",
        label: "What makes your project innovative?",
        enabled: true,
        answer: "Our project introduces new youth mentorship programs.",
    },
    {
        id: "q2",
        label: "Success Measurement?",
        enabled: true,
        answer: "We will track attendance and conduct this project.",
    },
    {
        id: "q3",
        label: "How will funds be used?",
        enabled: false,
        answer: "",
    },
    {
        id: "q4",
        label: "What is the expected impact on the community?",
        enabled: false,
        answer: "",
    },
];

export default function CustomApplicationQuestionsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const application = (location.state as LocationState | null)?.application;

    const [questions, setQuestions] = useState<Question[]>([]);


    useEffect(() => {
        const mappedQuestions = mapMockToQuestions(mockFAQs);
        setQuestions(mappedQuestions);
    }, []);


    function toggleQuestion(id: string) {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, enabled: !q.enabled } : q))
        );
    }

    function updateAnswer(id: string, answer: string) {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, answer } : q))
        );
    }

    function mapMockToQuestions(mock: any[]): Question[] {
        return mock.map((item, index) => {
            const currentKey = String(item.currentVersion);
            const currentValue = item.versions?.[currentKey]?.value ?? "";

            return {
                id: `q${index + 1}`,
                label: item.fieldKey,
                enabled: Boolean(currentValue),
                answer: currentValue,
            };
        });
    }

    async function handleReviewExport() {
  try {
    const response = await axios.get(
      "/api/v1/applications/aaaaaaaa-0001-0001-0001-000000000001/applications/eeeeeeee-a001-a001-a001-000000000001/export/pdf",
      {
        responseType: "blob", // ✅ IMPORTANT for PDF download
      }
    );

    // ✅ Create a downloadable PDF
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "application-export.pdf";
    document.body.appendChild(link);
    link.click();

    // ✅ Cleanup
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export application PDF", error);
  }
}

    return (
        <AppShell
            title="Custom Application Questions"
            rightSlot={
                <div className="top-actions">
                    <button className="btn btn--ghost" type="button" title="More options">•••</button>
                    <button className="btn btn--ghost" type="button" onClick={() => navigate("/portal")}>✕</button>
                </div>
            }
        >
            <div className="modal">
                <div className="modal__body">
                    {application && (
                        <p className="caq__app-name">{application.applicationName}</p>
                    )}
                    <hr className="cil__divider" />

                    <h2 className="cil__section-title">Custom Application Questions</h2>

                    <div className="caq__list">
                        {questions.map((q) => (
                            <div key={q.id} className="caq__item">
                                <label className="caq__question-row">
                                    <input
                                        type="checkbox"
                                        className="caq__checkbox"
                                        checked={q.enabled}
                                        onChange={() => toggleQuestion(q.id)}
                                    />
                                    <span className="caq__question-label">{q.label}</span>
                                </label>
                                {q.enabled && (
                                    <textarea
                                        className="caq__answer"
                                        rows={2}
                                        value={q.answer}
                                        placeholder="Enter your answer..."
                                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal__footer modal__footer--spread">
                    <button className="btn btn--outline" type="button" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <button className="btn btn--primary" type="button" onClick={handleReviewExport}>
                        Review &amp; Export →
                    </button>
                </div>
            </div>
        </AppShell>
    );
}
