import {
  ClaimStatus,
  Client,
  CreditProduct,
  PaymentSchedule,
  SendClaimPayload,
  SendClaimResult,
} from "shared/types";

/**
 * «Сервер»: фейковый API в одном месте.
 *
 * Аналог shared/api + api-instances в web-credit-management:
 * там эффекты строятся поверх сгенерированного OpenAPI-клиента,
 * здесь — обещания с задержкой. Модели вызывают методы fakeApi
 * через createEffect, а «поведение сервера» живёт только здесь.
 *
 * Задержки и правила сбоев детерминированы и меняются в одном месте
 * (fakeApiConfig) — удобно для задач про ошибки, ретраи, гонки и кэш (ур. 3).
 */

/** Конфигурация «сервера» */
export const fakeApiConfig = {
  /** Задержки запросов, мс */
  delays: {
    client: 600,
    creditProducts: 400,
    schedule: 500,
    claim: 800,
    claimStatuses: 700,
  },
  /**
   * Правило «серверного» отказа при отправке заявки.
   * Шутка-подстава для тренировки обработки ошибок:
   * сумма, кратная 7, «падает» на сервере.
   */
  claimRejectWhen: (payload: SendClaimPayload) => payload.amount % 7 === 0,
} as const;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// --- «База данных» в памяти -----------------------------------------------------

const CLIENT: Client = { id: 1, fio: "Иванов Иван Иванович", monthlyIncome: 120_000 };

const CREDIT_PRODUCTS: CreditProduct[] = [
  {
    id: "alpha",
    name: "Потребительский «Альфа»",
    rate: 14.9,
    minAmount: 50_000,
    maxAmount: 1_000_000,
    maxTermMonths: 60,
  },
  {
    id: "prime",
    name: "Кредит «Прима»",
    rate: 12.5,
    minAmount: 100_000,
    maxAmount: 3_000_000,
    maxTermMonths: 84,
  },
  {
    id: "mortgage",
    name: "Ипотека",
    rate: 19.2,
    minAmount: 500_000,
    maxAmount: 15_000_000,
    maxTermMonths: 240,
  },
];

const CLAIM_STATUSES: ClaimStatus[] = [
  { date: "2025-11-01", status: "Создана", comment: "Заявка создана в системе" },
  { date: "2025-11-02", status: "На проверке", comment: "Проверена комплектность документов" },
  { date: "2025-11-03", status: "Комитет", comment: "На рассмотрении кредитным комитетом" },
];

/** Расчёт аннуитета (погашение платежа) — арифметика «сервера» */
const calculateSchedule = ({ amount, term, rate }: SendClaimPayload): PaymentSchedule => {
  const k = rate / 100 / 12;
  const payment = k === 0 ? amount / term : (amount * k) / (1 - Math.pow(1 + k, -term));
  const rounded = Math.round(payment);
  return {
    payment: rounded,
    overpayment: Math.round(payment * term - amount),
    total: Math.round(payment * term),
  };
};

/** Последовательный номер заявок (детерминированнее случайного) */
let claimSeq = 1000;

// --- «Запросы» -------------------------------------------------------------------

export const fakeApi = {
  /** Клиент */
  getClient: () => delay(fakeApiConfig.delays.client).then(() => CLIENT),

  /** Список кредитных продуктов */
  getCreditProducts: () =>
    delay(fakeApiConfig.delays.creditProducts).then(() => [...CREDIT_PRODUCTS]),

  /** Пересчёт графика платежей */
  refreshSchedule: (payload: SendClaimPayload) =>
    delay(fakeApiConfig.delays.schedule).then(() => calculateSchedule(payload)),

  /** Отправка заявки; отказ — по правилу claimRejectWhen */
  sendClaim: (payload: SendClaimPayload) =>
    new Promise<SendClaimResult>((resolve, reject) =>
      delay(fakeApiConfig.delays.claim).then(() => {
        if (fakeApiConfig.claimRejectWhen(payload)) {
          reject(
            new Error("Сервис временно недоступен (сумма кратна 7). Попробуйте другую сумму."),
          );
        } else {
          claimSeq += 1;
          resolve({ claimId: `CLM-${claimSeq}`, date: new Date().toLocaleString("ru-RU") });
        }
      }),
    ),

  /** История статусов заявки */
  getClaimStatuses: () => delay(fakeApiConfig.delays.claimStatuses).then(() => [...CLAIM_STATUSES]),
};
