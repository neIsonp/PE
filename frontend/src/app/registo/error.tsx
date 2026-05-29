'use client';
import { ErrorState } from '@/components/ui/ErrorState';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="conteudo-principal" className="auth-page">
      <div className="container">
        <ErrorState message={error.message || 'Ocorreu um erro ao carregar a página.'} actionLabel="Tentar novamente" onAction={reset} />
      </div>
    </main>
  );
}
