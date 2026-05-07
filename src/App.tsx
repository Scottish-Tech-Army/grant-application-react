import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import CommonInfo from "./pages/CommonInfo";
import GrantApplications from "./pages/GrantApplications";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/common-information" element={<CommonInfo  />} />
        <Route path="/grant-applications" element={<GrantApplications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}