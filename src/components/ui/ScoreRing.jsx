/**
 * ScoreRing — animated circular progress ring with score label
 */
export default function ScoreRing({ score = 0, size = 96, strokeWidth = 8, label }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(score, 0), 100)
  const offset = circumference - (progress / 100) * circumference

  // Colour based on score
  let trackColor, textColor
  if (progress >= 80) {
    trackColor = '#11b67a'; textColor = 'text-emerald-600'
  } else if (progress >= 60) {
    trackColor = '#3b82f6'; textColor = 'text-blue-600'
  } else if (progress >= 35) {
    trackColor = '#f59e0b'; textColor = 'text-amber-600'
  } else {
    trackColor = '#ef4444'; textColor = 'text-red-500'
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Score text inside ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold leading-none ${textColor}`}>{progress}</span>
          <span className="text-xs text-slate-400 leading-none mt-0.5">/ 100</span>
        </div>
      </div>
      {label && <span className="text-xs font-medium text-slate-500 text-center">{label}</span>}
    </div>
  )
}
