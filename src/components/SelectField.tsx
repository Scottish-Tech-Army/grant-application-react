type Option = { label: string; value: string };

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
};

export default function SelectField({ label, value, onChange, options }: Props) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      <select
        className="field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}