import { useState } from "react";
import { useAuth } from "../context/AuthContext";

type TabKey =
  | "dashboard"
  | "common"
  | "applications"
  | "profile"
  | "insights"
  | "export";

interface NavTabsProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onSearch?: (query: string) => void;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "dashboard", label: "Home" },
  { key: "common", label: "Common Information Library" },
  { key: "applications", label: "Applications" },
  { key: "profile", label: "Charity Profile" },
  { key: "export", label: "Exports" },
];

export function NavTabs({ activeTab, onChangeTab, onSearch }: NavTabsProps) {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="app-navbar">
      <div className="app-navbar__brand">
        Grant Application Information Manager
      </div>
      <nav className="app-navbar__tabs" aria-label="Primary">
        {tabs.map((tab) => {
          const selected = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              className={`navbar-tab ${selected ? "navbar-tab--active" : ""}`}
              onClick={() => onChangeTab(tab.key)}
              aria-current={selected ? "page" : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
      <div className="app-navbar__actions">
        {/* Search */}
        <div className="navbar-search-container">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="navbar-search-form">
              <input
                type="search"
                className="navbar-search-input"
                placeholder="Search applications, fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
              <button
                type="submit"
                className="navbar-search-submit"
                aria-label="Search"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
              <button
                type="button"
                className="navbar-search-close"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                aria-label="Close search"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="navbar-icon-btn"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="navbar-profile-container">
          <button
            type="button"
            className="navbar-icon-btn"
            aria-label="Profile menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </button>

          {profileOpen && (
            <>
              <div
                className="navbar-dropdown-backdrop"
                onClick={() => setProfileOpen(false)}
              />
              <div className="navbar-dropdown">
                <div className="navbar-dropdown__header">
                  <div className="navbar-dropdown__avatar">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  </div>
                  <div className="navbar-dropdown__info">
                    <strong>{user?.charityName || "My Charity"}</strong>
                    <span className="muted small">
                      {user?.email || "Charity Administrator"}
                    </span>
                  </div>
                </div>
                <div className="navbar-dropdown__divider" />
                <ul className="navbar-dropdown__menu">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onChangeTab("profile");
                      }}
                    >
                      <span>👤</span> Account Settings
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onChangeTab("profile");
                      }}
                    >
                      <span>🏢</span> Charity Profile
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onChangeTab("insights");
                      }}
                    >
                      <span>📊</span> Usage & Statistics
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onChangeTab("dashboard");
                      }}
                    >
                      <span>❓</span> Help & Support
                    </button>
                  </li>
                </ul>
                <div className="navbar-dropdown__divider" />
                <div className="navbar-dropdown__footer">
                  <button
                    type="button"
                    className="navbar-dropdown__logout"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export type { TabKey };
