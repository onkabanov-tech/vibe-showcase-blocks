const steps = [
  {
    id: "01",
    title: "Бриф и исследование",
    description:
      "Погружаюсь в бизнес-задачу, изучаю аудиторию, конкурентов и метрики. Формирую гипотезы.",
  },
  {
    id: "02",
    title: "Прототипирование",
    description:
      "Создаю wireframes и интерактивные прототипы. Проверяю логику до начала визуального дизайна.",
  },
  {
    id: "03",
    title: "Визуальный дизайн",
    description:
      "Прорабатываю UI, анимации, микро-взаимодействия. Согласовываем каждый экран итерациями.",
  },
  {
    id: "04",
    title: "Передача и запуск",
    description:
      "Готовлю спецификацию для разработки, сопровождаю внедрение и помогаю на этапе запуска.",
  },
];

export function HowItWorks() {
  return (
    <section id="process" className="px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        <span className="text-[13px] font-semibold uppercase tracking-[0.15em] text-cyan">
          Как я работаю
        </span>
        <h2 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-extrabold leading-tight tracking-tight">
          Прозрачный процесс
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Чёткие этапы, регулярная синхронизация и никаких сюрпризов. Вы всегда
          знаете, на каком этапе находится проект.
        </p>

        <ol className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li
              key={step.id}
              className="rounded-3xl border border-border bg-card px-7 py-8"
            >
              <span className="gradient-text block text-5xl font-extrabold leading-none">
                {step.id}
              </span>
              <h3 className="mt-4 text-xl font-bold text-card-foreground">
                {step.title}
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
