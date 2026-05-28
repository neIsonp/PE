type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="ui-state ui-state--empty">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
