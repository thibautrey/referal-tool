import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Construit un chemin d'accès pour les assets en tenant compte du basePath configuré
 * @param path Chemin relatif de l'asset (ex: '/images/logo.png')
 * @returns Le chemin complet avec le basePath correct
 */
export function assetPath(path: string): string {
  // Retire le slash initial si présent pour éviter les chemins doubles
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // En développement, utiliser le chemin direct
  if (import.meta.env.DEV) {
    return `/${cleanPath}`;
  }

  // En production, préfixer avec le basename configuré dans Vite
  return `/app/${cleanPath}`;
}
