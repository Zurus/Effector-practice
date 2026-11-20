import React from "react";
import { useGate, useStore } from "effector-react";
import { $client } from "entities/client";
import { $schedule } from "features/credit-form";
import { formatFio, formatMoney } from "shared/lib";
import { CreditSummaryGate, $dti, $dtiOk } from "./model";

/**
 * Виджет «Сводка по заявке» (аналог src/widgets в web-credit-management):
 * составной блок, склеивающий данные из разных сущностей/фич.
 */
const CreditSummary: React.FC = () => {
  useGate(CreditSummaryGate);

  const client = useStore($client);
  const schedule = useStore($schedule);
  const dti = useStore($dti);
  const dtiOk = useStore($dtiOk);

  return (
    <section className="card">
      <h2>Сводка</h2>
      {!client ? (
        <p className="muted">Загружаем клиента…</p>
      ) : (
        <div className="kv">
          <div>
            <span>Клиент</span>
            <b>{formatFio(client.fio)}</b>
          </div>
          <div>
            <span>Доход</span>
            <b>{formatMoney(client.monthlyIncome)}/мес</b>
          </div>
          <div>
            <span>Платёж</span>
            <b>{schedule ? formatMoney(schedule.payment) : "—"}</b>
          </div>
          <div>
            <span>Переплата</span>
            <b>{schedule ? formatMoney(schedule.overpayment) : "—"}</b>
          </div>
          <div>
            <span>ПДН</span>
            <b className={dtiOk ? "ok" : "bad"}>{dti !== null ? `${dti}%` : "—"}</b>
          </div>
        </div>
      )}
    </section>
  );
};

export { CreditSummaryGate, CreditSummary };
