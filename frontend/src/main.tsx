import "./index.css";

import App from "./App";
import { BrowserRouter } from "react-router-dom";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "./components/ui/sonner";
import i18n from "./i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            {i18n.t("app.loading")}
          </div>
        }
      >
        <BrowserRouter>
          <App />
          <Toaster />
        </BrowserRouter>
      </Suspense>
    </I18nextProvider>
  </React.StrictMode>
);
