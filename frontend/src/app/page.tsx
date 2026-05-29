import { ContactSection } from "@/components/home/ContactSection";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { MapEventsSection } from "@/components/home/MapEventsSection";
import { NewsFeed } from "@/components/home/NewsFeed";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { Opportunities } from "@/components/home/Opportunities";
import { OpportunitiesChart } from "@/components/home/OpportunitiesChart";
import { Partners } from "@/components/home/Partners";
import { ResearchAreas } from "@/components/home/ResearchAreas";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

export default function HomePage() {
  return (
    <>
      <noscript>
        <div className="java-disabled">
          <p>
            <strong>Aviso:</strong> O JavaScript está desativado. Para uma experiência completa,
            por favor ative o JavaScript.
          </p>
        </div>
      </noscript>
      <Header active="home" />
      <main id="conteudo-principal">
        <Hero />
        <ResearchAreas />
        <NewsFeed />
        <Partners />
        <Opportunities />
        <OpportunitiesChart />
        <ContactSection />
        <NewsletterSection />
        <MapEventsSection />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
