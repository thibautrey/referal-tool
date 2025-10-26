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
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAppTranslation } from "@/i18n";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Validation schema for password reset
const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    token: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        params: { i18nKey: "auth.reset_password.validation.mismatch" },
      });
    }
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useAppTranslation();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      token: token,
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    try {
      setIsLoading(true);
      await api.post("/users/reset-password", {
        token: values.token,
        password: values.password,
      });
      toast.success(t("auth.reset_password.toast.success"));
      navigate("/app/login");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(t("auth.reset_password.toast.error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("auth.reset_password.invalid.title")}</CardTitle>
            <CardDescription>
              {t("auth.reset_password.invalid.description")}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link to="/app/forgot-password">
              <Button>{t("auth.reset_password.invalid.cta")}</Button>
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
          <CardTitle>{t("auth.reset_password.title")}</CardTitle>
          <CardDescription>
            {t("auth.reset_password.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.reset_password.password_label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("auth.reset_password.confirm_label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <input type="hidden" {...form.register("token")} />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? t("auth.reset_password.submitting")
                  : t("auth.reset_password.submit")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            to="/app/login"
            className="text-sm text-primary hover:underline"
          >
            {t("auth.reset_password.return_to_login")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
