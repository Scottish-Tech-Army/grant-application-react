import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { useAuth } from './contexts/AuthContext.jsx'
import Layout from './components/layout/Layout.jsx'

const LoginPage         = lazy(() => import('./pages/LoginPage.jsx'))
const Dashboard         = lazy(() => import('./pages/Dashboard.jsx'))
const CommonFields      = lazy(() => import('./pages/CommonFields.jsx'))
const Applications      = lazy(() => import('./pages/Applications.jsx'))
const CreateApplication = lazy(() => import('./pages/CreateApplication.jsx'))
const EditApplication   = lazy(() => import('./pages/EditApplication.jsx'))
const ExportApplication = lazy(() => import('./pages/ExportApplication.jsx'))
const History           = lazy(() => import('./pages/History.jsx'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — login */}
        <Route path="/login" element={
          <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>
        } />

        {/* Protected — main app */}
        <Route path="/" element={
          <ProtectedRoute><Layout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <Suspense fallback={<PageLoader />}><Dashboard /></Suspense>
          } />
          <Route path="common-fields" element={
            <Suspense fallback={<PageLoader />}><CommonFields /></Suspense>
          } />
          <Route path="applications" element={
            <Suspense fallback={<PageLoader />}><Applications /></Suspense>
          } />
          <Route path="applications/new" element={
            <Suspense fallback={<PageLoader />}><CreateApplication /></Suspense>
          } />
          <Route path="applications/:id/edit" element={
            <Suspense fallback={<PageLoader />}><EditApplication /></Suspense>
          } />
          <Route path="applications/:id/export" element={
            <Suspense fallback={<PageLoader />}><ExportApplication /></Suspense>
          } />
          <Route path="history" element={
            <Suspense fallback={<PageLoader />}><History /></Suspense>
          } />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
