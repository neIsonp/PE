import type { Metadata } from "next";
import { AuthGate } from "@/components/auth/AuthGate";
import { ProfileClient } from "@/components/auth/ProfileClient";

export const metadata: Metadata = {
  title: "Perfil | CACA",
  description: "Perfil de utilizador integrado com a API do CACA."
};

export default function PerfilPage() {
  return (
    <main id="conteudo-principal" className="auth-page">
      <AuthGate>
        <ProfileClient />
      </AuthGate>
    </main>
  );
}
