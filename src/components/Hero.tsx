export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden px-6 pb-20 pt-32 md:pt-40"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 h-[600px] w-[600px] rounded-full bg-brand/25 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-cyan/20 blur-[120px]"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_12px_currentColor] text-success" />
          Открыт для новых проектов · Июль 2026
        </span>

        <h1 className="max-w-4xl text-[clamp(2.5rem,7vw,5rem)] font-extrabold leading-[1.05] tracking-tight">
          Создаю цифровые продукты,
          <br />
          <span className="gradient-text">которые любят пользователи</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-xl">
          Меня зовут Алексей — я продуктовый дизайнер с 7-летним опытом. Помогаю
          стартапам и компаниям превращать сложные идеи в понятные, красивые и
          работающие интерфейсы.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#projects"
            className="gradient-brand inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Смотреть работы →
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-7 py-3.5 text-[15px] font-semibold text-foreground transition-transform hover:-translate-y-0.5 hover:bg-accent"
          >
            Связаться со мной
          </a>
        </div>
      </div>
    </section>
  );
}
