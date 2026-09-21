// Совсем небольшой роутер: сопоставляет метод+путь с обработчиком,
// поддерживает параметры вида /bookings/:id. Без внешних зависимостей.
export function createRouter() {
  const routes = [];

  function add(method, pattern, handler) {
    const keys = [];
    const regexSource = pattern
      .split("/")
      .map((segment) => {
        if (segment.startsWith(":")) {
          keys.push(segment.slice(1));
          return "([^/]+)";
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");
    routes.push({ method, regex: new RegExp(`^${regexSource}$`), keys, handler });
  }

  return {
    get: (pattern, handler) => add("GET", pattern, handler),
    post: (pattern, handler) => add("POST", pattern, handler),
    patch: (pattern, handler) => add("PATCH", pattern, handler),
    delete: (pattern, handler) => add("DELETE", pattern, handler),
    match(method, pathname) {
      for (const route of routes) {
        if (route.method !== method) continue;
        const match = route.regex.exec(pathname);
        if (!match) continue;
        const params = {};
        route.keys.forEach((key, i) => {
          params[key] = decodeURIComponent(match[i + 1]);
        });
        return { handler: route.handler, params };
      }
      return null;
    },
  };
}
