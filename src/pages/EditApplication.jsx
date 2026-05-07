import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  getFieldGroups,
  getCommonFields,
  getApplication,
  updateApplication,
} from '../services/api.js'
import { getSuccessGuidance, getPostDecisionReview } from '../services/analyzer.js'
import ApplicationForm from '../components/forms/ApplicationForm.jsx'
import SuccessGuidancePanel from '../components/ui/SuccessGuidancePanel.jsx'

export default function EditApplication() {
  const { id } = useParams()
  const [application, setApplication] = useState(null)
  const [allFields, setAllFields] = useState([])
  const [allGroups, setAllGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [guidance, setGuidance] = useState(null)
  const [review, setReview] = useState(null)
  const [appStatus, setAppStatus] = useState('draft')

  useEffect(() => {
    Promise.all([getFieldGroups(), getCommonFields(), getApplication(id)])
      .then(([groups, fields, app]) => {
        setAllGroups(Array.isArray(groups) ? groups : [])
        setAllFields(Array.isArray(fields) ? fields : [])
        if (!app || app.error) {
          setNotFound(true)
        } else {
          setApplication(app)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  // Receive live form state and compute guidance or review based on status
  const handleFormChange = useCallback((liveApp) => {
    const status = liveApp.status || 'draft'
    setAppStatus(status)

    if (status === 'accepted' || status === 'rejected') {
      setReview(getPostDecisionReview(liveApp, status))
      setGuidance(null)
    } else {
      setGuidance(getSuccessGuidance(liveApp))
      setReview(null)
    }
  }, [])

  const handleSubmit = async (formData) => {
    const result = await updateApplication(id, {
      title: formData.title,
      funder_name: formData.funder_name,
      status: formData.status,
      notes: formData.notes,
      common_field_ids: formData.common_field_ids,
      custom_fields: formData.custom_fields.map((f, i) => ({
        label: f.label,
        answer: f.answer,
        sort_order: i,
      })),
    })
    if (result.error) throw new Error(result.error)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">Application not found.</p>
        <Link to="/applications" className="btn-secondary">Back to Applications</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/applications" className="btn-ghost text-sm mb-3 -ml-2 inline-flex">
          <ArrowLeft size={15} /> Back to Applications
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Application</h1>
            <p className="text-sm text-slate-500 mt-1 truncate max-w-md">
              {application?.title}
            </p>
          </div>
          <Link
            to={`/applications/${id}/export`}
            className="btn-secondary text-sm"
          >
            Export
          </Link>
        </div>
      </div>

      {/* Two-column layout: Form + AI Guidance/Review Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="card p-6">
          <ApplicationForm
            initialData={application}
            allFields={allFields}
            allGroups={allGroups}
            onSubmit={handleSubmit}
            onFormChange={handleFormChange}
            mode="edit"
          />
        </div>

        {/* Sticky AI Sidebar — switches between coaching and review */}
        <div className="hidden lg:block sticky top-6">
          <SuccessGuidancePanel
            guidance={guidance}
            review={review}
            status={appStatus}
          />
        </div>
      </div>
    </div>
  )
}
