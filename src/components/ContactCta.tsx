export function ContactCta() {
  return (
    <section id="contact" className="px-6 pb-28 pt-16">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-card px-8 py-16 text-center md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,var(--brand),transparent_60%)] opacity-25"
        />
        <div className="relative z-10">
          <span className="text-[13px] font-semibold uppercase tracking-[0.15em] text-cyan">
            Давайте работать вместе
          </span>
          <h2 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-tight">
            Есть проект? Напишите мне
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Обсудим задачу, сроки и бюджет. Отвечаю в течение дня в рабочие часы.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="https://t.me/example"
              className="gradient-brand inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
            >
              ✈️ Написать в Telegram
            </a>
            <a
              href="mailto:hello@example.com"
              className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-7 py-3.5 text-[15px] font-semibold text-foreground transition-transform hover:-translate-y-0.5 hover:bg-accent"
            >
              ✉️ Отправить Email
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
