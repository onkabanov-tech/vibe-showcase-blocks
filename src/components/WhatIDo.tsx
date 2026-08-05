const services = [
  {
    id: "uiux",
    icon: "🎨",
    title: "UX/UI дизайн",
    description:
      "Проектирование интерфейсов сайтов и мобильных приложений с фокусом на пользовательский опыт.",
  },
  {
    id: "systems",
    icon: "📐",
    title: "Дизайн-системы",
    description:
      "Создание масштабируемых компонентов и гайдлайнов для команд продукта и разработки.",
  },
  {
    id: "research",
    icon: "🔍",
    title: "UX-исследования",
    description:
      "CustDev, юзабилити-тесты, аналитика. Помогаю принимать решения на основе данных, а не догадок.",
  },
  {
    id: "product",
    icon: "🚀",
    title: "Продуктовый дизайн",
    description:
      "Полный цикл работы над продуктом: от стратегии и прототипов до запуска и развития.",
  },
];

export function WhatIDo() {
  return (
    <section id="services" className="px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <span className="text-[13px] font-semibold uppercase tracking-[0.15em] text-cyan">
          Что я делаю
        </span>
        <h2 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-extrabold leading-tight tracking-tight">
          Экспертиза и услуги
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Работаю на стыке дизайна, продукта и бизнеса. Беру задачу от
          исследования до передачи в разработку.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.id}
              className="rounded-3xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:bg-accent"
            >
              <div className="gradient-brand grid h-14 w-14 place-items-center rounded-2xl text-2xl">
                {service.icon}
              </div>
              <h3 className="mt-5 text-xl font-bold text-card-foreground">
                {service.title}
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
