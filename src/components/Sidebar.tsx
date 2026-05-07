import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/common-information", label: "Common Information" },
  { to: "/grant-applications", label: "Grant Applications" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandLogo">G</div>
        <div className="brandText">
          <div className="brandTitle">Grant Manager</div>
          <div className="brandSub">Information Hub</div>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebarFooter">
        <small>© {new Date().getFullYear()}</small>
      </div>
    </aside>
  );
}