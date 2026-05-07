import type { CommonField, GrantApplication } from "../types/grants";

interface DashboardPageProps {
  applications: GrantApplication[];
  commonFields: CommonField[];
  charityName?: string;
  onGoToApplications: () => void;
  onGoToCommonFields: () => void;
  onCreateApplication: () => void;
}

export function DashboardPage({
  applications,
  commonFields,
  charityName,
  onGoToApplications,
  onGoToCommonFields,
  onCreateApplication,
}: DashboardPageProps) {
  const totalApplications = applications.length;
  const submittedCount = applications.filter(
    (app) =>
      app.outcomeStatus === "Successful" || app.outcomeStatus === "Unsuccessful"
  ).length;
  const draftCount = applications.filter(
    (app) => app.outcomeStatus === "Draft"
  ).length;

  const commonFieldsCount = commonFields.length;

  // Calculate reuse statistics - CORE HACKATHON DIFFERENTIATOR
  const totalFieldUsages = applications.reduce(
    (sum, app) => sum + app.commonFieldSnapshots.length,
    0
  );
  const reusePercentage =
    commonFieldsCount > 0 && totalApplications > 0
      ? Math.round(
          (totalFieldUsages / (commonFieldsCount * totalApplications)) * 100
        )
      : 0;

  // Calculate estimated time saved (hackathon impact metric)
  // Assume 5 minutes per field if entered manually, 30 seconds with reuse
  const minutesSaved = totalFieldUsages * 4.5;
  const hoursSaved = Math.round(minutesSaved / 60);

  // Get recent/active applications (sorted by updatedAt)
  const recentApplications = [...applications]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  // Calculate days ago for display
  const getDaysAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  // Calculate coverage for progress bar (based on typical grant questions)
  const coveragePercent = Math.min(
    100,
    Math.round((commonFieldsCount / 25) * 100)
  );

  // Generate smart notifications for UK charities
  const notifications: Array<{
    type: "warning" | "info" | "success";
    message: string;
  }> = [];

  // Check for stale drafts
  const staleApps = applications.filter((app) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(app.updatedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return app.outcomeStatus === "Draft" && days > 7;
  });
  if (staleApps.length > 0) {
    notifications.push({
      type: "warning",
      message: `"${staleApps[0].name}" hasn't been updated for ${Math.floor(
        (new Date().getTime() - new Date(staleApps[0].updatedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )} days`,
    });
  }

  // Check for recently updated common fields affecting applications
  const recentlyUpdatedFields = commonFields.filter((field) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(field.updatedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return days < 7;
  });
  if (recentlyUpdatedFields.length > 0) {
    const affectedApps = applications.filter((app) =>
      app.commonFieldSnapshots.some((snap) =>
        recentlyUpdatedFields.some((f) => f.id === snap.fieldId)
      )
    ).length;
    if (affectedApps > 0) {
      notifications.push({
        type: "info",
        message: `${recentlyUpdatedFields.length} field(s) updated recently – review ${affectedApps} linked application(s)`,
      });
    }
  }

  // Success notification
  if (submittedCount > 0) {
    const successfulCount = applications.filter(
      (app) => app.outcomeStatus === "Successful"
    ).length;
    if (successfulCount > 0) {
      notifications.push({
        type: "success",
        message: `${successfulCount} successful application(s) – well done!`,
      });
    }
  }

  // Empty state - show helpful guidance
  const showGettingStarted = totalApplications === 0 && commonFieldsCount === 0;

  return (
    <section className="dashboard-page">
      {/* Personalized Greeting */}
      <div className="dashboard-greeting-card">
        <div className="dashboard-greeting-card__content">
          <div className="dashboard-greeting-card__text">
            <h1>
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return "Good morning";
                if (hour < 17) return "Good afternoon";
                return "Good evening";
              })()}
              {charityName ? `, ${charityName}` : ""} 👋
            </h1>
            <p>Here's an overview of your grant applications and progress.</p>
          </div>
          {/* <div className="dashboard-greeting-card__stats">
            <div className="greeting-stat">
              <span className="greeting-stat__number">{totalApplications}</span>
              <span className="greeting-stat__label">Applications</span>
            </div>
            <div className="greeting-stat">
              <span className="greeting-stat__number">{commonFieldsCount}</span>
              <span className="greeting-stat__label">Common Fields</span>
            </div>
            <div className="greeting-stat">
              <span className="greeting-stat__number">{totalFieldUsages}</span>
              <span className="greeting-stat__label">Fields Reused</span>
            </div>
          </div> */}
        </div>
      </div>

      {/* Welcome Banner for empty state */}
      {showGettingStarted && (
        <div className="welcome-banner">
          <div className="welcome-banner__icon">🎯</div>
          <div className="welcome-banner__content">
            <h2>Welcome to Grant Application Manager</h2>
            <p>
              Streamline your charity's grant applications. Enter your common
              information once, reuse it across all applications, and never
              retype the same answers again.
            </p>
            <div className="welcome-banner__actions">
              <button type="button" onClick={onGoToCommonFields}>
                Start with Common Information
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={onCreateApplication}
              >
                Create First Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row - demonstrates IMPACT */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__label">Total Applications</div>
          <div className="stat-card__value">{totalApplications}</div>
          <div className="stat-card__sub">
            {draftCount} Active | {submittedCount} Submitted
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Common Information Fields</div>
          <div className="stat-card__value">{commonFieldsCount}</div>
          <div className="stat-card__sub">fields defined</div>
        </div>
        <div className="stat-card stat-card--highlight">
          <div className="stat-card__label">Fields Reused</div>
          <div className="stat-card__value">{reusePercentage}%</div>
          <div className="stat-card__sub">across applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Draft Applications</div>
          <div className="stat-card__value">{draftCount}</div>
          <div className="stat-card__sub">in progress</div>
        </div>
      </div>

      {/* Time Saved Banner - KEY IMPACT METRIC */}
      {hoursSaved > 0 && (
        <div className="time-saved-banner">
          <div className="time-saved-banner__icon">⏱️</div>
          <div className="time-saved-banner__content">
            <strong>Estimated {hoursSaved}+ hours saved</strong>
            <span>
              by reusing {totalFieldUsages} common field entries across your
              applications
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="dashboard-main">
        <div className="dashboard-left">
          {/* Action Buttons */}
          <div className="action-cards">
            <button
              type="button"
              className="action-card"
              onClick={onCreateApplication}
            >
              <div className="action-card__icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className="action-card__text">
                <strong>Create</strong>
                <span>New Application</span>
              </div>
            </button>
            <button
              type="button"
              className="action-card"
              onClick={onGoToCommonFields}
            >
              <div className="action-card__icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <rect x="7" y="7" width="10" height="10" rx="1" />
                </svg>
              </div>
              <div className="action-card__text">
                <strong>Manage</strong>
                <span>Common Information</span>
              </div>
            </button>
            <button
              type="button"
              className="action-card"
              onClick={onGoToApplications}
            >
              <div className="action-card__icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="action-card__text">
                <strong>View</strong>
                <span>Existing Applications</span>
              </div>
            </button>
          </div>

          {/* Recent & Active Applications */}
          <div className="recent-section">
            <h3 className="section-title">Recent &amp; Active Applications</h3>
            {recentApplications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">📋</div>
                <p>No applications yet</p>
                <p className="empty-state__hint">
                  Create your first application to get started
                </p>
                <button type="button" onClick={onCreateApplication}>
                  Create Application
                </button>
              </div>
            ) : (
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Application Name</th>
                    <th>Funder</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={onGoToApplications}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <strong>{app.name}</strong>
                      </td>
                      <td>{app.funderName || "—"}</td>
                      <td>
                        <span
                          className={`status-badge status-badge--${app.outcomeStatus.toLowerCase()}`}
                        >
                          {app.outcomeStatus}
                        </span>
                      </td>
                      <td>{getDaysAgo(app.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="dashboard-right">
          {/* Common Information Coverage */}
          <div className="coverage-card">
            <h4>Common Information Coverage</h4>
            <div className="coverage-progress">
              <div
                className="coverage-progress__fill"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <p className="coverage-text">
              <strong>{commonFieldsCount}</strong> of ~25 typical grant
              questions covered
            </p>
            {coveragePercent < 50 && (
              <button
                type="button"
                className="button-secondary button-sm"
                onClick={onGoToCommonFields}
                style={{ marginTop: "0.75rem" }}
              >
                Add More Fields
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="notifications-card">
            <h4>Notifications</h4>
            <ul className="notifications-list">
              {notifications.length === 0 ? (
                <li className="notification-item notification-item--info">
                  <span className="notification-icon">✓</span>
                  All caught up! No actions needed.
                </li>
              ) : (
                notifications.map((note, idx) => (
                  <li
                    key={idx}
                    className={`notification-item notification-item--${note.type}`}
                  >
                    <span className="notification-icon">
                      {note.type === "warning"
                        ? "⚠️"
                        : note.type === "success"
                        ? "✓"
                        : "ℹ️"}
                    </span>
                    {note.message}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Quick Tips for UK Charities */}
          <div className="tips-card">
            <h4>💡 Quick Tips</h4>
            <ul className="tips-list">
              <li>
                Keep your <strong>Charity Registration Number</strong> and{" "}
                <strong>Safeguarding Policy</strong> up to date
              </li>
              <li>Review common fields before each financial year</li>
              <li>Export applications before submission deadlines</li>
            </ul>
          </div>
        </div>
      </div>

      {/* View Historic Applications Link */}
      <div className="historic-link">
        <button
          type="button"
          className="link-button"
          onClick={onGoToApplications}
        >
          View All Applications →
        </button>
      </div>
    </section>
  );
}
