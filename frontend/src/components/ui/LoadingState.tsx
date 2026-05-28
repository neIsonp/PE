type LoadingStateProps = {
  title?: string;
  message?: string;
};

export function LoadingState({ title = "A carregar...", message }: LoadingStateProps) {
  return (
    <div className="ui-state ui-state--loading" role="status" aria-live="polite">
      <span className="ui-state__spinner" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {message ? <p>{message}</p> : null}
      </div>
    </div>
  );
}
