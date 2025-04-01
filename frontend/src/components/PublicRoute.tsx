import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

export default function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page d'accueil si déjà authentifié
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Afficher le contenu de la route publique
  return <Outlet />;
}
