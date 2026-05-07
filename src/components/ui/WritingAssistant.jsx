import { useState } from 'react'
import {
  Sparkles, ChevronDown, ChevronUp, Copy, Check,
  CircleAlert, Lightbulb, BookOpen, Target,
} from 'lucide-react'
import { getFieldSuggestion } from '../../services/analyzer.js'

const QUALITY_BADGE = {
  empty:  { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',    label: 'Empty'  },
  brief:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200', label: 'Brief'  },
  fair:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',  label: 'Fair'   },
  good:   { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200',label: 'Strong' },
}

const PRIORITY_STYLES = {
  high:   'text-red-600',
  medium: 'text-amber-600',
  low:    'text-blue-600',
}

/**
 * WritingAssistant — AI-powered per-field writing guidance.
 * Shows quality badge, suggested template, key phrases, checklist, and improvements.
 */
export default function WritingAssistant({ label, answer, onInsertTemplate }) {
  const [expanded, setExpanded] = useState(false)
  const [copiedTemplate, setCopiedTemplate] = useState(false)
  const [showExample, setShowExample] = useState(false)

  if (!label) return null

  const suggestion = getFieldSuggestion(label, answer)
  const q = QUALITY_BADGE[suggestion.quality.level] || QUALITY_BADGE.empty

  const handleCopyTemplate = () => {
    if (onInsertTemplate) {
      onInsertTemplate(suggestion.template)
    } else {
      navigator.clipboard.writeText(suggestion.template)
    }
    setCopiedTemplate(true)
    setTimeout(() => setCopiedTemplate(false), 2000)
  }

  return (
    <div className="mt-2">
      {/* Collapsed bar — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 hover:border-indigo-200 transition-all group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={13} className="text-indigo-500 shrink-0" />
          <span className="text-xs font-semibold text-indigo-700">AI Assistant</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${q.bg} ${q.text} ${q.border}`}>
            {q.label}
          </span>
          {suggestion.wordCount > 0 && (
            <span className="text-xs text-slate-400">
              {suggestion.wordCount}/{suggestion.wordTarget}+ words
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {suggestion.improvements.length > 0 && !expanded && (
            <span className="text-xs text-indigo-500 hidden sm:inline">
              {suggestion.improvements.length} tip{suggestion.improvements.length > 1 ? 's' : ''}
            </span>
          )}
          {expanded ? (
            <ChevronUp size={14} className="text-indigo-400" />
          ) : (
            <ChevronDown size={14} className="text-indigo-400" />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="mt-1.5 rounded-xl border border-indigo-100 bg-white overflow-hidden">

          {/* Improvement tips */}
          {suggestion.improvements.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-100 space-y-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Target size={12} className="text-indigo-500" />
                <span className="text-xs font-semibold text-slate-700">How to improve</span>
              </div>
              {suggestion.improvements.map((imp, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <CircleAlert size={11} className={`shrink-0 mt-0.5 ${PRIORITY_STYLES[imp.priority]}`} />
                  <span className="text-slate-600 leading-snug">{imp.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Template */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Lightbulb size={12} className="text-amber-500" />
                <span className="text-xs font-semibold text-slate-700">Suggested template</span>
              </div>
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {copiedTemplate ? <Check size={11} /> : <Copy size={11} />}
                {copiedTemplate ? 'Inserted' : (onInsertTemplate ? 'Use template' : 'Copy')}
              </button>
            </div>
            <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-lg p-2.5 whitespace-pre-wrap border border-slate-100">
              {suggestion.template}
            </div>
          </div>

          {/* Checklist */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Check size={12} className="text-emerald-500" />
              <span className="text-xs font-semibold text-slate-700">Funder checklist</span>
            </div>
            <div className="space-y-1">
              {suggestion.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border ${
                      item.covered
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {item.covered && <Check size={8} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={item.covered ? 'text-slate-500 line-through' : 'text-slate-700'}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Key phrases */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={12} className="text-blue-500" />
              <span className="text-xs font-semibold text-slate-700">
                Key phrases funders look for
              </span>
              <span className="text-xs text-slate-400">
                ({suggestion.matchedPhrases.length}/{suggestion.keyPhrases.length} used)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestion.keyPhrases.map((phrase, i) => {
                const isMatched = suggestion.matchedPhrases.includes(phrase)
                return (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      isMatched
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {phrase}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Strong example */}
          {suggestion.strongExample && (
            <div className="px-4 py-3">
              <button
                type="button"
                onClick={() => setShowExample(!showExample)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Sparkles size={11} />
                {showExample ? 'Hide example' : 'View strong example from a successful application'}
              </button>
              {showExample && (
                <div className="mt-2 text-xs text-slate-600 leading-relaxed bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 italic">
                  "{suggestion.strongExample}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
