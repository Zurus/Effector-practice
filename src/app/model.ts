import { createEvent, createStore } from "effector";

/**
 * Состояние приложения: какая страница открыта.
 *
 * Аналог маршрутизации в web-credit-management (react-router + RouteItem),
 * но упрощён до одного стора: страница — это просто значение.
 */

export type PageKey = "claims" | "history";

/** Событие-действие: «открыть страницу» */
export const selectPage = createEvent<PageKey>();

/** Стор: активная страница */
export const $activePage = createStore<PageKey>("claims").on(selectPage, (_, key) => key);

// TODO (упражнение 2.5): добавить страницу "about" —
// расширь PageKey, добавь маршрут в pages/index.ts и компонент в pages/about.
