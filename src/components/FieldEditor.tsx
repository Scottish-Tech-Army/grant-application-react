import styles from './FieldEditor.module.css';
import type { FieldType } from '../types/models';

const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'number'];

type FieldEditorProps = {
  label: string;
  group?: string;
  type: FieldType;
  value: string;
  onChange: (patch: {
    label?: string;
    group?: string;
    type?: FieldType;
    value?: string;
  }) => void;
  onRemove?: () => void;
};

export function FieldEditor({
  label,
  group,
  type,
  value,
  onChange,
  onRemove,
}: FieldEditorProps) {
  return (
    <div className={styles.row}>
      <div className={styles.inputs}>
        <input
          className={styles.input}
          value={label}
          onChange={(event) => onChange({ label: event.target.value })}
          placeholder="Field label"
        />
        {typeof group === 'string' ? (
          <input
            className={styles.input}
            value={group}
            onChange={(event) => onChange({ group: event.target.value })}
            placeholder="Group"
          />
        ) : null}
        <select
          className={styles.input}
          value={type}
          onChange={(event) => onChange({ type: event.target.value as FieldType })}
        >
          {FIELD_TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className={styles.value}
        value={value}
        onChange={(event) => onChange({ value: event.target.value })}
        placeholder="Field value"
        rows={3}
      />
      {onRemove ? (
        <button type="button" className={styles.remove} onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </div>
  );
}
