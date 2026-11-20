/**
 * Отладка: `createWatch` на ключевых юнитах приложения (только dev).
 *
 * Включить без правки кода:
 *   git-bash / linux:  VITE_DEBUG=1 npm run dev
 *   windows cmd:       set VITE_DEBUG=1 && npm run dev
 * Работает только в dev-сборке (`import.meta.env.DEV`), в prod — тишина.
 *
 * Почему файл в `app/`, а не в `shared/`: слойность — `shared` не видит
 * `features` (pages → features/widgets → entities → shared), а смотреть
 * хочется и сторы фич. `app/` — композиционный корень, он может
 * импортировать всё.
 *
 * Хочешь смотреть другое — дописывай `createWatch` ниже (или пиши своё
 * прямо в коде — курс, задача 5.1).
 */
import { createWatch } from "effector";
import { $activePage } from "./model";
import { $client } from "entities/client";
import { $creditProducts, $selectedProductId } from "entities/credit";
import { $amount, $errors, $schedule, $scheduleLoading, $sending } from "features/credit-form";

/** Подключает отладку; без флага ничего не делает (нет watchers).
 * Флаг читается при вызове — можно поставить `VITE_DEBUG` в окружении dev-сервера. */
export const initDebug = (): void => {
  const debug = import.meta.env.DEV && Boolean(import.meta.env.VITE_DEBUG);
  if (!debug) return;
  console.log("[debug] createWatch включён (VITE_DEBUG=1)");

  createWatch({ unit: $activePage, fn: (page) => console.log("[debug] $activePage →", page) });
  createWatch({ unit: $client, fn: (client) => console.log("[debug] $client →", client?.fio ?? null) });
  createWatch({ unit: $creditProducts, fn: (list) =>
    console.log("[debug] $creditProducts →", list.length, "продуктов"),
  });
  createWatch({ unit: $selectedProductId, fn: (id) => console.log("[debug] $selectedProductId →", id) });
  createWatch({ unit: $amount, fn: (amount) => console.log("[debug] $amount →", amount) });
  createWatch({ unit: $errors, fn: (errors) => console.log("[debug] $errors →", [...errors]) });
  createWatch({ unit: $schedule, fn: (schedule) => console.log("[debug] $schedule →", schedule) });
  createWatch({ unit: $scheduleLoading, fn: (loading) => console.log("[debug] $scheduleLoading →", loading) });
  createWatch({ unit: $sending, fn: (sending) => console.log("[debug] $sending →", sending) });
};
