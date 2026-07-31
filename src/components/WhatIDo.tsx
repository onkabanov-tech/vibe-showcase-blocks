import { Bot, Palette, Puzzle, Rocket } from "lucide-react";

interface Service {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  result: string;
}

const services: Service[] = [
  {
    id: "mvp",
    icon: <Rocket className="h-6 w-6" />,
    title: "MVP за неделю",
    description:
      "Создаю работающий прототип продукта с нуля: от идеи до выложенного лендинга или приложения за 5–7 дней.",
    result: "Готовый продукт через неделю вместо месяцев разработки.",
  },
  {
    id: "ai-automation",
    icon: <Bot className="h-6 w-6" />,
    title: "AI-автоматизация",
    description:
      "Настраиваю AI-агентов и автоматические пайплайны, которые берут на себя рутину и ускоряют бизнес-процессы.",
    result: "Экономия до 10+ часов в неделю на ручных операциях.",
  },
  {
    id: "ui-ux",
    icon: <Palette className="h-6 w-6" />,
    title: "UI/UX с вайбкодингом",
    description:
      "Проектирую интерфейсы с помощью AI-инструментов: быстро, стильно и с упором на поведение пользователя.",
    result: "Современный дизайн без долгих согласований.",
  },
  {
    id: "integrations",
    icon: <Puzzle className="h-6 w-6" />,
    title: "Интеграции",
    description:
      "Соединяю сервисы, API и базы данных в единый поток, чтобы всё работало автоматически и без сбоев.",
    result: "Единая экосистема вместо разрозненных инструментов.",
  },
];

export function WhatIDo() {
  return (
    <section id="services" className="w-full bg-background py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 md:mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Что я делаю
          </h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            Услуги, которые помогают запускать продукты, автоматизировать рутину
            и создавать удобные интерфейсы.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.id}
              className="group flex flex-col rounded-2xl bg-card p-6 shadow-soft transition-transform hover:-translate-y-1"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                {service.icon}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-card-foreground">
                {service.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
              <div className="mt-5 rounded-xl bg-brand-soft p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                  Результат
                </span>
                <p className="mt-1 text-sm font-medium text-card-foreground">
                  {service.result}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

  );
}
