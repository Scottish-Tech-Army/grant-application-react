export default function StatusBadge({ status }) {
  switch (status) {
    case 'completed':  return <span className="badge-completed">Completed</span>
    case 'submitted':  return <span className="badge-submitted">Submitted</span>
    case 'accepted':   return <span className="badge-accepted">✓ Accepted</span>
    case 'rejected':   return <span className="badge-rejected">✗ Rejected</span>
    default:           return <span className="badge-draft">Draft</span>
  }
}
