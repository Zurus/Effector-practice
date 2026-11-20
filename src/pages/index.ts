import React from "react";
import type { PageKey } from "app/model";
import { ClaimsPage } from "./claims";
import { HistoryPage } from "./history";

/**
 * Реестр страниц (аналог pages/index.ts в web-credit-management,
 * где routes: RouteItem[] отдаются в RouterProvider).
 */

export interface RouteItem {
  name: string;
  key: PageKey;
  /** Путь оставлен для похожести — «настоящий» роутер здесь не нужен */
  path: string;
  component: React.FC;
}

export const routes: RouteItem[] = [
  {
    name: "Заявка на кредит",
    key: "claims",
    path: "/claims",
    component: ClaimsPage,
  },
  {
    name: "История статусов",
    key: "history",
    path: "/history",
    component: HistoryPage,
  },
];
