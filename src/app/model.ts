import { createEvent, createStore } from "effector";

/**
 * Состояние приложения: какая страница открыта.
 *
 * Аналог маршрутизации в web-credit-management (react-router + RouteItem),
 * но упрощён до одного стора: страница — это просто значение.
 *
 * Стор синхронизирован с location.hash (без роутера и новых зависимостей):
 * - навигация (selectPage) обновляет и стор, и hash;
 * - кнопка «назад»/«вперёд» и ручное редактирование URL меняют стор.
 * Значения hash совпадают с ключами: #claims, #history.
 */

export type PageKey = "claims" | "history";

const PAGE_KEYS: readonly PageKey[] = ["claims", "history"] as const;

/** Страница из location.hash; пустой/неизвестный hash — "claims" */
export const pageFromHash = (): PageKey => {
  if (typeof window === "undefined") return "claims";
  const hash = window.location.hash.replace(/^#\/?/, "");
  return (PAGE_KEYS as readonly string[]).includes(hash) ? (hash as PageKey) : "claims";
};

/** Событие-действие: «открыть страницу» (навигация из UI) */
export const selectPage = createEvent<PageKey>();

/** Стор: активная страница (инициализируется из hash) */
export const $activePage = createStore<PageKey>(pageFromHash()).on(selectPage, (_, key) => key);

/** Событие: браузер сам поменял hash (назад/вперёд, ручное редактирование URL) */
const hashChanged = createEvent();
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => hashChanged());
}
$activePage.on(hashChanged, () => pageFromHash());

// store → URL: при смене страницы синхронизируем hash
$activePage.watch((key) => {
  if (typeof window === "undefined") return;
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash !== key) window.location.hash = `#${key}`;
});

// TODO (упражнение 2.5): добавить страницу "about" —
// расширь PageKey (и PAGE_KEYS), добавь маршрут в pages/index.ts и компонент в pages/about.
