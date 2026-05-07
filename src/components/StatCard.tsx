export default function StatCard({ label, value, hint }) {
    return (
      <div className="card statCard">
        <div className="statLabel">{label}</div>
        <div className="statValue">{value}</div>
        {hint ? <div className="statHint">{hint}</div> : null}
      </div>
    );
  }