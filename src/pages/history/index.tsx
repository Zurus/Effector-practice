import React from "react";
import { StatusHistory } from "features/status-history";
import { PageLayout } from "shared/ui";

/**
 * Страница истории статусов заявки
 * (аналог features/insurance-claim-status-history в web-credit-management).
 *
 * Компонент рендерится напрямую: gate он откроет сам через useGate.
 */
export const HistoryPage: React.FC = () => (
  <PageLayout title="История статусов" subtitle="Смены статуса заявки на кредит">
    <StatusHistory />
  </PageLayout>
);
