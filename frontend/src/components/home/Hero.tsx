"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    src: "/assets/imagem.jpg",
    webp: "/assets/imagem.webp",
    alt: "Paisagem dos Açores"
  },
  {
    src: "/assets/uac.png",
    webp: "/assets/uac.webp",
    alt: "Universidade dos Açores"
  },
  {
    src: "/assets/governo-acores.jpg",
    webp: "/assets/governo-acores.webp",
    alt: "Governo dos Açores"
  }
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  function showResearchAreas() {
    const researchSection = document.getElementById("investigacao");
    researchSection?.classList.add("visible");
    researchSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="missao" className="hero" aria-label="Secção principal">
      <div className="hero__container">
        <h1 className="hero__title">
          Construindo o Futuro
          <br />
          da Saúde nos Açores
        </h1>
        <p className="hero__subtitle">
          Uma parceria inovadora entre a Universidade dos Açores e instituições de saúde regionais,
          dedicada à investigação clínica de excelência, ao ensino de qualidade e à melhoria dos
          cuidados de saúde nas ilhas.
        </p>

        <div className="hero__cta-group">
          <button
            type="button"
            className="btn btn--outline btn--large"
            id="SaberMais"
            style={{ borderWidth: 1 }}
            onClick={showResearchAreas}
          >
            Conheça as Nossas Áreas
          </button>
        </div>

        <div className="hero__gallery">
          <div className="carousel" id="heroCarousel">
            <div className="carousel-inner">
              {slides.map((slide, index) => (
                <picture key={slide.src}>
                  <source srcSet={slide.webp} type="image/webp" />
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    className={`carousel-item ${index === currentSlide ? "active" : ""}`}
                    width={1050}
                    height={590}
                    priority={index === 0}
                  />
                </picture>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
