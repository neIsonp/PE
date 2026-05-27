import Image from "next/image";
import { fallbackNews } from "@/data/home";

const tagClasses: Record<string, string> = {
  Evento: "news__tag--evento",
  Notícia: "news__tag--noticia",
  Publicação: "news__tag--publicacao"
};

export function NewsFeed() {
  return (
    <section id="news-feed" className="section section--alt" aria-labelledby="noticias-titulo">
      <div className="container">
        <h2 className="section__title" id="noticias-titulo">
          Notícias Recentes
        </h2>
        <p className="section__description">Acompanhe as últimas novidades em saúde e tecnologia.</p>

        <div id="news-container" className="news">
          {fallbackNews.map((news) => (
            <article className="news__card" key={news.title}>
              <div className="news__image-wrapper">
                <Image
                  src={news.image}
                  alt=""
                  className="news__image"
                  width={480}
                  height={280}
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
              <div className="news__content-wrapper">
                <div className="news__date">
                  <i className="fi fi-rr-calendar" />
                  {news.date}
                </div>
                <div className="news__content">
                  <span className={`news__tag ${tagClasses[news.tag]}`}>{news.tag}</span>
                  <h3 className="news__title">{news.title}</h3>
                  <p className="news__excerpt">{news.excerpt}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
