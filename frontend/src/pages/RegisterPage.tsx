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
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Validation schema for registration form
const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

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
      toast.success("Account created successfully");
      navigate("/login");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to create account");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Column - Product Highlight */}
      <div className="hidden md:flex md:w-1/2 bg-primary/10 flex-col justify-center items-center p-8 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-primary">
            Join our platform
          </h1>
          <p className="text-lg mb-6">
            Create an account to start optimizing your affiliate marketing
            strategy and boost your conversion rates.
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

      {/* Right Column - Register Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              Register to start managing your affiliate links
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
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
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Already have an account?
            </p>
            <Link to="/login" className="w-full">
              <Button
                variant="outline"
                className="w-full border-primary hover:bg-primary/10"
              >
                Sign in
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
