import { combine } from "effector";
import { createGate } from "effector-react";
import { $schedule } from "features/credit-form";
import { $client } from "entities/client";
import { CRITICAL_DTI, MAX_DTI } from "shared/constants";

/**
 * Своя модель виджета: производные сторы, которых нет ни в одной сущности.
 */

export const CreditSummaryGate = createGate();

/** ПДН — доля платежа в доходе, % (аналог расчёта ДТИ в оригинале) */
export const $dti = combine($schedule, $client, (schedule, client) => {
  if (!schedule || !client?.monthlyIncome) return null;
  return Math.round((schedule.payment / client.monthlyIncome) * 1000) / 10;
});

/** ПДН в пределах нормы */
export const $dtiOk = $dti.map((dti) => dti !== null && dti <= MAX_DTI);

// TODO (упражнение 2.4): добавь $dtiCritical = $dti.map((d) => d !== null && d > CRITICAL_DTI)
// и красное предупреждение «ПДН выше критического» в UI виджета.
