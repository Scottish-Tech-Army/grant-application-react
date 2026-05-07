import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

type ApplicationDetails = {
  id: string;
  applicationName: string;
  funder: string;
  status: string;
  lastModified: string;
  amountRequested: string;
};

export default function SampleApiPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<ApplicationDetails[]>([]);

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get<ApplicationDetails[] | ApplicationDetails>(
          "/api/applications"
        );

        const payload = Array.isArray(response.data) ? response.data : [response.data];
        setDetails(payload);
      } catch (err: unknown) {
        const message =
          axios.isAxiosError(err) && err.message ? err.message : "Failed to fetch applications.";
        setError(`Error: ${message}`);
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, []);

  return (
    <AppShell
      title="Sample API Output"
      rightSlot={
        <div className="top-actions">
          <button className="link" type="button" onClick={() => navigate("/portal")}>Back to Portal</button>
        </div>
      }
    >
      <div className="panel sample-api">
        <div className="sample-api__header">
          <h2 className="sample-api__title">Application Details from Spring Boot</h2>
        </div>

        {loading && <p className="muted">Loading application details...</p>}
        {!loading && error && <p className="sample-api__error">{error}</p>}

        {!loading && details.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Application Name</th>
                  <th>Funder</th>
                  <th>Status</th>
                  <th>Last Modified</th>
                  <th>Amount Requested</th>
                </tr>
              </thead>
              <tbody>
                {details.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td className="cell--strong">{item.applicationName}</td>
                    <td>{item.funder}</td>
                    <td>{item.status}</td>
                    <td>{item.lastModified}</td>
                    <td>{item.amountRequested}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}