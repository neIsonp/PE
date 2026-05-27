import Link from "next/link";

export function Footer() {
  return (
    <div className="site-footer-wrapper">
      <div className="site-footer-bg" style={{ backgroundImage: "url('/assets/imagem.webp')" }} />
      <div className="site-footer-overlay" />

      <section className="pre-footer-cta">
        <div className="pre-footer-cta__content">
          <h2 className="pre-footer-cta__title">
            Pronto para liderar a inovação
            <br />
            da saúde nos Açores?
          </h2>
          <div className="pre-footer-cta__buttons">
            <Link href="/#contactos" className="cta-btn cta-btn--white">
              Começar Agora
            </Link>
            <Link href="/#missao" className="cta-btn cta-btn--outline">
              Saber mais <i className="fi fi-rr-arrow-right" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__top">
            <div className="footer__brand">
              <span className="footer__logo-text">
                <i className="fi fi-rr-hospital" />
                CACA
              </span>
            </div>

            <div className="footer__nav">
              <div className="footer__col">
                <h3 className="footer__title">O CACA</h3>
                <ul className="footer__links">
                  <li>
                    <Link href="/#missao">Missão e Visão</Link>
                  </li>
                  <li>
                    <Link href="/#investigacao">Investigação</Link>
                  </li>
                  <li>
                    <Link href="/#oportunidades">Oportunidades</Link>
                  </li>
                  <li>
                    <Link href="/eventos">Eventos</Link>
                  </li>
                </ul>
              </div>

              <div className="footer__col">
                <h3 className="footer__title">Comunidade</h3>
                <ul className="footer__links">
                  <li>
                    <Link href="/#parceiros">Parceiros</Link>
                  </li>
                  <li>
                    <Link href="/#news-feed">Notícias</Link>
                  </li>
                  <li>
                    <Link href="/#newsletter">Newsletter</Link>
                  </li>
                  <li>
                    <Link href="/perfil">Utilizadores</Link>
                  </li>
                </ul>
              </div>

              <div className="footer__col">
                <h3 className="footer__title">Informação</h3>
                <ul className="footer__links">
                  <li>
                    <Link href="/#privacidade">Privacidade</Link>
                  </li>
                  <li>
                    <Link href="/#termos">Termos de Uso</Link>
                  </li>
                  <li>
                    <Link href="/#acessibilidade">Acessibilidade</Link>
                  </li>
                  <li>
                    <Link href="/#contactos">Contactos</Link>
                  </li>
                </ul>
              </div>

              <div className="footer__col">
                <h3 className="footer__title">Redes Sociais</h3>
                <ul className="footer__links">
                  <li>
                    <Link href="#twitter">Twitter</Link>
                  </li>
                  <li>
                    <Link href="#linkedin">LinkedIn</Link>
                  </li>
                  <li>
                    <Link href="#facebook">Facebook</Link>
                  </li>
                  <li>
                    <Link href="#instagram">Instagram</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer__huge-text">CACA</div>
        </div>
      </footer>
    </div>
  );
}
