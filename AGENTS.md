<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Booking backend (`server/`, `prototypes/booking-prototype/`)

Отдельный от лендинга бэкенд-каркас для прототипа записи на консультацию.
Прежде чем менять что-то в `server/` или в схеме БД, прочитайте:

- `docs/db-schema.md` — дизайн схемы БД (таблицы, поля, индексы, спорные решения).
- `docs/db-notes.md` — как это реализовано на практике: с какими проблемами
  столкнулись и как их решили, какой драйвер SQLite используется и почему,
  какая версия Node.js нужна. Дополняйте этот файл по ходу работы, не
  создавайте новый документ под ту же тему.
