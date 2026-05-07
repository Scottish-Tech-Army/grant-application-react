type ApiErrorBannerProps = {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
};

export function ApiErrorBanner({ message, onDismiss, onRetry }: Readonly<ApiErrorBannerProps>) {
  return (
    <div
      role="alert"
      style={{
        border: '1px solid #FFB300',
        backgroundColor: 'rgba(255, 212, 90, 0.25)',
        color: '#005BBB',
        borderRadius: '0.5rem',
        padding: '0.75rem 0.9rem',
        margin: '0 0 1rem 0',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        alignItems: 'center',
      }}
    >
      <span>{message}</span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        ) : null}
        {onDismiss ? (
          <button type="button" onClick={onDismiss}>
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
