import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import TextField from "../components/TextField";
import SelectField from "../components/SelectField";

export default function CreateApplicationPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("Youth Empowerment Grant");
  const [org, setOrg] = useState("National Charity Fund");
  const [deadline, setDeadline] = useState("2024-05-15");

  const funders = useMemo(
    () => [
      { label: "National Charity Fund", value: "National Charity Fund" },
      { label: "HealthCare Foundation", value: "HealthCare Foundation" },
      { label: "Cultural Arts Council", value: "Cultural Arts Council" },
      { label: "City Welfare Trust", value: "City Welfare Trust" },
      { label: "Green Future Foundation", value: "Green Future Foundation" },
      { label: "Aging Well Foundation", value: "Aging Well Foundation" },
    ],
    []
  );

  function handleCreate() {
    // demo-only: store last created payload
    localStorage.setItem(
      "lastCreatedApplication",
      JSON.stringify({ name, funder: org, deadline })
    );
    navigate("/portal");
  }

  return (
    <AppShell
      title="Create New Application"
      rightSlot={
        <button className="btn btn--ghost" type="button" onClick={() => navigate("/portal")}>
          ✕
        </button>
      }
    >
      <div className="modal">
        <div className="modal__body">
          <TextField label="Application Name" value={name} onChange={setName} />
          <SelectField label="Funding Organization" value={org} onChange={setOrg} options={funders} />
          <div className="field">
            <label className="field__label">Application Deadline</label>
            <input
              className="field__input"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {/* <button className="btn btn--primary btn--center" type="button" onClick={handleCreate}>
            Create Application
          </button> */}
        </div>

        <div className="modal__footer modal__footer--spread">
          <button className="btn btn--outline" type="button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button className="btn btn--primary" type="button" onClick={() => navigate("/common-library")}>
            Next →
          </button>
        </div>
      </div>
    </AppShell>
  );
}
