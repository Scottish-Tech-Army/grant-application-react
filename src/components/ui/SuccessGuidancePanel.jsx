import {
  Zap, ArrowRight, CheckCircle2, TrendingUp, Target, Trophy,
  XCircle, ThumbsUp, ThumbsDown, Lightbulb, BookOpen,
} from 'lucide-react'
import ScoreRing from './ScoreRing.jsx'

const METRIC_COLORS = {
  sectionCoverage: { bar: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  answerQuality:   { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  wordCount:       { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  keyPhrases:      { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
  completeness:    { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
}

// ─── Post-Decision Review View ───────────────────────────────────────────────
function PostDecisionView({ review }) {
  const isAccepted = review.status === 'accepted'

  return (
    <div className="space-y-4">

      {/* Outcome Header */}
      <div className="card overflow-hidden">
        <div className={`flex items-center gap-2 px-4 py-3 border-b ${
          isAccepted
            ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100'
            : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-100'
        }`}>
          {isAccepted
            ? <Trophy size={14} className="text-emerald-600" />
            : <XCircle size={14} className="text-red-500" />
          }
          <span className={`text-xs font-bold ${isAccepted ? 'text-emerald-800' : 'text-red-800'}`}>
            {isAccepted ? 'Application Accepted' : 'Application Rejected'} — Review
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <ScoreRing score={review.score} size={80} strokeWidth={7} label="Quality" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 font-medium mb-1">Final Score</div>
              <div className="text-2xl font-bold text-slate-900">{review.score}/100</div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-slate-400">{review.totalFields} fields</span>
                <span className="text-xs text-slate-400">{review.totalWords} words</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What Went Right */}
      {review.strengths.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-100 bg-emerald-50/60">
            <ThumbsUp size={14} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-800">What Went Right</span>
          </div>
          <div className="divide-y divide-slate-50">
            {review.strengths.map((s, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{s.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{s.detail}</p>
                    {s.fields && s.fields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.fields.slice(0, 4).map((f, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {f}
                          </span>
                        ))}
                        {s.fields.length > 4 && (
                          <span className="text-xs text-slate-400">+{s.fields.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What Went Wrong */}
      {review.weaknesses.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-red-100 bg-red-50/60">
            <ThumbsDown size={14} className="text-red-500" />
            <span className="text-xs font-semibold text-red-800">
              {isAccepted ? 'Areas That Could Improve' : 'What Likely Went Wrong'}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {review.weaknesses.map((w, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{w.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{w.detail}</p>
                    {w.fields && w.fields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {w.fields.slice(0, 4).map((f, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            {f}
                          </span>
                        ))}
                        {w.fields.length > 4 && (
                          <span className="text-xs text-slate-400">+{w.fields.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Sections Coverage */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <span className="text-xs font-semibold text-slate-700">Section Coverage</span>
          <span className="text-xs text-slate-400">{review.presentSections?.length || 0}/6</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-1.5">
          {['mission','beneficiaries','budget','governance','outcomes','geography'].map((key) => {
            const present = review.presentSections?.some((s) => s.key === key)
            const labels = {
              mission: 'Mission', beneficiaries: 'Beneficiaries', budget: 'Budget',
              governance: 'Governance', outcomes: 'Outcomes', geography: 'Geography',
            }
            return (
              <div
                key={key}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                  present
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-red-50/50 text-red-400 border-red-100'
                }`}
              >
                {present
                  ? <CheckCircle2 size={11} className="shrink-0" />
                  : <XCircle size={11} className="shrink-0" />
                }
                <span className="truncate">{labels[key]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lessons Learned */}
      {review.lessons.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-100 bg-blue-50/60">
            <Lightbulb size={14} className="text-blue-600" />
            <span className="text-xs font-semibold text-blue-800">Lessons for Future Applications</span>
          </div>
          <div className="p-4 space-y-2">
            {review.lessons.map((lesson, i) => (
              <div key={i} className="flex items-start gap-2">
                <BookOpen size={11} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-snug">{lesson}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Panel (switches between guidance and review) ───────────────────────

/**
 * SuccessGuidancePanel — real-time sidebar that shows:
 *  - Draft/Submitted: success metrics, actions, and key sections (coaching mode)
 *  - Accepted/Rejected: post-decision review of what went right/wrong
 */
export default function SuccessGuidancePanel({ guidance, review, status }) {
  // Post-decision mode
  if ((status === 'accepted' || status === 'rejected') && review) {
    return <PostDecisionView review={review} />
  }

  // Empty state
  if (!guidance) {
    return (
      <div className="card p-5 text-center text-slate-400 text-sm">
        <Target size={24} className="mx-auto mb-2 opacity-40" />
        Start adding fields to see live AI guidance
      </div>
    )
  }

  const { score, successProbability, metricScores, metrics, actions,
    presentSections, totalFields, totalWords } = guidance

  return (
    <div className="space-y-4">

      {/* Score + Success Probability */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/80">
          <Zap size={14} className="text-indigo-600" />
          <span className="text-xs font-bold text-indigo-800">AI Success Coach</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} size={80} strokeWidth={7} label="Quality" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 font-medium mb-1">Success Probability</div>
              <div className="text-2xl font-bold text-slate-900">{successProbability}%</div>
              <div className="mt-1.5 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${successProbability}%`,
                    backgroundColor: successProbability >= 70 ? '#11b67a'
                      : successProbability >= 45 ? '#3b82f6'
                      : successProbability >= 25 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">{totalFields} fields</span>
                <span className="text-xs text-slate-400">{totalWords || 0} words</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Metrics Breakdown */}
      {metricScores && metrics && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <TrendingUp size={14} className="text-slate-600" />
            <span className="text-xs font-semibold text-slate-700">Success Metrics</span>
          </div>
          <div className="p-4 space-y-3">
            {Object.entries(metrics).map(([key, metric]) => {
              const value = metricScores[key] ?? 0
              const colors = METRIC_COLORS[key] || METRIC_COLORS.completeness
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">{metric.label}</span>
                    <span className={`text-xs font-bold ${value >= 70 ? 'text-emerald-600' : value >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {value}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{metric.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Priority Actions */}
      {actions && actions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-amber-50/60">
            <Target size={14} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">Next Steps to Improve</span>
          </div>
          <div className="divide-y divide-slate-50">
            {actions.map((action, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{action.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{action.detail}</p>
                    {action.impact && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-emerald-600">
                        <ArrowRight size={10} />
                        {action.impact}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Sections Coverage */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <span className="text-xs font-semibold text-slate-700">Key Sections</span>
          <span className="text-xs text-slate-400">{presentSections?.length || 0}/6 covered</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-1.5">
          {['mission','beneficiaries','budget','governance','outcomes','geography'].map((key) => {
            const present = presentSections?.some((s) => s.key === key)
            const labels = {
              mission: 'Mission', beneficiaries: 'Beneficiaries', budget: 'Budget',
              governance: 'Governance', outcomes: 'Outcomes', geography: 'Geography',
            }
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
                <span className="truncate">{labels[key]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* All good state */}
      {actions?.length === 0 && score >= 80 && (
        <div className="card p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Looking great!</p>
              <p className="text-xs text-emerald-600 mt-0.5">Your application covers all key areas and is well-detailed.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
