import { combine, createEffect, createEvent, createStore, restore, sample } from "effector";
import { createGate } from "effector-react";
import { ClaimStatus } from "shared/types";

/**
 * Модель «История статусов заявки»
 * (аналог features/insurance-claim-status-history в web-credit-management).
 */

export const StatusHistoryGate = createGate();

const MOCK_STATUSES: ClaimStatus[] = [
  { date: "2025-11-01", status: "Создана", comment: "Заявка создана в системе" },
  { date: "2025-11-02", status: "На проверке", comment: "Проверена комплектность документов" },
  { date: "2025-11-03", status: "Комитет", comment: "На рассмотрении кредитным комитетом" },
];

/** Фейковый «запрос к API» */
export const fxLoadHistory = createEffect(() =>
  new Promise<ClaimStatus[]>((resolve) => setTimeout(() => resolve(MOCK_STATUSES), 700))
);

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

export const $statusOptions = $statuses.map(
  (list) => Array.from(new Set(list.map((s) => s.status)))
);

export const $visibleStatuses = combine($statuses, $statusFilter, (list, filter) =>
  filter === "all" ? list : list.filter((s) => s.status === filter)
);
