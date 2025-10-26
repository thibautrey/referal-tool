import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppTranslation } from "@/i18n";
import { useForm } from "react-hook-form";
import { useState } from "react";

interface PasswordProtectionProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  password: string;
  onPasswordChange: (password: string) => void;
}

export const PasswordProtection = ({
  isEnabled,
  onToggle,
  password,
  onPasswordChange,
}: PasswordProtectionProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useAppTranslation();
  const form = useForm({
    defaultValues: {
      password: password,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="password-protection" className="text-sm font-medium">
          {t("links.form.password.title")}
        </Label>
        <Switch
          id="password-protection"
          checked={isEnabled}
          onCheckedChange={onToggle}
          aria-label={t("links.form.password.enable_label")}
        />
      </div>

      {isEnabled && (
        <div className="space-y-2">
          <Form {...form}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("links.form.password.password_label")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          onPasswordChange(e.target.value);
                        }}
                        placeholder={t("links.form.password.password_placeholder")}
                        className="pr-20"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute text-sm -translate-y-1/2 right-2 top-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword
                          ? t("links.form.password.hide")
                          : t("links.form.password.show")}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("links.form.password.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </div>
      )}
    </div>
  );
};
