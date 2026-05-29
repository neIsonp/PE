"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

type HeaderProps = {
  active?: "home" | "events" | "login" | "profile" | "admin";
};

const baseLinks = [
  { href: "/#missao", label: "Missão" },
  { href: "/#parceiros", label: "Parceiros" },
  { href: "/#oportunidades", label: "Oportunidades" },
  { href: "/#contactos", label: "Contactos" },
  { href: "/eventos", label: "Eventos", key: "events" }
] as const;

export function Header({ active = "home" }: HeaderProps) {
  const router = useRouter();
  const { user: currentUser, clearUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 12);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    clearUser();
    setIsOpen(false);
    router.push("/login");
  }

  const sessionLinks = currentUser
    ? [
      { href: "/perfil", label: "Perfil", key: "profile" as const },
      ...(currentUser.role === "ADMIN" ? [{ href: "/admin", label: "Admin", key: "admin" as const }] : [])
    ]
    : [{ href: "/login", label: "Entrar", key: "login" as const }];

  return (
    <header className={`header ${isScrolled ? "header--scrolled" : ""}`} id="header" role="banner">
      <div className="header__container">
        <Link href="/" className="header__logo" aria-label="Página inicial do CACA">
          <div className="logo">
            <Image
              src="/assets/logo-caca.svg"
              alt="Logo CACA"
              className="header__logo-img"
              width={60}
              height={60}
              priority
            />
          </div>
        </Link>

        <nav
          className={`header__nav ${isOpen ? "header__nav--open" : ""}`}
          id="mainNav"
          role="navigation"
          aria-label="Navegação principal"
        >
          {[...baseLinks, ...sessionLinks].map((link) => {
            const key = "key" in link ? link.key : undefined;
            const isActive = key ? active === key : false;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`header__nav-link ${isActive ? "header__nav-link--active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}

          {currentUser ? (
            <button
              type="button"
              className="header__nav-link header__nav-button"
              onClick={handleLogout}
              style={{ color: "#dc2626", fontWeight: 800 }}
            >
              Sair
            </button>
          ) : null}
        </nav>

        <button
          type="button"
          className={`header__hamburger ${isOpen ? "header__hamburger--active" : ""}`}
          id="menuToggle"
          aria-label={isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
          aria-expanded={isOpen}
          aria-controls="mainNav"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="header__hamburger-line" />
          <span className="header__hamburger-line" />
          <span className="header__hamburger-line" />
        </button>
      </div>
    </header>
  );
}
