import { Search, Sparkles, TestTube, TrendingUp } from "lucide-react";

interface Step {
  id: string;
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: "discover",
    number: "01",
    icon: <Search className="h-5 w-5" />,
    title: "Погружаюсь в задачу",
    description:
      "Изучаю бизнес-контекст, целевую аудиторию и ограничения, чтобы найти самое эффективное решение.",
  },
  {
    id: "create",
    number: "02",
    icon: <Sparkles className="h-5 w-5" />,
    title: "Создаю с ИИ",
    description:
      "Сочетаю вайбкодинг и AI-инструменты, чтобы быстро создавать интерфейсы, код и контент.",
  },
  {
    id: "test",
    number: "03",
    icon: <TestTube className="h-5 w-5" />,
    title: "Тестирую и улучшаю",
    description:
      "Проверяю работу продукта на реальных сценариях, собираю обратную связь и довожу детали до ума.",
  },
  {
    id: "launch",
    number: "04",
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Запускаю и масштабирую",
    description:
      "Вывожу продукт в продакшн и помогаю наращивать функциональность по мере роста бизнеса.",
  },
];

export function HowItWorks() {
  return (
    <section id="process" className="w-full bg-card py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 md:mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Как я работаю
          </h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            Прозрачный процесс от задачи до запущенного продукта.
          </p>
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-0 right-0 top-[2.75rem] h-px bg-brand-soft" />

            <div className="grid grid-cols-4 gap-8">
              {steps.map((step) => (
                <div key={step.id} className="relative flex flex-col">
                  {/* Step number + icon */}
                  <div className="relative z-10 mb-6 flex items-center gap-3">
                    <span className="text-3xl font-bold text-brand/30">
                      {step.number}
                    </span>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground shadow-soft">
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-brand-soft" />

            <div className="space-y-8">
              {steps.map((step) => (
                <div key={step.id} className="relative flex gap-5">
                  {/* Icon + number */}
                  <div className="relative z-10 flex shrink-0 flex-col items-center gap-2">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-brand text-brand-foreground shadow-soft">
                      {step.icon}
                    </div>
                    <span className="text-xs font-bold text-brand/50">
                      {step.number}
                    </span>
                  </div>


                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
