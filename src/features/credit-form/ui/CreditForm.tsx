import React from "react";
import { useGate, useStore } from "effector-react";
import { $creditProducts, $selectedProduct, selectCreditProduct } from "entities/credit";
import { formatMoney } from "shared/lib";
import { Alert, Button } from "shared/ui";
import {
  changeAmount,
  changeTerm,
  sendClaim,
  $amount,
  $term,
  $errors,
  $schedule,
  $scheduleLoading,
  $claimResult,
  $claimError,
  $sending,
  CreditFormGate,
} from "../model";

/**
 * Компонент формы. Только UI:
 * useGate — «подключает» компонент к gate,
 * useStore — читает состояние, события — шлют действия.
 * Никакой бизнес-логики здесь нет (и не должно быть).
 */
export const CreditForm: React.FC = () => {
  useGate(CreditFormGate);

  const products = useStore($creditProducts);
  const product = useStore($selectedProduct);
  const amount = useStore($amount);
  const term = useStore($term);
  const errors = useStore($errors);
  const schedule = useStore($schedule);
  const scheduleLoading = useStore($scheduleLoading);
  const sending = useStore($sending);
  const claimResult = useStore($claimResult);
  const claimError = useStore($claimError);

  return (
    <section className="card">
      <h2>Параметры заявки</h2>

      <label className="field">
        <span>Продукт</span>
        <select
          value={product?.id ?? ""}
          onChange={(e) => selectCreditProduct(e.target.value)}
          disabled={!products.length}
        >
          {!products.length && <option value="">Загрузка…</option>}
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.rate}%
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Сумма, ₽</span>
        <input
          type="number"
          step="1000"
          value={amount}
          onChange={(e) => changeAmount(Number(e.target.value))}
        />
      </label>

      <label className="field">
        <span>Срок, месяцев</span>
        {/* TODO (упражнение 2.2): замени input на <select> с вариантами из TERM_OPTIONS */}
        <input
          type="number"
          step="1"
          value={term}
          onChange={(e) => changeTerm(Number(e.target.value))}
        />
      </label>

      {errors.length > 0 && (
        <Alert kind="error">
          {errors.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </Alert>
      )}

      <div className="row">
        <span className="muted">
          {scheduleLoading
            ? "Пересчёт…"
            : schedule
              ? `Платёж: ${formatMoney(schedule.payment)}/мес`
              : "График ещё не рассчитан"}
        </span>
        <Button onClick={() => sendClaim()} disabled={sending || errors.length > 0}>
          {sending ? "Отправляем…" : "Отправить заявку"}
        </Button>
      </div>

      {claimResult && (
        <Alert kind="success">
          Заявка {claimResult.claimId} принята ({claimResult.date})
        </Alert>
      )}
      {claimError && <Alert kind="error">{claimError}</Alert>}
    </section>
  );
};
