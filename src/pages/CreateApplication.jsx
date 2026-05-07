import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getFieldGroups, getCommonFields, createApplication } from '../services/api.js'
import { getSuccessGuidance } from '../services/analyzer.js'
import ApplicationForm from '../components/forms/ApplicationForm.jsx'
import SuccessGuidancePanel from '../components/ui/SuccessGuidancePanel.jsx'

export default function CreateApplication() {
  const [allFields, setAllFields] = useState([])
  const [allGroups, setAllGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [guidance, setGuidance] = useState(null)

  useEffect(() => {
    Promise.all([getFieldGroups(), getCommonFields()])
      .then(([groups, fields]) => {
        setAllGroups(Array.isArray(groups) ? groups : [])
        setAllFields(Array.isArray(fields) ? fields : [])
      })
      .finally(() => setLoading(false))
  }, [])

  // Receive live form state and compute success guidance
  const handleFormChange = useCallback((liveApp) => {
    const g = getSuccessGuidance(liveApp)
    setGuidance(g)
  }, [])

  const handleSubmit = async (formData) => {
    const result = await createApplication({
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/applications" className="btn-ghost text-sm mb-3 -ml-2 inline-flex">
          <ArrowLeft size={15} /> Back to Applications
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Application</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create a new grant or funding application.
        </p>
      </div>

      {/* Two-column layout: Form + AI Guidance Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="card p-6">
          <ApplicationForm
            allFields={allFields}
            allGroups={allGroups}
            onSubmit={handleSubmit}
            onFormChange={handleFormChange}
            mode="create"
          />
        </div>

        {/* Sticky AI Guidance Sidebar */}
        <div className="hidden lg:block sticky top-6">
          <SuccessGuidancePanel guidance={guidance} />
        </div>
      </div>
    </div>
  )
}
