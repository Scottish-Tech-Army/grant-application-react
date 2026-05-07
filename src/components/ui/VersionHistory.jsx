function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VersionHistory({ versions = [], currentValue }) {
  if (!versions.length) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No version history available.
      </div>
    )
  }

  const sorted = [...versions].sort((a, b) => b.id - a.id)

  return (
    <div className="space-y-3">
      {sorted.map((v, index) => {
        const isCurrent = v.value === currentValue
        const versionNum = versions.length - index
        return (
          <div key={v.id} className="border border-slate-100 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  v{versionNum}
                </span>
                {isCurrent && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Current
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">{formatDate(v.created_at)}</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 max-h-28 overflow-y-auto">
              <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-words">
                {v.value || <span className="text-slate-400 italic">Empty</span>}
              </pre>
            </div>
          </div>
        )
      })}
    </div>
  )
}
