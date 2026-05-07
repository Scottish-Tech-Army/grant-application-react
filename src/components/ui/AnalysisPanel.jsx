import { AlertTriangle, CheckCircle2, Info, Lightbulb, BookOpen, TrendingUp } from 'lucide-react'
import ScoreRing from './ScoreRing.jsx'

const READINESS_STYLES = {
  ready:    { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200', dot: 'bg-emerald-500' },
  nearly:   { bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200',    dot: 'bg-blue-500'    },
  progress: { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',   dot: 'bg-amber-500'   },
  started:  { bg: 'bg-red-50',      text: 'text-red-700',      border: 'border-red-200',     dot: 'bg-red-400'     },
  empty:    { bg: 'bg-slate-50',    text: 'text-slate-500',    border: 'border-slate-200',   dot: 'bg-slate-400'   },
}

const QUALITY_STYLES = {
  empty:  { bar: 'bg-red-400',     text: 'text-red-600',     label: 'Empty'  },
  brief:  { bar: 'bg-orange-400',  text: 'text-orange-600',  label: 'Brief'  },
  fair:   { bar: 'bg-amber-400',   text: 'text-amber-600',   label: 'Fair'   },
  good:   { bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'Strong' },
}

const SUGGESTION_STYLES = {
  error:   { bg: 'bg-red-50',     border: 'border-red-100',   icon: <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" /> },
  warning: { bg: 'bg-amber-50',   border: 'border-amber-100', icon: <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" /> },
  info:    { bg: 'bg-blue-50',    border: 'border-blue-100',  icon: <Lightbulb size={14} className="text-blue-500 shrink-0 mt-0.5" /> },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> },
}

function QualityBar({ count, total, styleKey, label }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const s = QUALITY_STYLES[styleKey]
  if (count === 0) return null
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-medium w-12 shrink-0 ${s.text}`}>{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${s.bar} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-5 text-right">{count}</span>
    </div>
  )
}

export default function AnalysisPanel({ analysis, compact = false }) {
  if (!analysis) {
    return (
      <div className="card p-5 text-center text-slate-400 text-sm">
        <BookOpen size={24} className="mx-auto mb-2 opacity-40" />
        No analysis available
      </div>
    )
  }

  const rs = READINESS_STYLES[analysis.readinessLevel] || READINESS_STYLES.started

  return (
    <div className={`card overflow-hidden ${compact ? '' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary-600" />
          <span className="text-sm font-semibold text-slate-900">Application Analysis</span>
        </div>
        <span className={`badge border text-xs font-medium ${rs.bg} ${rs.text} ${rs.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${rs.dot}`} />
          {analysis.readiness}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Score + Breakdown */}
        <div className="flex items-start gap-5">
          <ScoreRing score={analysis.score} size={84} strokeWidth={7} label="Quality" />

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Answer Quality
            </div>
            <div className="space-y-1.5">
              <QualityBar count={analysis.goodCount}  total={analysis.totalFields} styleKey="good"  label="Strong" />
              <QualityBar count={analysis.fairCount}  total={analysis.totalFields} styleKey="fair"  label="Fair"   />
              <QualityBar count={analysis.briefCount} total={analysis.totalFields} styleKey="brief" label="Brief"  />
              <QualityBar count={analysis.emptyCount} total={analysis.totalFields} styleKey="empty" label="Empty"  />
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {analysis.totalFields} fields · {analysis.totalWords || 0} words total
            </div>
          </div>
        </div>

        {/* Key Sections Coverage */}
        {!compact && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Key Sections
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {['mission','beneficiaries','budget','governance','outcomes','geography'].map((key) => {
                const present = analysis.presentSections?.some((s) => s.key === key)
                const section = [...(analysis.presentSections || []), ...(analysis.missingSections || [])]
                  .find((s) => s.key === key)
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                      present
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}
                  >
                    {present
                      ? <CheckCircle2 size={11} className="shrink-0" />
                      : <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 shrink-0" />
                    }
                    <span className="truncate">{section?.label || key}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {analysis.suggestions && analysis.suggestions.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Suggestions
            </div>
            <div className="space-y-2">
              {analysis.suggestions.map((s, i) => {
                const style = SUGGESTION_STYLES[s.type] || SUGGESTION_STYLES.info
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${style.bg} ${style.border}`}
                  >
                    {style.icon}
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 leading-snug">{s.title}</p>
                      {s.detail && <p className="text-slate-500 mt-0.5 leading-snug">{s.detail}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All good state */}
        {analysis.suggestions?.length === 0 && analysis.score >= 80 && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Looking great!</p>
              <p className="text-xs text-emerald-600 mt-0.5">This application is well-structured and ready to submit.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
