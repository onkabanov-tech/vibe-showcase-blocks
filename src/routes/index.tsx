import { createFileRoute } from "@tanstack/react-router";

import { ContactCta } from "@/components/ContactCta";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { WhatIDo } from "@/components/WhatIDo";

const title = "Алексей Морозов — продуктовый дизайнер";
const description =
  "Продуктовый дизайнер с 7-летним опытом: UX/UI, дизайн-системы, исследования. Кейсы NeoBank, Taskly и GreenMarket.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://vibe-showcase-blocks.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://vibe-showcase-blocks.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <FeaturedProjects />
        <WhatIDo />
        <HowItWorks />
        <ContactCta />
      </main>
      <SiteFooter />
    </div>
  );
}
