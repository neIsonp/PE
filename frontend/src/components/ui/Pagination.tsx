import type { PaginationMeta } from "@/lib/api-client";

type PaginationProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  isDisabled?: boolean;
  label?: string;
};

export function Pagination({ meta, onPageChange, isDisabled = false, label = "Paginação" }: PaginationProps) {
  if (meta.totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label={label}>
      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(meta.page - 1)}
        disabled={isDisabled || !meta.hasPreviousPage}
      >
        Anterior
      </button>
      <span className="pagination__status" aria-live="polite">
        Página {meta.page} de {meta.totalPages}
      </span>
      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(meta.page + 1)}
        disabled={isDisabled || !meta.hasNextPage}
      >
        Seguinte
      </button>
    </nav>
  );
}
