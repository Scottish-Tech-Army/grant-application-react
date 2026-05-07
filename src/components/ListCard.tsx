import styles from './ListCard.module.css';

type ListCardProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  onOpen?: () => void;
  onDelete?: () => void;
};

export function ListCard({
  title,
  subtitle,
  meta,
  onOpen,
  onDelete,
}: Readonly<ListCardProps>) {
  return (
    <div className={styles.card}>
      <div>
        <div className={styles.title}>{title}</div>
        {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
        {meta ? <div className={styles.meta}>{meta}</div> : null}
      </div>
      <div className={styles.actions}>
        {onOpen ? (
          <button type="button" className={styles.primary} onClick={onOpen}>
            View
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" className={styles.ghost} onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}
