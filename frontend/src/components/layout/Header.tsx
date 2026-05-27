"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type HeaderProps = {
  active?: "home" | "events" | "login" | "profile";
};

const baseLinks = [
  { href: "/#missao", label: "Missão" },
  { href: "/#parceiros", label: "Parceiros" },
  { href: "/#oportunidades", label: "Oportunidades" },
  { href: "/#contactos", label: "Contactos" },
  { href: "/eventos", label: "Eventos", key: "events" },
  { href: "/login", label: "Entrar", key: "login" },
  { href: "/perfil", label: "Perfil", key: "profile" }
] as const;

export function Header({ active = "home" }: HeaderProps) {
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
          {baseLinks.map((link) => {
            const key = "key" in link ? link.key : "home";
            const isActive = active === key;

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
