import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function NotFoundPage() {
  return (
    <>
      <Header />
      <main id="conteudo-principal" className="auth-page">
        <div className="profile-card">
          <p className="profile-card__eyebrow">404</p>
          <h1 className="profile-card__title">Página não encontrada</h1>
          <p className="profile-card__subtitle">
            A página que procura não existe ou foi movida.
          </p>
          <Link href="/" className="btn btn--primary">
            Voltar ao início
          </Link>
        </div>
      </main>
    </>
  );
}
