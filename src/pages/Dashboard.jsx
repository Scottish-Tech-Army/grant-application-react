import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Edit3, Plus, ArrowRight,
  Clock, TrendingUp, Trophy, XCircle, AlertTriangle, Zap,
} from 'lucide-react'
import { getApplications, getCommonFields, getFieldGroups } from '../services/api.js'
import { analyzePortfolio } from '../services/analyzer.js'
import StatusBadge from '../components/ui/StatusBadge.jsx'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function StatCard({ icon, label, value, color, bg, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bg }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-3xl font-bold text-slate-900 tabular-nums">{value}</span>
      </div>
      <p className="text-sm font-semibold text-slate-700 leading-none">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1 leading-snug">{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
        <div className="w-12 h-8 rounded bg-slate-200" />
      </div>
      <div className="h-4 w-28 rounded bg-slate-200" />
    </div>
  )
}

export default function Dashboard() {
  const [applications, setApplications] = useState([])
  const [commonFields, setCommonFields] = useState([])
  const [fieldGroups, setFieldGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getApplications(), getCommonFields(), getFieldGroups()])
      .then(([apps, fields, groups]) => {
        setApplications(Array.isArray(apps) ? apps : [])
        setCommonFields(Array.isArray(fields) ? fields : [])
        setFieldGroups(Array.isArray(groups) ? groups : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const drafts      = applications.filter((a) => a.status === 'draft').length
  const submitted   = applications.filter((a) => a.status === 'submitted').length
  const accepted    = applications.filter((a) => a.status === 'accepted').length
  const rejected    = applications.filter((a) => a.status === 'rejected').length
  const decided     = accepted + rejected
  const successRate = decided > 0 ? Math.round((accepted / decided) * 100) : null
  const portfolio   = !loading ? analyzePortfolio(applications) : {}
  const recentApps  = applications.slice(0, 5)

  return (
    <div>
      {/* Page Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back — here's your grant portfolio at a glance.
          </p>
        </div>
        <Link to="/applications/new" className="btn-primary">
          <Plus size={16} />
          New Application
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={<FileText size={20} />}     label="Total"     value={applications.length} color="#475569" bg="#f1f5f9" />
            <StatCard icon={<Edit3 size={20} />}        label="In Draft"  value={drafts}              color="#d97706" bg="#fffbeb" />
            <StatCard icon={<TrendingUp size={20} />}   label="Submitted" value={submitted}            color="#7c3aed" bg="#f5f3ff" />
            <StatCard
              icon={<Trophy size={20} />}
              label="Accepted"
              value={accepted}
              color="#11b67a"
              bg="#f0fdf6"
              sub={successRate !== null ? `${successRate}% success rate` : 'No outcomes yet'}
            />
            <StatCard icon={<XCircle size={20} />} label="Rejected" value={rejected} color="#dc2626" bg="#fef2f2" />
          </>
        )}
      </div>

      {/* AI Insights Banner */}
      {!loading && portfolio.needsAttention?.length > 0 && (
        <div className="mb-6 card p-4 border border-amber-200 bg-amber-50/70">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Zap size={15} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 leading-snug">
                {portfolio.needsAttention.length} draft{portfolio.needsAttention.length > 1 ? 's need' : ' needs'} attention
              </p>
              <p className="text-xs text-amber-700 mt-0.5 mb-2">
                These applications haven't been updated recently or are missing key information.
              </p>
              <div className="flex flex-wrap gap-2">
                {portfolio.needsAttention.map((app) => (
                  <Link
                    key={app.id}
                    to={`/applications/${app.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 hover:bg-amber-50 transition-colors"
                  >
                    <AlertTriangle size={10} />
                    {app.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Applications table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="section-title">Recent Applications</h2>
            </div>
            <Link
              to="/applications"
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
            >
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="flex-1 h-4 bg-slate-200 rounded" />
                  <div className="w-20 h-6 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentApps.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <FileText size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600 mb-1">No applications yet</p>
              <p className="text-xs text-slate-400 mb-5">Create your first grant application to get started.</p>
              <Link to="/applications/new" className="btn-primary text-xs">
                <Plus size={13} /> Create Application
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Application</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 hidden sm:table-cell">Created</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-900 text-sm leading-snug truncate max-w-xs">{app.title}</p>
                        {app.funder_name && (
                          <p className="text-xs text-slate-400 mt-0.5">{app.funder_name}</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5"><StatusBadge status={app.status} /></td>
                      <td className="px-3 py-3.5 text-xs text-slate-400 hidden sm:table-cell whitespace-nowrap">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/applications/${app.id}/edit`} className="btn-ghost text-xs py-1.5 px-2.5">Edit</Link>
                          <Link to={`/applications/${app.id}/export`} className="btn-ghost text-xs py-1.5 px-2.5">Export</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Outcomes tracker */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="section-title">Outcomes Tracker</h2>
              <p className="section-subtitle">Record funding decisions as they arrive</p>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-2.5 bg-slate-200 rounded-full" />
                  <div className="h-8 bg-slate-200 rounded-lg" />
                </div>
              ) : decided === 0 ? (
                <div className="text-center py-3">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    No outcomes recorded yet.<br />
                    Mark applications as <strong>Accepted</strong> or <strong>Rejected</strong> as decisions come in.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    {accepted > 0 && (
                      <div className="h-full bg-primary-500 rounded-l-full" style={{ width: `${(accepted / decided) * 100}%` }} />
                    )}
                    {rejected > 0 && (
                      <div className="h-full bg-red-400 rounded-r-full" style={{ width: `${(rejected / decided) * 100}%` }} />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-primary-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary-700 tabular-nums">{accepted}</p>
                      <p className="text-xs font-semibold text-primary-600 mt-0.5">Accepted</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-red-600 tabular-nums">{rejected}</p>
                      <p className="text-xs font-semibold text-red-500 mt-0.5">Rejected</p>
                    </div>
                  </div>
                  {successRate !== null && (
                    <div className="text-center pt-1">
                      <span className="text-sm font-bold text-slate-800">{successRate}%</span>
                      <span className="text-xs text-slate-400 ml-1">success rate ({decided} decided)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Field Groups */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="section-title">Field Groups</h2>
                <p className="section-subtitle">{commonFields.length} reusable fields</p>
              </div>
              <Link
                to="/common-fields"
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
              >
                Manage <ArrowRight size={13} />
              </Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-2 py-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="flex-1 h-3 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : fieldGroups.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-slate-400">No field groups yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {fieldGroups.map((group) => (
                  <div key={group.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.color || '#6366f1' }}
                    />
                    <span className="flex-1 text-sm font-medium text-slate-700 truncate">{group.name}</span>
                    <span className="text-xs text-slate-400 font-semibold tabular-nums">{group.field_count ?? 0}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={11} />
                <span>Reuse answers across all applications</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
