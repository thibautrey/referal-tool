import {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="password-protection" className="text-sm font-medium">
          Password Protection
        </Label>
        <Switch
          id="password-protection"
          checked={isEnabled}
          onCheckedChange={onToggle}
        />
      </div>

      {isEnabled && (
        <div className="space-y-2">
          <FormField
            name="password"
            render={() => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      placeholder="Enter password"
                      className="pr-20"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute text-sm -translate-y-1/2 right-2 top-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </FormControl>
                <FormDescription>
                  Password must be at least 6 characters long
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};
