import { Route, Routes } from "react-router-dom";

import AnalyticsPage from "./pages/AnalyticsPage";
import { AuthProvider } from "./contexts/AuthContext";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage"; // Import de la nouvelle page
import LinksPage from "./pages/LinksPage";
import LoginPage from "./pages/LoginPage";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Routes publiques (accessibles sans authentification) */}
        <Route element={<PublicRoute />}>
          <Route path="/app/login" element={<LoginPage />} />
          <Route path="/app/register" element={<RegisterPage />} />
          <Route path="/app/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/app/reset-password" element={<ResetPasswordPage />} />
        </Route>

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
    </AuthProvider>
  );
}

export default App;
