/**
 * Экспорт фичи.
 *
 * Gate создаётся в модели (createGate), а компонент открывает его
 * через useGate (как страницы в web-credit-management: useGate(XGate, {...})).
 * В v22 <XGate /> в JSX рендерит null — gate это сигнал и носитель
 * состояния, а не обёртка контента; страница рендерит сам компонент.
 */
export { CreditFormGate } from "../model";
export { CreditForm } from "./CreditForm";
