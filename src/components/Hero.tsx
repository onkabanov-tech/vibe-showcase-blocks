import { ArrowRight, Sparkles } from "lucide-react";

const stats = [
  { id: "speed", value: "5–7 дней", label: "от идеи до MVP" },
  { id: "projects", value: "20+", label: "запущенных продуктов" },
  { id: "hours", value: "10+ часов", label: "экономии в неделю" },
];

export function Hero() {
  return (
    <section className="w-full bg-brand text-brand-foreground">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          Вайбкодинг и AI-разработка
        </span>

        <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Запускаю продукты с ИИ за недели, а не месяцы
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-foreground/85 md:text-lg">
          Собираю MVP, автоматизирую рутину и проектирую интерфейсы с помощью
          AI-инструментов. Вы получаете рабочий продукт, а не бесконечную
          разработку.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#services"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cta px-6 py-3.5 text-base font-semibold text-cta-foreground shadow-soft transition-transform hover:-translate-y-0.5 sm:w-auto"
          >
            Обсудить проект
            <ArrowRight className="h-4 w-4 shrink-0" />
          </a>
          <a
            href="#process"
            className="inline-flex w-full items-center justify-center rounded-xl border border-brand-foreground/30 px-6 py-3.5 text-base font-semibold text-brand-foreground transition-colors hover:bg-brand-foreground/10 sm:w-auto"
          >
            Как я работаю
          </a>
        </div>

        <dl className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="rounded-2xl bg-card px-5 py-4 text-card-foreground shadow-soft"
            >
              <dt className="text-xl font-bold text-brand">{stat.value}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
