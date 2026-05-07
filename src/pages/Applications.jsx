import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, FileText, Pencil, Trash2, Download, Filter, ChevronDown,
} from 'lucide-react'
import { getApplications, deleteApplication } from '../services/api.js'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const STATUS_OPTIONS = [
  { value: '',          label: 'All Statuses' },
  { value: 'draft',     label: 'Draft'        },
  { value: 'submitted', label: 'Submitted'    },
  { value: 'accepted',  label: 'Accepted'     },
  { value: 'rejected',  label: 'Rejected'     },
]

export default function Applications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getApplications()
    setApplications(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    await deleteApplication(deleteTarget.id)
    await load()
  }

  const filtered = applications.filter((a) => {
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.funder_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || a.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">Manage all your grant and funding applications.</p>
        </div>
        <Link to="/applications/new" className="btn-primary">
          <Plus size={16} />
          New Application
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search applications…"
          className="w-72"
        />
        <div className="relative">
          <select
            className="input pl-9 pr-8 w-48 appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        {(search || statusFilter) && (
          <button
            className="btn-ghost text-sm"
            onClick={() => { setSearch(''); setStatusFilter('') }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="card overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 animate-pulse last:border-0">
              <div className="flex-1 h-4 bg-slate-200 rounded" />
              <div className="w-24 h-4 bg-slate-200 rounded" />
              <div className="w-20 h-6 bg-slate-200 rounded-full" />
              <div className="w-20 h-4 bg-slate-200 rounded" />
              <div className="w-24 h-8 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText size={28} />}
            title={search || statusFilter ? 'No applications found' : 'No applications yet'}
            description={
              search || statusFilter
                ? 'Try adjusting your search or filter.'
                : 'Create your first grant application to get started.'
            }
            action={
              !search && !statusFilter && (
                <Link to="/applications/new" className="btn-primary">
                  <Plus size={16} /> Create Application
                </Link>
              )
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_180px_120px_140px_160px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Application</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Funder</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</span>
          </div>

          <div className="divide-y divide-slate-50">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="grid md:grid-cols-[1fr_180px_120px_140px_160px] gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors"
              >
                {/* Title */}
                <div>
                  <p className="font-medium text-slate-900 text-sm leading-snug">{app.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {app.common_field_count > 0 && (
                      <span className="text-xs text-slate-400">
                        {app.common_field_count} common field{app.common_field_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    {app.custom_field_count > 0 && (
                      <span className="text-xs text-slate-400">
                        {app.custom_field_count} custom field{app.custom_field_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Funder */}
                <div className="text-sm text-slate-600 truncate">
                  {app.funder_name || <span className="text-slate-400">—</span>}
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={app.status} />
                </div>

                {/* Date */}
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(app.created_at)}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <Link
                    to={`/applications/${app.id}/export`}
                    className="btn-ghost py-1.5 px-2.5 text-xs"
                    title="Export"
                  >
                    <Download size={14} />
                    Export
                  </Link>
                  <Link
                    to={`/applications/${app.id}/edit`}
                    className="btn-ghost py-1.5 px-2.5 text-xs"
                    title="Edit"
                  >
                    <Pencil size={14} />
                    Edit
                  </Link>
                  <button
                    className="btn-ghost py-1.5 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete"
                    onClick={() => setDeleteTarget(app)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer count */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Showing {filtered.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Application"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
