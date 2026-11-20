/**
 * Общие типы домена.
 * Аналог: shared/api/…/data-contracts в web-credit-management
 * (там типы генерируются из OpenAPI, здесь — написаны вручную).
 */

/** Заёмщик */
export interface Client {
  id: number;
  fio: string;
  monthlyIncome: number;
}

/** Кредитный продукт (аналог CreditDetail из web_product_info/Credit) */
export interface CreditProduct {
  id: string;
  name: string;
  /** Годовая ставка, % */
  rate: number;
  minAmount: number;
  maxAmount: number;
  maxTermMonths: number;
}

/** Данные для расчёта/отправки заявки */
export interface SendClaimPayload {
  amount: number;
  term: number;
  rate: number;
}

/** Результат расчёта графика платежей */
export interface PaymentSchedule {
  payment: number;
  overpayment: number;
  total: number;
}

/** Результат приёма заявки */
export interface SendClaimResult {
  claimId: string;
  date: string;
}

/** Смена статуса заявки (аналог истории статусов ПКС) */
export interface ClaimStatus {
  date: string;
  status: string;
  comment: string;
}
