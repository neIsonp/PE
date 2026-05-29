import { partners } from "@/data/home";

export function Partners() {
  return (
    <section id="parceiros" className="section section--alt" aria-labelledby="parceiros-titulo">
      <div className="container">
        <h2 className="section__title" id="parceiros-titulo">
          Nossos Parceiros
        </h2>
        <p className="section__description">
          Colaboração institucional para excelência em saúde e investigação
        </p>

        <div className="partners">
          {partners.map((partner) => (
            <div className="partners__item" tabIndex={0} key={partner.name}>
              <i
                className={partner.icon}
                style={{ fontSize: 40, color: "var(--azul-500)", marginBottom: 10 }}
              />
              <span className="partners__name">{partner.name}</span>
            </div>
          ))}
        </div>
        <p className="section__description" style={{ marginTop: 20 }}>
          + várias outras instituições colaboradoras
        </p>
      </div>
    </section>
  );
}
