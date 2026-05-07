import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Search, Check, AlertCircle,
} from 'lucide-react'
import WritingAssistant from '../ui/WritingAssistant.jsx'

const STATUSES = [
  { value: 'draft',     label: 'Draft'     },
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted',  label: 'Accepted'  },
  { value: 'rejected',  label: 'Rejected'  },
]

// ─── Common Field Selector ────────────────────────────────────────────────────
function CommonFieldSelector({ allFields, allGroups, selectedIds, onChange }) {
  const [search, setSearch] = useState('')
  const [openGroup, setOpenGroup] = useState(null)

  const toggle = (id) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    )
  }

  const filtered = allFields.filter(
    (f) => !search || f.label.toLowerCase().includes(search.toLowerCase())
  )

  // Group fields
  const grouped = allGroups.map((g) => ({
    ...g,
    fields: filtered.filter((f) => f.group_id === g.id),
  })).filter((g) => g.fields.length > 0)

  const ungrouped = filtered.filter((f) => !f.group_id)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-slate-100 bg-slate-50">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-8 text-xs py-1.5"
            placeholder="Search fields…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <Check size={12} className="text-primary-600" />
            <span className="text-xs text-primary-600 font-medium">
              {selectedIds.length} field{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>
        )}
      </div>

      {/* Fields list */}
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
        {grouped.map((group) => (
          <div key={group.id}>
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
              onClick={() => setOpenGroup(openGroup === group.id ? null : group.id)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: group.color || '#6366f1' }}
                />
                <span className="text-xs font-semibold text-slate-600">{group.name}</span>
                <span className="text-xs text-slate-400">
                  ({group.fields.filter((f) => selectedIds.includes(f.id)).length}/{group.fields.length})
                </span>
              </div>
              {openGroup === group.id ? (
                <ChevronUp size={14} className="text-slate-400" />
              ) : (
                <ChevronDown size={14} className="text-slate-400" />
              )}
            </button>

            {(openGroup === group.id || search) &&
              group.fields.map((f) => (
                <FieldCheckbox
                  key={f.id}
                  field={f}
                  checked={selectedIds.includes(f.id)}
                  onToggle={() => toggle(f.id)}
                />
              ))}
          </div>
        ))}

        {ungrouped.map((f) => (
          <FieldCheckbox
            key={f.id}
            field={f}
            checked={selectedIds.includes(f.id)}
            onToggle={() => toggle(f.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            No fields found.
          </div>
        )}
      </div>
    </div>
  )
}

function FieldCheckbox({ field, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
        checked ? 'bg-primary-50/50' : ''
      }`}
    >
      <div
        className={`mt-0.5 w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-all ${
          checked
            ? 'border-primary-600 bg-primary-600'
            : 'border-slate-300 bg-white'
        }`}
      >
        {checked && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 leading-snug">{field.label}</p>
        {field.value && (
          <p className="text-xs text-slate-500 truncate mt-0.5 max-w-xs">{field.value}</p>
        )}
      </div>
    </button>
  )
}

// ─── Custom Fields Section (with AI Writing Assistant) ───────────────────────
function CustomFieldsSection({ customFields, onChange }) {
  const addField = () =>
    onChange([...customFields, { id: Date.now(), label: '', answer: '' }])

  const updateField = (index, key, val) => {
    const updated = [...customFields]
    updated[index] = { ...updated[index], [key]: val }
    onChange(updated)
  }

  const removeField = (index) =>
    onChange(customFields.filter((_, i) => i !== index))

  const handleInsertTemplate = (index, template) => {
    const field = customFields[index]
    // If the field answer is empty, insert the template; otherwise append
    const newAnswer = field.answer ? field.answer + '\n\n' + template : template
    updateField(index, 'answer', newAnswer)
  }

  return (
    <div>
      <div className="space-y-4">
        {customFields.map((f, i) => (
          <div key={f.id || i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <div>
                  <label className="label text-xs">Question / Label</label>
                  <input
                    className="input text-sm"
                    placeholder="e.g. How will you measure success?"
                    value={f.label}
                    onChange={(e) => updateField(i, 'label', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs">Answer</label>
                  <textarea
                    className="textarea text-sm"
                    rows={3}
                    placeholder="Enter your answer…"
                    value={f.answer}
                    onChange={(e) => updateField(i, 'answer', e.target.value)}
                  />
                </div>
                {/* AI Writing Assistant — shows per-field suggestions */}
                {f.label && (
                  <WritingAssistant
                    label={f.label}
                    answer={f.answer}
                    onInsertTemplate={(template) => handleInsertTemplate(i, template)}
                  />
                )}
              </div>
              <button
                type="button"
                className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 mt-0.5"
                onClick={() => removeField(i)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary text-sm mt-3" onClick={addField}>
        <Plus size={15} /> Add Custom Field
      </button>
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function ApplicationForm({ initialData, allFields, allGroups, onSubmit, onFormChange, mode = 'create' }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    funder_name: '',
    status: 'draft',
    notes: '',
    common_field_ids: [],
    custom_fields: [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        funder_name: initialData.funder_name || '',
        status: initialData.status || 'draft',
        notes: initialData.notes || '',
        common_field_ids: (initialData.common_fields || []).map((f) => f.id),
        custom_fields: (initialData.custom_fields || []).map((f) => ({
          id: f.id,
          label: f.label,
          answer: f.answer,
        })),
      })
    }
  }, [initialData])

  // Notify parent of form changes for live analysis
  const notifyFormChange = useCallback(() => {
    if (!onFormChange) return
    // Build live application shape that the analyzer expects
    const commonFieldObjects = (form.common_field_ids || [])
      .map((id) => allFields.find((f) => f.id === id))
      .filter(Boolean)
    onFormChange({
      funder_name: form.funder_name,
      status: form.status,
      common_fields: commonFieldObjects,
      custom_fields: form.custom_fields,
    })
  }, [form, allFields, onFormChange])

  useEffect(() => {
    notifyFormChange()
  }, [notifyFormChange])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Application title is required.'); return }
    setSaving(true)
    setError('')
    try {
      await onSubmit(form)
      navigate('/applications')
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Application Title *</label>
            <input
              className="input"
              placeholder="e.g. Arts Council England – Small Grants 2025"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Funder Name</label>
            <input
              className="input"
              placeholder="e.g. Arts Council England"
              value={form.funder_name}
              onChange={(e) => setForm((f) => ({ ...f, funder_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Notes <span className="text-slate-400 font-normal">(internal)</span></label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Deadline, specific requirements, contacts…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
      </section>

      {/* Common Fields */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Common Fields</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select reusable fields to include in this application.
            </p>
          </div>
          {form.common_field_ids.length > 0 && (
            <span className="badge-category">{form.common_field_ids.length} selected</span>
          )}
        </div>
        {allFields.length === 0 ? (
          <div className="text-sm text-slate-500 italic py-4 text-center border border-dashed border-slate-200 rounded-xl">
            No common fields available. Add some in Common Fields first.
          </div>
        ) : (
          <CommonFieldSelector
            allFields={allFields}
            allGroups={allGroups}
            selectedIds={form.common_field_ids}
            onChange={(ids) => setForm((f) => ({ ...f, common_field_ids: ids }))}
          />
        )}
      </section>

      {/* Custom Fields */}
      <section>
        <div className="mb-4 pb-2 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Custom Fields</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add funder-specific questions and answers unique to this application.
          </p>
        </div>
        <CustomFieldsSection
          customFields={form.custom_fields}
          onChange={(fields) => setForm((f) => ({ ...f, custom_fields: fields }))}
        />
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/applications')}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving
            ? 'Saving…'
            : mode === 'edit'
            ? 'Save Changes'
            : 'Create Application'}
        </button>
      </div>
    </form>
  )
}
