// web/js/header.js
//
// Общая шапка клиентской зоны (личный кабинет / профиль / уведомления /
// служебные страницы) — собрана в одном месте, чтобы эти страницы не
// повторяли одну и ту же разметку каждая у себя.
//
// Состав взят из двух источников:
//  1. Client Account Prototype.dc.html (папка «Прототип») — сам набор
//     элементов: бренд, вкладки «Мои записи / Профиль / Уведомления»
//     с бейджем непрочитанных, ссылка на служебные страницы, «Выйти».
//  2. docs/ui-map.md, колонка «Переходы» для этих экранов — те же самые
//     переходы прописаны там как общая навигация (↔ Кабинет, ↔ Профиль,
//     ↔ Уведомления, → Служебные страницы, → Лендинг по «Выйти»).
// (Сам файл «Booking Flow Diagram.dc.html» — тот, что в проекте называют
// картой связей экранов, — про кабинет ничего не говорит: он снят до
// того, как кабинет появился, и описывает только Лендинг/Запись/
// Подтверждение/Админку. Поэтому источник №2 — реально ui-map.md.)
//
// Использование на странице:
//   <div id="client-header" data-active="cabinet"></div>
//   <script type="module" src="./js/header.js"></script>
// data-active — один из "cabinet" | "profile" | "notifications" —
// подсвечивает соответствующую вкладку как текущую.

import { getMasters, logoutClient } from "./api.js";
import { getSession, clearSession } from "./session.js";

const NAV_ITEMS = [
  { key: "cabinet", label: "Мои записи", href: "cabinet.html" },
  { key: "profile", label: "Профиль", href: "profile.html" },
  { key: "notifications", label: "Уведомления", href: "notifications.html" },
];

function injectStyles() {
  if (document.getElementById("client-header-styles")) return;
  const style = document.createElement("style");
  style.id = "client-header-styles";
  // Цвета и шрифты — только переменные из tokens.css (правило 4).
  // Размеры — те же литеральные значения, что уже употреблены на
  // лендинге и на экранах входа, ничего нового не вводится.
  style.textContent = `
    .client-header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 40px;
      background: var(--color-bg);
      border-bottom: 1px solid var(--color-border);
      flex-wrap: wrap;
      gap: 16px;
    }
    .client-header .brand {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 20px;
      color: var(--color-button);
      letter-spacing: 0.05em;
    }
    .client-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    .client-nav a {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-secondary);
      padding-bottom: 4px;
      border-bottom: 2px solid transparent;
    }
    .client-nav a.active {
      color: var(--color-button);
      border-bottom-color: var(--color-button);
    }
    .client-nav a.muted-link {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
    }
    .nav-badge {
      display: inline-flex;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      margin-left: 6px;
      border-radius: 999px;
      background: var(--color-button-light);
      color: var(--color-bg);
      font-size: 11px;
      font-weight: 700;
      align-items: center;
      justify-content: center;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .header-actions .client-name {
      font-size: 14px;
      font-weight: 600;
    }
    .header-actions .muted-link {
      font-size: 13px;
      color: var(--color-text-secondary);
    }
    .header-actions .btn-header {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--gradient-button);
      color: var(--color-bg);
    }
  `;
  document.head.appendChild(style);
}

export async function mountHeader({ active, container, unreadCount = 0 } = {}) {
  injectStyles();
  const mountPoint = container ?? document.getElementById("client-header");
  if (!mountPoint) return;

  const navHtml = NAV_ITEMS.map((item) => {
    const isActive = item.key === active;
    const badge =
      item.key === "notifications" && unreadCount > 0
        ? `<span class="nav-badge">${unreadCount}</span>`
        : "";
    return `<a href="${item.href}" class="${isActive ? "active" : ""}">${item.label}${badge}</a>`;
  }).join("");

  mountPoint.innerHTML = `
    <header class="client-header">
      <a class="brand" href="index.html" id="header-brand">…</a>
      <div class="client-nav">
        ${navHtml}
        <a href="service.html" class="muted-link">Служебные страницы</a>
      </div>
      <div class="header-actions" id="header-actions"></div>
    </header>
  `;

  // Бренд — имя мастера (владельца бизнеса), берём из API так же, как
  // на лендинге. Это не то же самое, что имя вошедшего клиента ниже.
  getMasters()
    .then((masters) => {
      const activeMaster = masters.find((m) => m.isActive) ?? masters[0];
      mountPoint.querySelector("#header-brand").textContent = activeMaster ? activeMaster.name : "—";
    })
    .catch(() => {
      mountPoint.querySelector("#header-brand").textContent = "—";
    });

  // Состояние входа и имя клиента — из локально сохранённой сессии
  // (см. web/js/session.js): отдельного эндпоинта "текущий клиент" в API
  // нет, а данные клиента приходят только один раз, при входе/регистрации
  // (см. docs/ui-map.md, раздел «Профиль» — то же самое решение).
  const stored = getSession();
  const isLoggedIn = !!stored?.session?.token && new Date(stored.session.expiresAt) > new Date();
  const actions = mountPoint.querySelector("#header-actions");

  if (isLoggedIn) {
    actions.innerHTML = `
      <span class="client-name">${stored.client?.name ?? "Клиент"}</span>
      <a href="#" id="logout-link" class="muted-link">Выйти</a>
    `;
    actions.querySelector("#logout-link").addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await logoutClient(stored.session.token);
      } catch {
        // сервер недоступен/токен уже недействителен — всё равно
        // выходим локально, чтобы клиент не застрял в кабинете
      }
      clearSession();
      window.location.href = "index.html";
    });
  } else {
    actions.innerHTML = `
      <a href="login.html" class="muted-link">Войти</a>
      <a href="register.html" class="btn-header">Регистрация</a>
    `;
  }
}

// Автомонтирование: страница просто кладёт <div id="client-header"> с
// data-active — и не пишет больше ничего.
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("client-header");
  if (container) {
    mountHeader({ active: container.dataset.active, container });
  }
});
