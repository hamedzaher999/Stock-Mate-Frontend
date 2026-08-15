import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import "@/i18n/i18n";
import "@/index.css";
import App from "./App";
import { useThemeStore } from "@/stores/theme.store";

// Initialize theme on startup
useThemeStore.getState().applyToRoot();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
