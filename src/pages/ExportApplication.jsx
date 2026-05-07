import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Copy, CheckCheck, Download, FileText, AlertCircle,
  FileDown, ChevronDown, Printer, FileType,
} from 'lucide-react'
import { getApplicationExport } from '../services/api.js'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function StatusBadge({ status }) {
  if (status === 'submitted') return <span className="badge-submitted">Submitted</span>
  if (status === 'accepted')  return <span className="badge-accepted">Accepted</span>
  if (status === 'rejected')  return <span className="badge-rejected">Rejected</span>
  return <span className="badge-draft">Draft</span>
}

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-ghost text-xs py-1.5 px-2.5 transition-all ${
        copied ? 'text-emerald-600 bg-emerald-50' : ''
      }`}
    >
      {copied ? (
        <><CheckCheck size={13} /> Copied!</>
      ) : (
        <><Copy size={13} /> {label}</>
      )}
    </button>
  )
}

function FieldCard({ field, index }) {
  const copyText = `${field.question}\n${field.answer || '(no answer)'}`

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-slate-400 shrink-0">Q{index + 1}</span>
          {field.group && (
            <span className="badge-category text-xs shrink-0">{field.group}</span>
          )}
          {field.type === 'custom' && (
            <span className="badge bg-violet-50 text-violet-600 border border-violet-100 text-xs shrink-0">Custom</span>
          )}
          <span className="font-semibold text-slate-800 text-sm truncate">{field.question}</span>
        </div>
        <CopyButton text={copyText} />
      </div>
      <div className="px-5 py-4">
        {field.answer ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{field.answer}</p>
        ) : (
          <p className="text-sm text-slate-400 italic">No answer provided.</p>
        )}
      </div>
    </div>
  )
}

// ─── Export Helpers ────────────────────────────────────────────────────────────

function buildPlainText(data) {
  const fields = (data?.fields || [])
    .map((f, i) => `Q${i + 1}: ${f.question}\n\n${f.answer || '(no answer)'}`)
    .join('\n\n---\n\n')
  const header = `${data.title}\nFunder: ${data.funder_name || '—'}\nExported: ${formatDate(new Date().toISOString())}\n\n${'='.repeat(60)}\n\n`
  return header + fields
}

function buildHtmlDocument(data) {
  const fields = (data?.fields || []).map((f, i) => `
    <div style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      <div style="background:#f8fafc;padding:10px 16px;border-bottom:1px solid #e2e8f0;">
        <strong style="color:#64748b;font-size:12px;">Q${i + 1}</strong>
        ${f.group ? `<span style="background:#f1f5f9;color:#475569;font-size:11px;padding:2px 8px;border-radius:12px;margin-left:8px;">${f.group}</span>` : ''}
        <span style="font-weight:600;color:#1e293b;font-size:14px;margin-left:8px;">${f.question}</span>
      </div>
      <div style="padding:12px 16px;">
        <p style="color:#334155;font-size:13px;line-height:1.7;margin:0;white-space:pre-wrap;">${f.answer || '<em style="color:#94a3b8;">No answer provided.</em>'}</p>
      </div>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.title} — FundSight Export</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 760px; margin: 0 auto; padding: 40px 20px; color: #1e293b; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .meta span { margin-right: 16px; }
    hr { border: none; border-top: 2px solid #e2e8f0; margin: 24px 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  <div class="meta">
    <span>Funder: ${data.funder_name || '—'}</span>
    <span>Exported: ${formatDate(new Date().toISOString())}</span>
    <span>${(data.fields || []).length} fields</span>
  </div>
  <hr>
  ${fields}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:11px;">
    Exported from FundSight — Smart Grant Application Manager
  </div>
</body>
</html>`
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeName(title) {
  return title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

// ─── Export Dropdown ──────────────────────────────────────────────────────────

function ExportDropdown({ data }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTextDownload = () => {
    const content = buildPlainText(data)
    const blob = new Blob([content], { type: 'text/plain' })
    downloadBlob(blob, `${safeName(data.title)}_export.txt`)
    setOpen(false)
  }

  const handleWordDownload = () => {
    const html = buildHtmlDocument(data)
    const blob = new Blob(
      ['\ufeff' + html],
      { type: 'application/msword' }
    )
    downloadBlob(blob, `${safeName(data.title)}_export.doc`)
    setOpen(false)
  }

  const handlePdfDownload = () => {
    const html = buildHtmlDocument(data)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn-primary text-sm"
        onClick={() => setOpen(!open)}
      >
        <FileDown size={15} />
        Export
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1.5 overflow-hidden">
          <button
            onClick={handlePdfDownload}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Printer size={15} className="text-red-500 shrink-0" />
            <div>
              <p className="font-semibold">Export as PDF</p>
              <p className="text-xs text-slate-400">Print-ready format</p>
            </div>
          </button>
          <button
            onClick={handleWordDownload}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileType size={15} className="text-blue-500 shrink-0" />
            <div>
              <p className="font-semibold">Export as Word</p>
              <p className="text-xs text-slate-400">.doc format for editing</p>
            </div>
          </button>
          <button
            onClick={handleTextDownload}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download size={15} className="text-slate-500 shrink-0" />
            <div>
              <p className="font-semibold">Export as Text</p>
              <p className="text-xs text-slate-400">Plain .txt file</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExportApplication() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getApplicationExport(id)
      .then((res) => {
        if (res.error) setError(res.error)
        else setData(res)
      })
      .catch(() => setError('Failed to load application.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
        <p className="text-slate-600 mb-4">{error}</p>
        <Link to="/applications" className="btn-secondary">Back to Applications</Link>
      </div>
    )
  }

  const allText = (data?.fields || [])
    .map((f, i) => `Q${i + 1}: ${f.question}\n\n${f.answer || '(no answer)'}`)
    .join('\n\n---\n\n')

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/applications" className="btn-ghost text-sm mb-3 -ml-2 inline-flex">
          <ArrowLeft size={15} /> Back to Applications
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="page-title">{data.title}</h1>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {data.funder_name && (
                <span className="text-sm text-slate-500">{data.funder_name}</span>
              )}
              <StatusBadge status={data.status} />
              <span className="text-xs text-slate-400">
                {(data.fields || []).length} field{data.fields?.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CopyButton text={allText} label="Copy All" />
            <ExportDropdown data={data} />
            <Link
              to={`/applications/${id}/edit`}
              className="btn-secondary text-sm"
            >
              Edit
            </Link>
          </div>
        </div>

        {data.notes && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
            <span>{data.notes}</span>
          </div>
        )}
      </div>

      {/* Fields */}
      {(!data.fields || data.fields.length === 0) ? (
        <div className="card py-16 text-center">
          <FileText size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm mb-4">No fields in this application yet.</p>
          <Link to={`/applications/${id}/edit`} className="btn-primary text-sm">
            Add Fields
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.fields.map((field, i) => (
            <FieldCard key={i} field={field} index={i} />
          ))}
        </div>
      )}

      {/* Bottom actions */}
      {data.fields?.length > 2 && (
        <div className="mt-6 card p-4 flex items-center justify-between bg-slate-50">
          <span className="text-sm text-slate-600 font-medium">
            {data.fields.length} Q&A pairs ready to export
          </span>
          <div className="flex items-center gap-2">
            <CopyButton text={allText} label="Copy All" />
            <ExportDropdown data={data} />
          </div>
        </div>
      )}
    </div>
  )
}
