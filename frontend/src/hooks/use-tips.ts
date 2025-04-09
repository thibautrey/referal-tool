import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface Tip {
  id: string;
  title: string;
  summary: string;
  image?: string;
}

const APP_TIPS: Tip[] = [
  //   {
  //     id: "otp-setup",
  //     title: "Secure your account",
  //     summary:
  //       "Enable two-factor authentication for extra security in your account settings.",
  //     image: "/images/tips/2fa.png",
  //   },
  //   {
  //     id: "project-setup",
  //     title: "Create your first project",
  //     summary: "Start by creating a project to organize your referral links.",
  //     image: "/images/tips/project.png",
  //   },
  {
    id: "geo-rules",
    title: "Geographic targeting",
    summary: "Use geo-rules to redirect users based on their location.",
    //image: "/images/tips/geo.png",
  },
];

export function useTips() {
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDismissedTips();
  }, []);

  const loadDismissedTips = async () => {
    try {
      const response = await api.get<{ seenTips: string[] }>("/users/me");
      if (response.data.seenTips) {
        setDismissedTips(response.data.seenTips);
      }
    } catch (error) {
      console.error("Failed to load dismissed tips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const availableTips = APP_TIPS.filter(
    (tip) => !dismissedTips.includes(tip.id)
  );

  const dismissTip = async (tipId: string) => {
    try {
      await api.post("/users/tips/seen", { tipId });
      setDismissedTips((prev) => [...prev, tipId]);
    } catch (error) {
      console.error("Failed to dismiss tip:", error);
    }
  };

  return {
    tips: availableTips,
    dismissTip,
    isLoading,
  };
}
