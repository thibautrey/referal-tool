import { Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import AnalyticsPage from "./pages/AnalyticsPage";
import ApiDocsPage from "./pages/ApiDocsPage";
import { AuthProvider } from "./contexts/AuthContext";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import LinksPage from "./pages/LinksPage";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./layouts/MainLayout";
import { ProjectProvider } from "@/contexts/project-context";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import { ThemeProvider } from "next-themes";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// Composant pour gérer le thème utilisateur
function ThemeManager({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userTheme, setUserTheme] = useState<string>("system");

  useEffect(() => {
    // Only fetch theme if user is logged in
    if (user) {
      api.getUserTheme().then((theme) => {
        setUserTheme(theme);
      });
    }
  }, [user]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      value={{
        dark: "dark",
        light: "light",
        system: "system",
      }}
      forcedTheme={userTheme}
      enableSystem
    >
      {children}
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <ThemeManager>
          <Routes>
            {/* Routes publiques (accessibles sans authentification) */}
            <Route element={<PublicRoute />}>
              <Route path="/app/login" element={<LoginPage />} />
              <Route path="/app/register" element={<RegisterPage />} />
              <Route
                path="/app/forgot-password"
                element={<ForgotPasswordPage />}
              />
              <Route
                path="/app/reset-password"
                element={<ResetPasswordPage />}
              />
            </Route>

            {/* Routes publiques sans protection */}
            <Route path="/docs/api" element={<ApiDocsPage />} />

            {/* Routes protégées (nécessitent une authentification) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/app/dashboard" element={<HomePage />} />
                <Route path="/app/settings" element={<SettingsPage />} />
                <Route path="/app/links" element={<LinksPage />} />
                <Route path="/app/analytics" element={<AnalyticsPage />} />
              </Route>
            </Route>

            <Route path="/" element={<LandingPage />} />
          </Routes>
        </ThemeManager>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
