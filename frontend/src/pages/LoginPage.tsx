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
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Validation schema for login form
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  otp: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [requireOtp, setRequireOtp] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      otp: "",
    },
  });

  interface LoginError {
    requireOtp?: boolean;
    message?: string;
  }

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
      {/* Left Column - Product Highlight */}
      <div className="hidden md:flex md:w-1/2 bg-primary/10 flex-col justify-center items-center p-8 text-center">
        <div className="max-w-md mx-auto">
          <center>
            <img
              src="https://astronomy-store.com/cdn/shop/files/logo-insta.png?v=1720279381&width=120"
              alt="Logo"
              className="h-16 w-auto mb-4"
            />
          </center>
          <h1 className="text-3xl font-bold mb-4 text-primary">
            Optimize your affiliations
          </h1>
          <p className="text-lg mb-6">
            Our tool helps influencers improve their conversions by allowing
            them to configure different affiliate links for the same product.
          </p>
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="border border-primary/20 rounded-lg p-4 bg-background/50">
              <h3 className="font-medium mb-2">Geographic customization</h3>
              <p>
                Adapt your links based on your users' location to maximize
                impact.
              </p>
            </div>
            <div className="border border-primary/20 rounded-lg p-4 bg-background/50">
              <h3 className="font-medium mb-2">Intelligent rules</h3>
              <p>
                Create rules that automatically determine which link is used
                based on the user's profile.
              </p>
            </div>
            <div className="border border-primary/20 rounded-lg p-4 bg-background/50">
              <h3 className="font-medium mb-2">Performance analysis</h3>
              <p>
                Track conversions and optimize your affiliate strategy in
                real-time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Sign in to your account to access your affiliations.
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
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@example.com"
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
                      <FormLabel>Password</FormLabel>
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

                {requireOtp && (
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authentication code</FormLabel>
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Don't have an account yet?
            </p>
            <Link to="/register" className="w-full">
              <Button
                variant="outline"
                className="w-full border-primary hover:bg-primary/10"
              >
                Create account
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
