import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Pencil, Download, FileText, Plus } from 'lucide-react'
import { getApplications } from '../services/api.js'
import SearchInput from '../components/ui/SearchInput.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatRelative(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return formatDate(dateStr)
}

function StatusBadge({ status }) {
  if (status === 'completed') return <span className="badge-completed">Completed</span>
  if (status === 'submitted') return <span className="badge-submitted">Submitted</span>
  return <span className="badge-draft">Draft</span>
}

// Group applications by month/year
function groupByMonth(applications) {
  const groups = {}
  applications.forEach((app) => {
    const date = new Date(app.created_at)
    const key = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(app)
  })
  return groups
}

export default function History() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getApplications()
      .then((data) => setApplications(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Sort newest first
  const sorted = [...applications].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  const filtered = sorted.filter((a) => {
    if (!search) return true
    return (
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.funder_name || '').toLowerCase().includes(search.toLowerCase())
    )
  })

  const grouped = groupByMonth(filtered)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">History</h1>
          <p className="text-sm text-slate-500 mt-1">
            A complete timeline of all your grant applications.
          </p>
        </div>
        <Link to="/applications/new" className="btn-primary">
          <Plus size={16} /> New Application
        </Link>
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search history…"
        className="max-w-sm mb-6"
      />

      {/* Stats bar */}
      {!loading && applications.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total', value: applications.length, color: 'text-slate-900' },
            {
              label: 'Completed',
              value: applications.filter((a) => a.status === 'completed').length,
              color: 'text-emerald-600',
            },
            {
              label: 'Draft',
              value: applications.filter((a) => a.status === 'draft').length,
              color: 'text-amber-600',
            },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 w-48 bg-slate-200 rounded mb-3" />
              <div className="h-3 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Clock size={28} />}
            title={search ? 'No results found' : 'No application history yet'}
            description={
              search
                ? `No applications match "${search}".`
                : 'Your application history will appear here once you create applications.'
            }
            action={
              !search && (
                <Link to="/applications/new" className="btn-primary text-sm">
                  <Plus size={15} /> Create your first application
                </Link>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, apps]) => (
            <div key={month}>
              {/* Month header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {month}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">{apps.length}</span>
              </div>

              {/* Applications for this month */}
              <div className="space-y-2">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className="card p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-slate-500" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">
                            {app.title}
                          </span>
                          <StatusBadge status={app.status} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {app.funder_name && (
                            <span className="text-xs text-slate-500">{app.funder_name}</span>
                          )}
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={11} />
                            <span>{formatRelative(app.created_at)}</span>
                          </div>
                          {(app.common_field_count > 0 || app.custom_field_count > 0) && (
                            <span className="text-xs text-slate-400">
                              {(app.common_field_count || 0) + (app.custom_field_count || 0)} fields
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          to={`/applications/${app.id}/export`}
                          className="btn-ghost py-1.5 px-2.5 text-xs"
                        >
                          <Download size={14} /> Export
                        </Link>
                        <Link
                          to={`/applications/${app.id}/edit`}
                          className="btn-ghost py-1.5 px-2.5 text-xs"
                        >
                          <Pencil size={14} /> Edit
                        </Link>
                      </div>
                    </div>

                    {app.notes && (
                      <div className="mt-3 pl-14 text-xs text-slate-500 italic line-clamp-2">
                        {app.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
