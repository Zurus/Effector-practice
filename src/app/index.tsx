import React from "react";
import { useStore } from "effector-react";
import { routes } from "pages";
import { $activePage, selectPage } from "app/model";
import { PageNav } from "shared/ui";
import { APP_NAME } from "shared/constants";

/**
 * Корневой компонент приложения.
 *
 * Аналог src/app/index.tsx в web-credit-management:
 * там — ThemeProvider (efr-design-system) + RouterProvider (web_common/Providers),
 * здесь — навигация + компонент текущей страницы.
 */
const App: React.FC = () => {
  const activePage = useStore($activePage);
  const route = routes.find((r) => r.key === activePage);

  if (!route) return null;
  const Page = route.component;

  return (
    <div className="app">
      <p className="app__brand">{APP_NAME}</p>
      <PageNav routes={routes} activeKey={activePage} onSelect={selectPage} />
      <main className="app__content">
        <Page />
      </main>
    </div>
  );
};

export default App;
