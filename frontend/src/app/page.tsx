import { ContactSection } from "@/components/sections/ContactSection";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { MapEventsSection } from "@/components/sections/MapEventsSection";
import { NewsFeed } from "@/components/sections/NewsFeed";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { Opportunities } from "@/components/sections/Opportunities";
import { OpportunitiesChart } from "@/components/sections/OpportunitiesChart";
import { Partners } from "@/components/sections/Partners";
import { ResearchAreas } from "@/components/sections/ResearchAreas";
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
