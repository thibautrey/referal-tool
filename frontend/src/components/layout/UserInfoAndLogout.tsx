import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTranslation } from "@/i18n";

export function UserInfoAndLogout() {
  const { user, logout } = useAuth();
  const { t } = useAppTranslation();

  return (
    <>
      {user && (
        <div className="text-sm text-muted-foreground px-2 mb-2">
          <span className="hidden lg:inline">
            {t("sidebar.user.welcome_prefix")}
          </span>
          <span className="font-medium">{user.email}</span>
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="justify-start gap-3"
        onClick={() => logout()}
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden lg:block">
          {t("common.logout")}
        </span>
      </Button>
    </>
  );
}
