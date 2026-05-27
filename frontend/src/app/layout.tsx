import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "@/styles/base/reset.css";
import "@/styles/base/typography.css";
import "@/styles/layout/header.css";
import "@/styles/layout/footer.css";
import "@/styles/components/buttons.css";
import "@/styles/components/forms.css";
import "@/styles/components/cards.css";
import "@/styles/sections/hero.css";
import "@/styles/sections/research.css";
import "@/styles/sections/partners.css";
import "@/styles/sections/opportunities.css";
import "@/styles/sections/news.css";
import "@/styles/sections/newsletter.css";
import "@/styles/sections/contact.css";
import "@/styles/sections/map-events.css";
import "@/styles/base/utilities.css";
import "@/styles/components/js-components.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "CACA | Centro Académico Clínico dos Açores",
  description:
    "Centro Académico Clínico dos Açores - investigação clínica, ensino e inovação em saúde nos Açores.",
  keywords: [
    "CACA",
    "saúde",
    "Açores",
    "investigação clínica",
    "telemedicina",
    "e-saúde",
    "universidade"
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn-uicons.flaticon.com/2.1.0/uicons-regular-rounded/css/uicons-regular-rounded.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
