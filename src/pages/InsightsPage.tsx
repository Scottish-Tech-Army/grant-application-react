import { useMemo } from "react";
import type { CommonField, GrantApplication } from "../types/grants";

interface InsightsPageProps {
  applications: GrantApplication[];
  commonFields: CommonField[];
}

export function InsightsPage({
  applications,
  commonFields,
}: InsightsPageProps) {
  const successfulApps = useMemo(
    () => applications.filter((a) => a.outcomeStatus === "Successful"),
    [applications]
  );
  const unsuccessfulApps = useMemo(
    () => applications.filter((a) => a.outcomeStatus === "Unsuccessful"),
    [applications]
  );

  // ── Field frequency analysis ──
  const fieldUsage = useMemo(() => {
    const fieldMap = new Map<
      string,
      {
        label: string;
        successCount: number;
        unsuccessCount: number;
        totalCount: number;
      }
    >();

    for (const field of commonFields) {
      fieldMap.set(field.id, {
        label: field.label,
        successCount: 0,
        unsuccessCount: 0,
        totalCount: 0,
      });
    }

    for (const app of applications) {
      for (const snap of app.commonFieldSnapshots) {
        const entry = fieldMap.get(snap.fieldId);
        if (!entry) continue;
        entry.totalCount += 1;
        if (app.outcomeStatus === "Successful") entry.successCount += 1;
        if (app.outcomeStatus === "Unsuccessful") entry.unsuccessCount += 1;
      }
    }

    return Array.from(fieldMap.values())
      .filter((f) => f.totalCount > 0)
      .sort((a, b) => b.successCount - a.successCount);
  }, [applications, commonFields]);

  // ── Project / service breakdown ──
  const projectBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { total: number; successful: number; unsuccessful: number; draft: number }
    >();
    for (const app of applications) {
      const key = app.projectOrService || "Unassigned";
      if (!map.has(key))
        map.set(key, { total: 0, successful: 0, unsuccessful: 0, draft: 0 });
      const entry = map.get(key)!;
      entry.total += 1;
      if (app.outcomeStatus === "Successful") entry.successful += 1;
      else if (app.outcomeStatus === "Unsuccessful") entry.unsuccessful += 1;
      else entry.draft += 1;
    }
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [applications]);

  // ── Funder breakdown ──
  const funderBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { total: number; successful: number; unsuccessful: number }
    >();
    for (const app of applications) {
      const key = app.funderName || "Unknown funder";
      if (!map.has(key))
        map.set(key, { total: 0, successful: 0, unsuccessful: 0 });
      const entry = map.get(key)!;
      entry.total += 1;
      if (app.outcomeStatus === "Successful") entry.successful += 1;
      if (app.outcomeStatus === "Unsuccessful") entry.unsuccessful += 1;
    }
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [applications]);

  const totalApps = applications.length;
  const successRate =
    totalApps > 0 ? Math.round((successfulApps.length / totalApps) * 100) : 0;

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <h2>Insights &amp; Analytics</h2>
          <p className="muted">
            Understand what resonates with funders — compare field usage across
            successful and unsuccessful applications.
          </p>
        </div>
      </div>

      {/* ── Top stats ── */}
      <div className="dash-stats">
        <div className="dash-stat dash-stat--blue">
          <span className="dash-stat__number">{totalApps}</span>
          <span className="dash-stat__label">Total</span>
        </div>
        <div className="dash-stat dash-stat--green">
          <span className="dash-stat__number">{successfulApps.length}</span>
          <span className="dash-stat__label">Successful</span>
        </div>
        <div className="dash-stat dash-stat--rose">
          <span className="dash-stat__number">{unsuccessfulApps.length}</span>
          <span className="dash-stat__label">Unsuccessful</span>
        </div>
        <div className="dash-stat dash-stat--slate">
          <span className="dash-stat__number">{successRate}%</span>
          <span className="dash-stat__label">Success Rate</span>
        </div>
      </div>

      {/* ── Funder breakdown ── */}
      <div className="card">
        <h3>By Funder</h3>
        {funderBreakdown.length === 0 ? (
          <p className="muted">
            No funder data yet. Add funder names to applications.
          </p>
        ) : (
          <div className="insights-table-wrap">
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Funder</th>
                  <th>Apps</th>
                  <th>Successful</th>
                  <th>Unsuccessful</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {funderBreakdown.map(([funder, stats]) => (
                  <tr key={funder}>
                    <td>{funder}</td>
                    <td>{stats.total}</td>
                    <td>
                      <span className="status-pill status-pill--successful">
                        {stats.successful}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill status-pill--unsuccessful">
                        {stats.unsuccessful}
                      </span>
                    </td>
                    <td>
                      {stats.total > 0
                        ? `${Math.round(
                            (stats.successful / stats.total) * 100
                          )}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Project/service breakdown ── */}
      <div className="card">
        <h3>By Project / Service</h3>
        {projectBreakdown.length === 0 ? (
          <p className="muted">No project data yet.</p>
        ) : (
          <div className="insights-table-wrap">
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Project / Service</th>
                  <th>Apps</th>
                  <th>Successful</th>
                  <th>Unsuccessful</th>
                  <th>Draft</th>
                </tr>
              </thead>
              <tbody>
                {projectBreakdown.map(([project, stats]) => (
                  <tr key={project}>
                    <td>{project}</td>
                    <td>{stats.total}</td>
                    <td>
                      <span className="status-pill status-pill--successful">
                        {stats.successful}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill status-pill--unsuccessful">
                        {stats.unsuccessful}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill status-pill--draft">
                        {stats.draft}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Common field usage ── */}
      <div className="card">
        <h3>Common Field Usage</h3>
        <p className="muted small" style={{ marginBottom: "0.75rem" }}>
          Which common fields appear most often in successful vs unsuccessful
          applications.
        </p>
        {fieldUsage.length === 0 ? (
          <p className="muted">
            No application data yet. Create applications and set their outcomes.
          </p>
        ) : (
          <div className="insights-table-wrap">
            <table className="insights-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Total Uses</th>
                  <th>In Successful</th>
                  <th>In Unsuccessful</th>
                </tr>
              </thead>
              <tbody>
                {fieldUsage.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.totalCount}</td>
                    <td>
                      <span className="status-pill status-pill--successful">
                        {row.successCount}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill status-pill--unsuccessful">
                        {row.unsuccessCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
