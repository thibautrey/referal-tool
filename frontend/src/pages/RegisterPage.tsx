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
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAppTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Validation schema for registration form
const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        params: { i18nKey: "auth.register.validation.mismatch" },
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useAppTranslation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await signup(values.email, values.password);
      toast.success(t("auth.register.toast.success"));
      navigate("/app/login");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || t("auth.register.toast.error"));
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Column - Product Highlight */}
      <div className="hidden md:flex md:w-1/2 bg-primary/10 flex-col justify-center items-center p-8 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-primary">
            {t("auth.register.hero.title")}
          </h1>
          <p className="text-lg mb-6">
            {t("auth.register.hero.description")}
          </p>
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="border border-primary/20 rounded-lg p-4 bg-background/50">
              <h3 className="font-medium mb-2">
                {t("auth.register.hero.features.geo.title")}
              </h3>
              <p>{t("auth.register.hero.features.geo.description")}</p>
            </div>
            <div className="border border-primary/20 rounded-lg p-4 bg-background/50">
              <h3 className="font-medium mb-2">
                {t("auth.register.hero.features.rules.title")}
              </h3>
              <p>{t("auth.register.hero.features.rules.description")}</p>
            </div>
            <div className="border border-primary/20 rounded-lg p-4 bg-background/50">
              <h3 className="font-medium mb-2">
                {t("auth.register.hero.features.analytics.title")}
              </h3>
              <p>{t("auth.register.hero.features.analytics.description")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Register Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("auth.register.title")}</CardTitle>
            <CardDescription>
              {t("auth.register.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.email")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("auth.register.email_placeholder")}
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
                        {t("auth.register.confirm_password_label")}
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading
                    ? t("auth.register.creating")
                    : t("auth.register.submit")}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {t("auth.register.login_prompt")}
            </p>
            <Link to="/app/login" className="w-full">
              <Button
                variant="outline"
                className="w-full border-primary hover:bg-primary/10"
              >
                {t("auth.register.login_link")}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
