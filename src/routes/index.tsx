import { createFileRoute } from "@tanstack/react-router";

import { FeaturedProjects } from "@/components/FeaturedProjects";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { WhatIDo } from "@/components/WhatIDo";

const title = "Вайбкодер — запуск продуктов с ИИ за недели";
const description =
  "Портфолио специалиста по вайбкодингу: MVP за неделю, AI-автоматизация, UI/UX и интеграции. Проекты StudyFlow, НейроАналитик и LaunchPro.";

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
    <main className="min-h-screen bg-background">
      <Hero />
      <WhatIDo />
      <FeaturedProjects />
      <HowItWorks />
    </main>
  );
}



