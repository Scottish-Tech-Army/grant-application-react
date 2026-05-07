import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, History, Database, FolderPlus, AlertCircle } from 'lucide-react'
import {
  getFieldGroups,
  getCommonFields,
  getCommonField,
  createCommonField,
  updateCommonField,
  deleteCommonField,
  createFieldGroup,
} from '../services/api.js'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import SearchInput from '../components/ui/SearchInput.jsx'
import VersionHistory from '../components/ui/VersionHistory.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const GROUP_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

// ─── Field Form Modal ─────────────────────────────────────────────────────────
function FieldModal({ isOpen, onClose, onSave, groups, editField }) {
  const [form, setForm] = useState({ label: '', group_id: '', value: '', hint: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setError('')
      setForm(
        editField
          ? {
              label: editField.label,
              group_id: String(editField.group_id || ''),
              value: editField.value || '',
              hint: editField.hint || '',
            }
          : { label: '', group_id: groups[0] ? String(groups[0].id) : '', value: '', hint: '' }
      )
    }
  }, [isOpen, editField, groups])

  const handleSave = async () => {
    if (!form.label.trim()) return
    setSaving(true)
    setError('')
    try {
      await onSave({ ...form, group_id: form.group_id ? Number(form.group_id) : null })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save. Is the backend server running?')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editField ? 'Edit Field' : 'Add Common Field'} size="md">
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="label">Field Name *</label>
          <input
            className="input"
            placeholder="e.g. Mission Statement"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={form.group_id}
            onChange={(e) => setForm((f) => ({ ...f, group_id: e.target.value }))}
          >
            <option value="">— No category —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Answer / Value</label>
          <textarea
            className="textarea"
            rows={5}
            placeholder="Enter the answer or value for this field…"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Hint <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            className="input"
            placeholder="e.g. Keep under 250 words"
            value={form.hint}
            onChange={(e) => setForm((f) => ({ ...f, hint: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || !form.label.trim()}
        >
          {saving ? 'Saving…' : editField ? 'Save Changes' : 'Add Field'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Group Form Modal ─────────────────────────────────────────────────────────
function GroupModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(GROUP_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) { setName(''); setColor(GROUP_COLORS[0]); setError('') }
  }, [isOpen])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try { await onSave({ name, color }); onClose() }
    catch (err) { setError(err.message || 'Failed to create group.') }
    finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Field Group" size="sm">
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="label">Group Name *</label>
          <input
            className="input"
            placeholder="e.g. Organisational Info"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Colour</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {GROUP_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? '#1e40af' : 'transparent',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || !name.trim()}
        >
          {saving ? 'Saving…' : 'Create Group'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommonFields() {
  const [groups, setGroups] = useState([])
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState(null)

  // Modals
  const [fieldModal, setFieldModal] = useState(false)
  const [groupModal, setGroupModal] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [versionField, setVersionField] = useState(null)

  const loadData = useCallback(async () => {
    const [g, f] = await Promise.all([getFieldGroups(), getCommonFields()])
    setGroups(Array.isArray(g) ? g : [])
    setFields(Array.isArray(f) ? f : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openVersionHistory = async (field) => {
    const full = await getCommonField(field.id)
    setVersionField(full)
  }

  const handleSaveField = async (data) => {
    let result
    if (editingField) {
      result = await updateCommonField(editingField.id, data)
    } else {
      result = await createCommonField(data)
    }
    if (result && result.error) throw new Error(result.error)
    setEditingField(null)
    await loadData()
  }

  const handleDeleteField = async () => {
    await deleteCommonField(deleteTarget.id)
    await loadData()
  }

  const handleSaveGroup = async (data) => {
    const result = await createFieldGroup(data)
    if (result && result.error) throw new Error(result.error)
    await loadData()
  }

  // Filter fields
  const filtered = fields.filter((f) => {
    const matchesSearch = !search || f.label.toLowerCase().includes(search.toLowerCase())
    const matchesGroup = selectedGroup === null || f.group_id === selectedGroup
    return matchesSearch && matchesGroup
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Common Fields</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reusable answers shared across all your grant applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => setGroupModal(true)}
          >
            <FolderPlus size={16} />
            New Group
          </button>
          <button
            className="btn-primary"
            onClick={() => { setEditingField(null); setFieldModal(true) }}
          >
            <Plus size={16} />
            Add Field
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Category Filter */}
        <div className="w-52 shrink-0">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categories</span>
            </div>
            <div className="py-1">
              <button
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  selectedGroup === null
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedGroup(null)}
              >
                All Fields
                <span className="float-right text-xs text-slate-400">{fields.length}</span>
              </button>
              {groups.map((g) => {
                const count = fields.filter((f) => f.group_id === g.id).length
                return (
                  <button
                    key={g.id}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                      selectedGroup === g.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedGroup(g.id)}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: g.color || '#6366f1' }}
                    />
                    <span className="flex-1 truncate">{g.name}</span>
                    <span className="text-xs text-slate-400">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Fields List */}
        <div className="flex-1 min-w-0">
          {/* Search Bar */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search fields…"
            className="mb-4 max-w-sm"
          />

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-4 w-48 bg-slate-200 rounded" />
                    <div className="h-5 w-24 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-3 w-full bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Database size={28} />}
              title={search ? 'No fields found' : 'No common fields yet'}
              description={
                search
                  ? `No fields match "${search}". Try a different search.`
                  : 'Add reusable fields to speed up your grant applications.'
              }
              action={
                !search && (
                  <button
                    className="btn-primary"
                    onClick={() => { setEditingField(null); setFieldModal(true) }}
                  >
                    <Plus size={16} /> Add your first field
                  </button>
                )
              }
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((field) => {
                const group = groups.find((g) => g.id === field.group_id)
                return (
                  <div
                    key={field.id}
                    className="card p-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">
                            {field.label}
                          </span>
                          {group && (
                            <span className="badge-category flex items-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: group.color || '#6366f1' }}
                              />
                              {group.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {field.value || <span className="text-slate-400 italic">No value set</span>}
                        </p>
                        {field.hint && (
                          <p className="text-xs text-slate-400 mt-1.5 italic">{field.hint}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          Updated {formatDate(field.updated_at || field.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          className="btn-ghost py-1.5 px-2"
                          title="Version history"
                          onClick={() => openVersionHistory(field)}
                        >
                          <History size={15} />
                        </button>
                        <button
                          className="btn-ghost py-1.5 px-2"
                          title="Edit"
                          onClick={() => { setEditingField(field); setFieldModal(true) }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn-ghost py-1.5 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                          onClick={() => setDeleteTarget(field)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FieldModal
        isOpen={fieldModal}
        onClose={() => { setFieldModal(false); setEditingField(null) }}
        onSave={handleSaveField}
        groups={groups}
        editField={editingField}
      />

      <GroupModal
        isOpen={groupModal}
        onClose={() => setGroupModal(false)}
        onSave={handleSaveGroup}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteField}
        title="Delete Field"
        message={`Are you sure you want to delete "${deleteTarget?.label}"? This will also remove it from any linked applications.`}
        confirmLabel="Delete"
      />

      <Modal
        isOpen={!!versionField}
        onClose={() => setVersionField(null)}
        title={`Version History — ${versionField?.label}`}
        size="md"
      >
        <VersionHistory
          versions={versionField?.versions || []}
          currentValue={versionField?.value}
        />
      </Modal>
    </div>
  )
}
