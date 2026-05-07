import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import PortalPage from "../pages/PortalPage";
import CreateApplicationPage from "../pages/CreateApplicationPage";
import CommonInformationLibraryPage from "../pages/CommonInformationLibraryPage";
import SampleApiPage from "../pages/SampleApiPage";
import CustomApplicationQuestionsPage from "../pages/CustomApplicationQuestionsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/portal" element={<PortalPage />} />
      <Route path="/common-library" element={<CommonInformationLibraryPage />} />
      <Route path="/applications/new" element={<CreateApplicationPage />} />
      <Route path="/custom-questions" element={<CustomApplicationQuestionsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
