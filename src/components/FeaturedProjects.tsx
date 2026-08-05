const projects = [
  {
    id: "01",
    tag: "Fintech · Mobile",
    title: "NeoBank — мобильный банк",
    description:
      "Редизайн приложения для 2 млн пользователей. Конверсия в открытие счёта выросла на 38%.",
    gradient: "gradient-brand",
  },
  {
    id: "02",
    tag: "SaaS · Web",
    title: "Taskly — система управления",
    description:
      "Дизайн-система и ключевые экраны B2B-платформы. Сократили время онбординга в 2 раза.",
    gradient: "bg-[linear-gradient(135deg,oklch(0.65_0.22_18),oklch(0.78_0.16_60))]",
  },
  {
    id: "03",
    tag: "E-commerce · UX",
    title: "GreenMarket — маркетплейс",
    description:
      "UX-аудит и редизайн checkout-пути. Средний чек вырос на 22%, отказы в корзине снизились на 41%.",
    gradient: "bg-[linear-gradient(135deg,oklch(0.8_0.13_205),oklch(0.72_0.16_162))]",
  },
];

export function FeaturedProjects() {
  return (
    <section id="projects" className="px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <span className="text-[13px] font-semibold uppercase tracking-[0.15em] text-cyan">
          Избранные проекты
        </span>
        <h2 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-extrabold leading-tight tracking-tight">
          Кейсы, которыми горжусь
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          От первых набросков до релиза — каждый проект это история о том, как
          дизайн решает реальные бизнес-задачи.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="group overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1.5 hover:border-brand/40"
            >
              <div
                className={`flex h-56 items-center justify-center text-6xl font-extrabold text-primary-foreground/20 ${project.gradient}`}
              >
                {project.id}
              </div>
              <div className="p-6">
                <span className="text-xs uppercase tracking-[0.1em] text-cyan">
                  {project.tag}
                </span>
                <h3 className="mt-3 text-xl font-bold text-card-foreground">
                  {project.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
