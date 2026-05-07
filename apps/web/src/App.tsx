import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CommonLibrary from "./pages/CommonLibrary";
import ApplicationList from "./pages/ApplicationList";
import ApplicationEditor from "./pages/ApplicationEditor";
import BackupRestore from "./pages/BackupRestore";

export default function App(): JSX.Element {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/common" element={<CommonLibrary />} />
        <Route path="/applications" element={<ApplicationList />} />
        <Route path="/applications/:id" element={<ApplicationEditor />} />
        <Route path="/backup" element={<BackupRestore />} />
      </Routes>
    </Layout>
  );
}
