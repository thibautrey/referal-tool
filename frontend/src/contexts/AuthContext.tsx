import {
  OtpSetupData,
  User,
  changePassword as changePasswordApi,
  disableOTP as disableOTPApi,
  getBackupCodes as getBackupCodesApi,
  getCurrentUser,
  isAuthenticated,
  login as loginApi,
  logout as logoutApi,
  setupOTP as setupOTPApi,
  verifyOTP as verifyOTPApi,
} from "@/lib/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

import { api } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, otp?: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  setupOTP: () => Promise<OtpSetupData>;
  verifyOTP: (otp: string) => Promise<boolean>;
  disableOTP: (password: string) => Promise<void>;
  getBackupCodes: () => Promise<string[]>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    try {
      console.log("Refreshing user...");
      // Vérifier d'abord si un token existe
      if (!isAuthenticated()) {
        console.log("No token found, setting user to null");
        setUser(null);
        setIsLoading(false);
        return;
      }

      const currentUser = await getCurrentUser();
      console.log("Current user:", currentUser);
      setUser(currentUser);
    } catch (error) {
      console.error("Error retrieving profile:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, otp?: string) => {
    try {
      setIsLoading(true);
      const userInfo = await loginApi({ email, password, otp });
      setUser(userInfo);
      toast.success("Login successful");
      navigate("/");
    } catch (error: unknown) {
      const err = error as { status: number; data?: { requireOtp?: boolean } };
      if (err.status === 400 && err.data?.requireOtp) {
        return Promise.reject({ requireOtp: true });
      }
      toast.error("Login failed");
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post("/users/signup", { email, password });
      // Le toast est déjà géré dans la page RegisterPage
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await logoutApi();
      setUser(null);
      toast.success("Logout successful");
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Error during logout");
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    try {
      setIsLoading(true);
      await changePasswordApi(currentPassword, newPassword);
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Failed to update password");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setupOTP = async (): Promise<OtpSetupData> => {
    try {
      setIsLoading(true);
      const result = await setupOTPApi();
      return result;
    } catch (error) {
      console.error("OTP setup error:", error);
      toast.error("Failed to setup 2FA");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await verifyOTPApi(otp);
      if (result) {
        toast.success("2FA verified successfully");
        await refreshUser(); // Mettre à jour le profil utilisateur après activation
      }
      return result;
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Failed to verify code");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disableOTP = async (password: string): Promise<void> => {
    try {
      setIsLoading(true);
      await disableOTPApi(password);
      toast.success("2FA disabled successfully");
      await refreshUser(); // Mettre à jour le profil utilisateur après désactivation
    } catch (error) {
      console.error("OTP disable error:", error);
      toast.error("Failed to disable 2FA");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getBackupCodes = async (): Promise<string[]> => {
    try {
      setIsLoading(true);
      return await getBackupCodesApi();
    } catch (error) {
      console.error("Backup codes fetch error:", error);
      toast.error("Failed to get backup codes");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
    changePassword,
    setupOTP,
    verifyOTP,
    disableOTP,
    getBackupCodes,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
