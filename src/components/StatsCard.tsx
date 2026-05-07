export default function StatsCard({
    label,
    value,
  }: {
    label: string;
    value: number;
  }) {
    return (
      <div className="stat">
        <div className="stat__label">{label}</div>
        <div className="stat__value">{value}</div>
      </div>
    );
  }