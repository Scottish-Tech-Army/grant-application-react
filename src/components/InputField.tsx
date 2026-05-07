import styles from './InputField.module.css';
import type { FieldType } from '../types/models';

type InputFieldProps = {
  label: string;
  type: FieldType;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
}: Readonly<InputFieldProps>) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {type === 'textarea' ? (
        <textarea
          className={styles.control}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          className={styles.control}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}
