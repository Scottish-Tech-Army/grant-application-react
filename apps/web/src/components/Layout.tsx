import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function Layout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>
            <Link to="/">GrantKit</Link>
          </h2>
          <div className="small">Grant Application Information Manager</div>
        </div>
        <span className="badge">Local Mock Storage</span>
      </div>

      <div className="nav">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/common">Common Library</NavLink>
        <NavLink to="/applications">Applications</NavLink>
        <NavLink to="/backup">Backup & Restore</NavLink>
      </div>

      {children}
    </div>
  );
}
