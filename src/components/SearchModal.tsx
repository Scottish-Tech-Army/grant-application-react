import { useEffect, useMemo, useState } from "react";
import type { CommonField, GrantApplication } from "../types/grants";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: GrantApplication[];
  commonFields: CommonField[];
  onSelectApplication: (id: string) => void;
  onSelectCommonField: () => void;
}

interface SearchResult {
  type: "application" | "field";
  id: string;
  title: string;
  subtitle: string;
  status?: string;
}

export function SearchModal({
  isOpen,
  onClose,
  applications,
  commonFields,
  onSelectApplication,
  onSelectCommonField,
}: SearchModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    
    const q = query.toLowerCase().trim();
    const matches: SearchResult[] = [];

    // Search applications
    applications.forEach((app) => {
      const searchText = `${app.name} ${app.funderName} ${app.notes} ${app.projectOrService}`.toLowerCase();
      if (searchText.includes(q)) {
        matches.push({
          type: "application",
          id: app.id,
          title: app.name,
          subtitle: app.funderName || "No funder specified",
          status: app.outcomeStatus,
        });
      }
    });

    // Search common fields
    commonFields.forEach((field) => {
      const searchText = `${field.label} ${field.value} ${field.group}`.toLowerCase();
      if (searchText.includes(q)) {
        matches.push({
          type: "field",
          id: field.id,
          title: field.label,
          subtitle: field.group || "Ungrouped",
        });
      }
    });

    return matches.slice(0, 10);
  }, [query, applications, commonFields]);

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal__header">
          <div className="search-modal__input-wrapper">
            <svg className="search-modal__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="search"
              className="search-modal__input"
              placeholder="Search applications, common fields..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <kbd className="search-modal__kbd">ESC</kbd>
          </div>
        </div>

        <div className="search-modal__body">
          {!query.trim() ? (
            <div className="search-modal__empty">
              <p className="muted">Start typing to search across all your grant data</p>
              <div className="search-modal__hints">
                <div className="search-hint">
                  <span className="search-hint__icon">📝</span>
                  <span>Search applications by name or funder</span>
                </div>
                <div className="search-hint">
                  <span className="search-hint__icon">📚</span>
                  <span>Find common fields by label or content</span>
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="search-modal__no-results">
              <p>No results found for "{query}"</p>
              <p className="muted small">Try a different search term</p>
            </div>
          ) : (
            <ul className="search-modal__results">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    type="button"
                    className="search-result"
                    onClick={() => {
                      if (result.type === "application") {
                        onSelectApplication(result.id);
                      } else {
                        onSelectCommonField();
                      }
                      onClose();
                    }}
                  >
                    <span className="search-result__icon">
                      {result.type === "application" ? "📝" : "📚"}
                    </span>
                    <div className="search-result__content">
                      <span className="search-result__title">{result.title}</span>
                      <span className="search-result__subtitle">{result.subtitle}</span>
                    </div>
                    {result.status && (
                      <span className={`status-badge status-badge--${result.status.toLowerCase()}`}>
                        {result.status}
                      </span>
                    )}
                    <span className="search-result__type">
                      {result.type === "application" ? "Application" : "Common Field"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="search-modal__footer">
          <span className="muted small">
            <kbd>↵</kbd> to select · <kbd>ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
