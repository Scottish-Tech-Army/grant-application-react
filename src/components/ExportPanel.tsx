import styles from './ExportPanel.module.css';

type ExportPanelProps = {
  content: string;
  onCopy: () => void;
  onDownload: () => void;
  copyLabel?: string;
  downloadLabel?: string;
};

export function ExportPanel({
  content,
  onCopy,
  onDownload,
  copyLabel = 'Copy All',
  downloadLabel = 'Download .txt',
}: Readonly<ExportPanelProps>) {
  return (
    <div className={styles.panel}>
      <textarea className={styles.preview} value={content} readOnly rows={12} />
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onCopy}>
          {copyLabel}
        </button>
        <button type="button" className={styles.secondary} onClick={onDownload}>
          {downloadLabel}
        </button>
      </div>
    </div>
  );
}
