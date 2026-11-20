import { combine, createEffect, createEvent, createStore, restore, sample } from "effector";
import { createGate } from "effector-react";
import { fakeApi } from "shared/fake-api";

/**
 * Модель «История статусов заявки»
 * (аналог features/insurance-claim-status-history в web-credit-management).
 */

export const StatusHistoryGate = createGate();

/** «Запрос к API»: история статусов (реализация — shared/fake-api) */
export const fxLoadHistory = createEffect(() => fakeApi.getClaimStatuses());

export const $statuses = restore(fxLoadHistory, []);
export const $historyLoading = fxLoadHistory.pending;

// Открытие gate → первичная загрузка; кнопка «Обновить» → повторный запрос
sample({ clock: StatusHistoryGate.open, target: fxLoadHistory });
export const refreshHistory = createEvent();
sample({ clock: refreshHistory, target: fxLoadHistory });

// --- Фильтр по статусу --------------------------------------------------------
// Модель уже готова. UI (select) нужно достроить в упражнении 3.

export const setStatusFilter = createEvent<string>();
export const $statusFilter = createStore<string>("all");

export const $statusOptions = $statuses.map((list) =>
  Array.from(new Set(list.map((s) => s.status))),
);

export const $visibleStatuses = combine($statuses, $statusFilter, (list, filter) =>
  filter === "all" ? list : list.filter((s) => s.status === filter),
);
