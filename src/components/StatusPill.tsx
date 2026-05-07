type Status = "SUBMITTED" | "DRAFT" | "IN_PROGRESS" | "ARCHIVED" | "Submitted" | "Draft" | "In Progress" | "Archived" | string;

export default function StatusPill({ status }: { status: Status }) {
  // Normalize status to uppercase
  const normalizedStatus = String(status).toUpperCase();
  
  const cls =
    normalizedStatus === "SUBMITTED"
      ? "pill pill--green"
      : normalizedStatus === "DRAFT"
      ? "pill pill--yellow"
      : normalizedStatus === "IN_PROGRESS"
      ? "pill pill--blue"
      : "pill pill--grey";

  // Display status in readable format
  const displayStatus =
    normalizedStatus === "SUBMITTED"
      ? "Submitted"
      : normalizedStatus === "DRAFT"
      ? "Draft"
      : normalizedStatus === "IN_PROGRESS"
      ? "In Progress"
      : "Archived";

  return <span className={cls}>{displayStatus}</span>;
}