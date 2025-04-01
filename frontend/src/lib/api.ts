// Simple wrapper pour fetch avec gestion des tokens d'authentification

import { ReferralLink } from "@/pages/types";

// Configuration des URLs d'API par environnement
const API_URLS = {
  development: "http://localhost:3001/api",
  test: "http://test-api.example.com/api",
  staging: "https://staging-api.example.com/api",
  production: "https://api.example.com/api",
};

// Récupère l'environnement depuis les variables REACT_APP_*
// Note: Dans un environnement frontend, seules les variables préfixées par REACT_APP_ sont accessibles
const ENVIRONMENT =
  (typeof process !== "undefined" && process.env?.REACT_APP_ENV) ||
  "development";

// URL par défaut en cas de problème
const DEFAULT_API_URL = "http://localhost:3001/api";

// Sélectionne l'URL de base en fonction de l'environnement
// Priorité: URL spécifique dans .env > URL d'environnement prédéfinie > URL par défaut
const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  API_URLS[ENVIRONMENT as keyof typeof API_URLS] ||
  DEFAULT_API_URL;

// Log d'information (en développement uniquement)
if (ENVIRONMENT === "development") {
  console.log(`API configurée sur: ${API_BASE_URL}`);
}

// Type pour les options des requêtes
interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

// Type pour la réponse
interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  status: number;
}

// Type pour les erreurs API
export interface ApiError {
  status?: number;
  message?: string;
  data?: unknown;
}

// Type pour la réponse de l'API des liens
export interface LinksResponse {
  links: ReferralLink[];
  total: number;
  page: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Classe pour gérer les appels API
class Api {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
    };
  }

  // Méthode pour définir le header d'autorisation
  setAuthHeader(token: string): void {
    this.headers["Authorization"] = `Bearer ${token}`;
  }

  // Méthode pour supprimer le header d'autorisation
  removeAuthHeader(): void {
    delete this.headers["Authorization"];
  }

  // Méthode privée pour construire l'URL complète
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${
      endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    }`;
  }

  // Méthode générique pour les requêtes
  private async request<T>(
    endpoint: string,
    method: string,
    data?: unknown,
    projectId?: number | null
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);

    const options: RequestOptions = {
      method,
      headers: { ...this.headers },
    };

    try {
      const token = localStorage.getItem("auth_token");

      if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
      }

      if (projectId) {
        options.headers["X-Project-ID"] = projectId.toString();
      }

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          data: responseData,
          message: responseData.message || "Une erreur est survenue",
        };
      }

      return {
        ...responseData,
        data: responseData.data,
        message: responseData.message,
        status: response.status,
      };
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw {
        status: 500,
        message: (error as Error).message || "Erreur réseau",
        data: null,
      };
    }
  }

  // Méthodes publiques pour les différents types de requêtes
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "GET");
  }

  async post<T, D = unknown>(
    endpoint: string,
    data: D,
    projectId?: number | null
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "POST", data, projectId);
  }

  async put<T, D = unknown>(
    endpoint: string,
    data: D
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "PUT", data);
  }

  async delete<T>(
    endpoint: string,
    projectId?: number | null
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "DELETE", undefined, projectId);
  }

  async getLinks(
    projectId: number,
    page: number = 1,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
    limit: number = 10
  ): Promise<LinksResponse> {
    const response = await this.get<LinksResponse>(
      `/links/project/${projectId}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    );
    return response.data;
  }

  async deleteLink(projectId: number, id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/links/${id}`, projectId);
  }
}

export const api = new Api(API_BASE_URL);
