export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4 text-slate-400">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}
