import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AuthGate } from "@/components/auth/AuthGate";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Administração | CACA",
  description: "Painel de administração do CACA."
};

export default function AdminPage() {
  return (
    <>
      <Header active="admin" />
      <main id="conteudo-principal" className="auth-page">
        <AuthGate requiredRole="ADMIN">
          <AdminDashboard />
        </AuthGate>
      </main>
    </>
  );
}
