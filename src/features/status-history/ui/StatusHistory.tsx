/* eslint-disable @typescript-eslint/no-unused-vars -- заготовка упражнения 2.3 (exercises/03): setStatusFilter/filter/options станут использоваться после того, как вы достроите селект фильтра */
import React from "react";
import { useGate, useStore } from "effector-react";
import { Button } from "shared/ui";
import {
  StatusHistoryGate,
  refreshHistory,
  $visibleStatuses,
  $historyLoading,
  $statusFilter,
  $statusOptions,
  setStatusFilter,
} from "../model";

export const StatusHistory: React.FC = () => {
  useGate(StatusHistoryGate);

  const visible = useStore($visibleStatuses);
  const loading = useStore($historyLoading);
  const filter = useStore($statusFilter);
  const options = useStore($statusOptions);

  return (
    <section className="card">
      <div className="row">
        <h2>Статусы</h2>
        <div className="row" style={{ marginBottom: 0 }}>
          {/* TODO (упражнение 2.3): добавь <select> с $statusOptions + "Все"
              (value={filter}, onChange — setStatusFilter), рядом с кнопкой */}
          <Button onClick={() => refreshHistory()} disabled={loading}>
            {loading ? "Загрузка…" : "Обновить"}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="muted">Загружаем статусы…</p>
      ) : visible.length === 0 ? (
        <p className="muted">Ничего не найдено</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Статус</th>
              <th>Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s, i) => (
              <tr key={i}>
                <td>{s.date}</td>
                <td>{s.status}</td>
                <td>{s.comment || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};
