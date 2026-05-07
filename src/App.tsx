import { useCallback, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NavTabs, type TabKey } from "./components/NavTabs";
import { SearchModal } from "./components/SearchModal";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { CommonFieldsPage } from "./pages/CommonFieldsPage";
import { ExportPage } from "./pages/ExportPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InsightsPage } from "./pages/InsightsPage";
import { CharityProfilePage } from "./pages/CharityProfilePage";
import { grantsStore } from "./store/grantsStore";
import type { GrantsData } from "./types/grants";

type AuthView = "login" | "register";

function AppContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>("login");
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [data, setData] = useState<GrantsData | null>(null);
  const [selectedExportApplicationId, setSelectedExportApplicationId] =
    useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const loadData = useCallback(async () => {
    const result = await grantsStore.getData();
    setData(result);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [loadData, isAuthenticated]);

  // Global keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isAuthenticated) {
          setSearchOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated]);

  const openExportForApplication = (applicationId: string) => {
    setSelectedExportApplicationId(applicationId);
    setActiveTab("export");
  };

  const handleSearch = () => {
    setSearchOpen(true);
  };

  const handleSelectApplicationFromSearch = (appId: string) => {
    setSelectedExportApplicationId(appId);
    setActiveTab("applications");
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <main className="app-shell">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    if (authView === "register") {
      return <RegisterPage onSwitchToLogin={() => setAuthView("login")} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView("register")} />;
  }

  // Show loading while fetching data
  if (!data) {
    return (
      <main className="app-shell">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Loading your grant data…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <NavTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onSearch={handleSearch}
      />

      <div className="page-container">
        {activeTab === "dashboard" ? (
          <DashboardPage
            applications={data.applications}
            commonFields={data.commonFields}
            charityName={data.charityProfile?.name}
            onGoToApplications={() => setActiveTab("applications")}
            onGoToCommonFields={() => setActiveTab("common")}
            onCreateApplication={() => setActiveTab("applications")}
          />
        ) : null}

        {activeTab === "common" ? (
          <CommonFieldsPage
            commonFields={data.commonFields}
            onCreate={async (input) => {
              await grantsStore.createCommonField(input);
              await loadData();
            }}
            onUpdate={async (id, input) => {
              await grantsStore.updateCommonField(id, input);
              await loadData();
            }}
            onDelete={async (id) => {
              await grantsStore.deleteCommonField(id);
              await loadData();
            }}
          />
        ) : null}

        {activeTab === "applications" ? (
          <ApplicationsPage
            applications={data.applications}
            commonFields={data.commonFields}
            charityProfile={data.charityProfile}
            onCreateApplication={async (input) => {
              const id = await grantsStore.createApplication(input);
              await loadData();
              return id;
            }}
            onSaveApplication={async (input) => {
              await grantsStore.updateApplicationConfiguration(input);
              await loadData();
            }}
            onOpenExport={openExportForApplication}
          />
        ) : null}

        {activeTab === "export" ? (
          <ExportPage
            applications={data.applications}
            selectedApplicationId={selectedExportApplicationId}
            onChangeSelectedApplicationId={setSelectedExportApplicationId}
            charityProfile={data.charityProfile}
          />
        ) : null}

        {activeTab === "profile" ? (
          <CharityProfilePage
            profile={data.charityProfile}
            onSave={async (input) => {
              await grantsStore.saveCharityProfile(input);
              await loadData();
            }}
          />
        ) : null}

        {activeTab === "insights" ? (
          <InsightsPage
            applications={data.applications}
            commonFields={data.commonFields}
          />
        ) : null}
      </div>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        applications={data.applications}
        commonFields={data.commonFields}
        onSelectApplication={handleSelectApplicationFromSearch}
        onSelectCommonField={() => setActiveTab("common")}
      />
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
