import React from "react";
import { ClientCard } from "widgets/client-card";
import { CreditForm } from "features/credit-form";
import { CreditSummary } from "widgets/credit-summary";
import { PageLayout } from "shared/ui";

/**
 * Страница заявки: тонкая обёртка, которая склеивает
 * виджеты и фичи (аналог страниц из src/pages/claims/*).
 *
 * Важно: в effector-react v22 <XGate /> НЕ рендерит детей — gate это
 * только «сигнал: компонент на экране» + носитель состояния. Поэтому
 * страница рендерит сами компоненты (CreditForm и CreditSummary),
 * а они открывают свои gate через useGate (как страницы в
 * web-credit-management: useGate(XGate, {...}) прямо в компоненте страницы).
 */
export const ClaimsPage: React.FC = () => (
  <PageLayout title="Заявка на кредит" subtitle="Заполните параметры — график пересчитывается автоматически">
    <ClientCard />
    <div className="grid">
      <CreditForm />
      <CreditSummary />
    </div>
  </PageLayout>
);
