import { RouterProvider } from "react-router-dom";
import { router } from "@/routes/router";
import { Toaster } from "sonner";
import { useThemeStore } from "./stores/theme.store";

export default function App() {
  const darkMode = useThemeStore((s) => s.darkMode);
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        richColors
        closeButton
        theme={darkMode ? "dark" : "light"}
        toastOptions={{
          style: {
            borderRadius: "var(--radius-xl)",
            fontSize: "0.875rem",
          },
        }}
      />
    </>
  );
}
