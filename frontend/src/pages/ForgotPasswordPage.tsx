import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAppTranslation } from "@/i18n";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Validation schema for password recovery
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useAppTranslation();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.post("/users/forgot-password", { email: values.email });
    } catch (error) {
      // We don't show specific errors to prevent email enumeration
      console.error("Error:", error);
      // We no longer set the error message here
    } finally {
      setIsLoading(false);
      // Always set isSubmitted to true whether the request succeeded or failed
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("auth.forgot_password.submitted.title")}</CardTitle>
            <CardDescription>
              {t("auth.forgot_password.submitted.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t("auth.forgot_password.submitted.helper")}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/app/login">
              <Button>{t("auth.forgot_password.return_to_login")}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.forgot_password.title")}</CardTitle>
          <CardDescription>
            {t("auth.forgot_password.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.email")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("auth.forgot_password.placeholder")}
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? t("auth.forgot_password.sending")
                  : t("auth.forgot_password.submit")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            to="/app/login"
            className="text-sm text-primary hover:underline"
          >
            {t("auth.forgot_password.return_to_login")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
