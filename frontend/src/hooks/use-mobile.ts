import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== "undefined"
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Vérifier une fois au montage
    handleResize();

    // Ajouter un écouteur d'événement pour les changements de taille
    window.addEventListener("resize", handleResize);

    // Nettoyage
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}
