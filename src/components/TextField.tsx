type Props = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
  };
  
  export default function TextField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
  }: Props) {
    return (
      <div className="field">
        <label className="field__label">{label}</label>
        <input
          className="field__input"
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }