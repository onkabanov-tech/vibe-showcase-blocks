import studyflowPreview from "../assets/studyflow-preview.png.asset.json";
import neuroanalystPreview from "../assets/neuroanalyst-preview.png.asset.json";
import launchproPreview from "../assets/launchpro-preview.png.asset.json";

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  preview: { url: string };
}

const projects: Project[] = [
  {
    id: "studyflow",
    title: "StudyFlow",
    description:
      "AI-платформа для персонализированного обучения, которая строит адаптивные учебные планы и помогает учиться быстрее.",
    tags: ["React", "TypeScript", "OpenAI", "Tailwind CSS"],
    preview: studyflowPreview,
  },
  {
    id: "neuroanalyst",
    title: "НейроАналитик",
    description:
      "AI-сервис для анализа данных: автоматическая визуализация, прогнозирование и генерация инсайтов для бизнеса.",
    tags: ["Python", "FastAPI", "LangChain", "Recharts"],
    preview: neuroanalystPreview,
  },
  {
    id: "launchpro",
    title: "LaunchPro",
    description:
      "Лендинг для продукта с конверсионным дизайном, анимациями и быстрой загрузкой для запуска нового сервиса.",
    tags: ["Next", "Framer Motion", "Figma", "Vercel"],
    preview: launchproPreview,
  },
];

export function FeaturedProjects() {
  return (
    <section id="projects" className="w-full bg-card py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 md:mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Избранные проекты
          </h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            Работы, созданные с помощью AI-инструментов и вайбкодинга.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-soft transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={project.preview.url}
                  alt={`Превью проекта ${project.title}`}
                  width={1024}
                  height={768}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="text-xl font-semibold text-card-foreground">
                  {project.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

  );
}
