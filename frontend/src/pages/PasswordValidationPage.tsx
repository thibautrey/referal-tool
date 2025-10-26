import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppTranslation } from "@/i18n";
import { useState } from "react";
import { validatePassword } from "@/services/passwordValidation";

interface Props {
  shortCode: string;
}

export const PasswordValidationPage = ({ shortCode }: Props) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useAppTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const isValid = await validatePassword(shortCode, password);
      if (isValid) {
        window.location.reload();
      } else {
        setError(t("auth.password_validation.invalid"));
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("auth.password_validation.error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2 text-center">
          <Shield className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-2xl font-semibold">
            {t("auth.password_validation.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("auth.password_validation.description")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder={t("auth.password_validation.placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!password || isLoading}
          >
            {isLoading
              ? t("auth.password_validation.validating")
              : t("auth.password_validation.submit")}
          </Button>
        </form>
      </Card>
    </div>
  );
};
