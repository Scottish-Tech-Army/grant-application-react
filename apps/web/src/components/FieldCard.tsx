import React from "react";

export default function FieldCard({
  title,
  subtitle,
  children,
  actions
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          {subtitle && <div className="small">{subtitle}</div>}
        </div>
        <div className="row">{actions}</div>
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}
