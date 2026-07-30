import { createFileRoute } from "@tanstack/react-router";

import { FeaturedProjects } from "@/components/FeaturedProjects";
import { WhatIDo } from "@/components/WhatIDo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Избранные проекты — Вайбкодинг" },
      {
        name: "description",
        content:
          "Портфолио избранных проектов специалиста по вайбкодингу: StudyFlow, НейроАналитик и LaunchPro.",
      },
      {
        property: "og:title",
        content: "Избранные проекты — Вайбкодинг",
      },
      {
        property: "og:description",
        content:
          "Портфолио избранных проектов специалиста по вайбкодингу: StudyFlow, НейроАналитик и LaunchPro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <WhatIDo />
      <FeaturedProjects />
    </main>
  );
}

