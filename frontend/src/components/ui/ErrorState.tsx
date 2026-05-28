type ErrorStateProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({ title = "Algo correu mal", message, actionLabel, onAction }: ErrorStateProps) {
  return (
    <div className="ui-state ui-state--error" role="alert">
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="btn btn--outline" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
