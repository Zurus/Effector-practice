import React from "react";
import type { PageKey } from "app/model";
import type { RouteItem } from "pages";

/**
 * Общие UI-компоненты (аналог shared/ui в web-credit-management.
 * Там роль такого слоя выполняет efr-design-system).
 */

export const PageLayout: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div>
    <h1 className="page-title">{title}</h1>
    {subtitle && <p className="muted page-subtitle">{subtitle}</p>}
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button className="btn" {...props} />
);

export const Alert: React.FC<{ kind: "error" | "success"; children: React.ReactNode }> = ({
  kind,
  children,
}) => <div className={`alert alert--${kind}`}>{children}</div>;

/**
 * Простой «роутер»: вместо react-router — кнопки-переключатели страниц.
 * Активная страница хранится в effector-сторе (app/model).
 */
export const PageNav: React.FC<{
  routes: RouteItem[];
  activeKey: PageKey;
  onSelect: (key: PageKey) => void;
}> = ({ routes, activeKey, onSelect }) => (
  <nav className="nav">
    {routes.map((route) => (
      <button
        key={route.key}
        className={`nav__btn ${route.key === activeKey ? "nav__btn--active" : ""}`}
        onClick={() => onSelect(route.key)}
      >
        {route.name}
      </button>
    ))}
  </nav>
);
