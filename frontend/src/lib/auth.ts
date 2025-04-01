import { ApiError, api } from "./api";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  otpEnabled: boolean;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface LoginCredentials {
  email: string;
  password: string;
  otp?: string;
}

// Constante pour la clé de stockage du token
const TOKEN_KEY = "auth_token";

// Stocker le token dans localStorage
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  // Mettre à jour le header d'autorisation pour les futures requêtes
  api.setAuthHeader(token);
};

// Récupérer le token depuis localStorage
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Supprimer le token du localStorage
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  // Supprimer le header d'autorisation
  api.removeAuthHeader();
};

export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await api.post<LoginResponse>("/users/login", credentials);

    // Si la connexion réussit, stocker le token
    if (response.data && response.data.token) {
      setToken(response.data.token);
    }

    return response.data.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Appeler l'API pour déconnecter côté serveur si nécessaire
    await api.post("/users/logout", {});
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Toujours supprimer le token local, même si l'API échoue
    removeToken();
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Vérifier d'abord si un token existe
    const token = getToken();
    if (!token) {
      return null;
    }

    // Récupérer les informations de l'utilisateur actuel depuis l'API
    const response = await api.get<User>("/users/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    // Si l'erreur est due à un token invalide/expiré, supprimer le token
    if ((error as ApiError).status === 401) {
      removeToken();
    }
    return null;
  }
};

// Vérifier si l'utilisateur est authentifié (token présent)
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

// Changer le mot de passe
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    await api.post("/users/change-password", { currentPassword, newPassword });
  } catch (error) {
    console.error("Password change error:", error);
    throw error;
  }
};

// Interface pour les données OTP retournées lors de la configuration
export interface OtpSetupData {
  otpAuthUrl: string;
  secret: string;
  backupCodes?: string[];
}

// Configurer l'OTP
export const setupOTP = async (): Promise<OtpSetupData> => {
  try {
    const response = await api.post<OtpSetupData>("/users/setup-otp", {});
    return response.data;
  } catch (error) {
    console.error("OTP setup error:", error);
    throw error;
  }
};

// Vérifier le code OTP
export const verifyOTP = async (otp: string): Promise<boolean> => {
  try {
    const response = await api.post<{ success: boolean }>("/users/verify-otp", {
      otp,
    });
    return response.data.success;
  } catch (error) {
    console.error("OTP verification error:", error);
    throw error;
  }
};

// Désactiver l'OTP
export const disableOTP = async (password: string): Promise<void> => {
  try {
    await api.post("/users/disable-otp", { password });
  } catch (error) {
    console.error("OTP disable error:", error);
    throw error;
  }
};

// Récupérer les codes de secours
export const getBackupCodes = async (): Promise<string[]> => {
  try {
    const response = await api.get<{ codes: string[] }>("/users/backup-codes");
    return response.data.codes;
  } catch (error) {
    console.error("Backup codes fetch error:", error);
    throw error;
  }
};
