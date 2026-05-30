"use client";

import { useEffect } from "react";
import { researchAreas } from "@/data/home";

export function ResearchAreas() {
  useEffect(() => {
    if (window.location.hash === "#investigacao") {
      document.getElementById("investigacao")?.classList.add("visible");
    }
  }, []);

  return (
    <section id="investigacao" className="section research-areas" aria-labelledby="investigacao-titulo">
      <div className="container">
        <h2 className="section__title" id="investigacao-titulo">
          Áreas de Investigação
        </h2>
        <p className="section__description">
          Desenvolvendo soluções inovadoras para os desafios da saúde regional e global
        </p>

        <div className="research">
          {researchAreas.map((area) => (
            <article className="research__card" tabIndex={0} key={area.title}>
              <div className="research__icon-wrap">
                <i className={area.icon} />
              </div>
              <div className="research__content">
                <h3 className="research__card-title">{area.title}</h3>
                <p className="research__card-text">{area.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
