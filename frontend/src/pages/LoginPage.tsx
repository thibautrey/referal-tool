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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useAppTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  otp: z.string().optional(),
});

const highlights = ["geo", "rules", "analytics"] as const;

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginError = {
  requireOtp?: boolean;
  message?: string;
};

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [requireOtp, setRequireOtp] = useState(false);
  const { t } = useAppTranslation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      otp: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password, values.otp);
    } catch (error: unknown) {
      const loginError = error as LoginError;
      if (loginError.requireOtp) {
        setRequireOtp(true);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex md:w-1/2 bg-primary/10 flex-col justify-center items-center p-8 text-center">
        <div className="max-w-md mx-auto">
          <center>
            <img
              src="https://astronomy-store.com/cdn/shop/files/logo-insta.png?v=1720279381&width=120"
              alt={t("landing.header.logo_alt")}
              className="h-16 w-auto mb-4"
            />
          </center>
          <h1 className="text-3xl font-bold mb-4 text-primary">
            {t("auth.login.left_title")}
          </h1>
          <p className="text-lg mb-6">
            {t("auth.login.left_description")}
          </p>
          <div className="grid grid-cols-1 gap-6 mb-8">
            {highlights.map((key) => (
              <div
                key={key}
                className="border border-primary/20 rounded-lg p-4 bg-background/50"
              >
                <h3 className="font-medium mb-2">
                  {t(`auth.login.highlights.${key}.title`)}
                </h3>
                <p>{t(`auth.login.highlights.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("auth.login.title")}</CardTitle>
            <CardDescription>{t("auth.login.description")}</CardDescription>
          </CardHeader>
          <CardContent>
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
                          placeholder={t("auth.login.email_placeholder")}
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.password")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("auth.login.password_placeholder")}
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requireOtp && (
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("auth.login.otp_label")}</FormLabel>
                        <FormControl>
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end">
                  <Link
                    to="/app/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    {t("common.forgot_password")}
                  </Link>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading
                    ? t("common.sign_in_progress")
                    : t("common.sign_in")}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {t("auth.login.register_prompt")}
            </p>
            <Link to="/app/register" className="w-full">
              <Button
                variant="outline"
                className="w-full border-primary hover:bg-primary/10"
              >
                {t("auth.login.register_link")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
