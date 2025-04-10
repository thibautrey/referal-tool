import { api } from "@/lib/api";

export const validatePassword = async (
  shortCode: string,
  password: string
): Promise<boolean> => {
  try {
    await api.post(`/l/${shortCode}/validate`, { password });
    return true;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response &&
      error.response.status === 401
    ) {
      throw new Error("Too many attempts. Please try again later.");
    }
    return false;
  }
};
