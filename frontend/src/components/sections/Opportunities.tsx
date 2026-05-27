import Link from "next/link";
import { opportunities } from "@/data/home";

export function Opportunities() {
  return (
    <section id="oportunidades" className="section" aria-labelledby="oportunidades-titulo">
      <div className="container">
        <h2 className="section__title" id="oportunidades-titulo">
          Oportunidades
        </h2>
        <p className="section__description">Junte-se a nós na construção do futuro da saúde</p>

        <div className="opportunities">
          {opportunities.map((opportunity) => (
            <Link href="/#contactos" className="opportunities__card" tabIndex={0} key={opportunity.title}>
              <div className="opportunities__icon">
                <i className={opportunity.icon} />
              </div>
              <div className="opportunities__content">
                <h3 className="opportunities__title">{opportunity.title}</h3>
                <p className="opportunities__text">{opportunity.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
