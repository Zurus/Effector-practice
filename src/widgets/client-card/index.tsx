import React from "react";
import { useStore } from "effector-react";
import { $client } from "entities/client";
import { formatMoney } from "shared/lib";

/**
 * Мелкий виджет: карточка клиента.
 * Пока $client пустой — показывает заглушку (аналог Skeleton из efr-design-system).
 */
export const ClientCard: React.FC = () => {
  const client = useStore($client);

  return (
    <section className="card">
      {!client ? (
        <p className="muted">Загружаем данные клиента…</p>
      ) : (
        <>
          <span className="client-card__fio">{client.fio}</span>
          <span className="muted">Доход: {formatMoney(client.monthlyIncome)}/мес</span>
        </>
      )}
    </section>
  );
};
