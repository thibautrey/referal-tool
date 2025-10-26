import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Check, Copy, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpSetupData } from "@/lib/auth";
import QRCode from "react-qr-code";
import { Switch } from "@/components/ui/switch";
import { useAppTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Password change validation schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        params: { i18nKey: "settings.security.password.mismatch" },
      });
    }
  });

// OTP verification validation schema
const otpSchema = z.object({
  otp: z.string().min(6).max(6),
});

// OTP disabling validation schema
const disableOtpSchema = z.object({
  password: z.string().min(1),
});

export default function SecuritySettings() {
  const {
    user,
    changePassword,
    setupOTP,
    verifyOTP,
    disableOTP,
    getBackupCodes,
  } = useAuth();
  const { t } = useAppTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpSetupData, setOtpSetupData] = useState<OtpSetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  // Récupérer les données OTP du localStorage au chargement de la page
  useEffect(() => {
    const savedOtpData = localStorage.getItem("otpSetupData");
    if (savedOtpData) {
      try {
        const parsedData = JSON.parse(savedOtpData);

        // Vérifier que les données ont une clé secrète valide
        if (!parsedData || !parsedData.secret) {
          console.error("Invalid OTP setup data in localStorage, removing it");
          localStorage.removeItem("otpSetupData");
          return;
        }

        setOtpSetupData(parsedData);

        if (parsedData.backupCodes && parsedData.backupCodes.length > 0) {
          setBackupCodes(parsedData.backupCodes);
        }
      } catch (e) {
        console.error("Error parsing saved OTP data", e);
        localStorage.removeItem("otpSetupData");
      }
    }
  }, []);

  // désactiver les boutons submit dans les formulaires pour éviter les rechargements accidentels
  useEffect(() => {
    const preventSubmit = (e: Event) => {
      if (
        (e.target as HTMLElement).nodeName === "FORM" &&
        !(e.target as HTMLFormElement).hasAttribute("data-allow-submit")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("submit", preventSubmit);
    return () => document.removeEventListener("submit", preventSubmit);
  }, []);

  // Fonction pour récupérer les données OTP depuis le serveur
  const refetchOtpData = async () => {
    try {
      setIsProcessing(true);
      console.log("Refetching OTP data from server");
      const data = await setupOTP();

      if (!data || !data.secret) {
        console.error("Server returned invalid OTP data", data);
        return;
      }

      console.log("New OTP data received successfully");
      setOtpSetupData(data);

      // Sauvegarder les nouvelles données dans localStorage
      localStorage.setItem("otpSetupData", JSON.stringify(data));

      if (data.backupCodes) {
        setBackupCodes(data.backupCodes);
      }
    } catch (error) {
      console.error("Error refetching OTP setup data:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Password change form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // OTP verification form
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  // OTP disabling form
  const disableOtpForm = useForm<z.infer<typeof disableOtpSchema>>({
    resolver: zodResolver(disableOtpSchema),
    defaultValues: {
      password: "",
    },
  });

  // Password change form submission
  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    try {
      setIsProcessing(true);
      await changePassword(values.currentPassword, values.newPassword);
      passwordForm.reset();
    } catch (error) {
      console.error("Error changing password:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize OTP setup
  const handleSetupOTP = async (e: React.MouseEvent) => {
    // Arrêter explicitement la propagation et le comportement par défaut
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsProcessing(true);
      const data = await setupOTP();
      console.log("OTP Setup data received:", data); // Log pour débogage

      // Vérifier que la clé secrète existe
      if (!data || !data.secret) {
        console.error("Missing secret key in OTP setup data", data);
      }

      setOtpSetupData(data);

      // Sauvegarder les données dans localStorage
      localStorage.setItem("otpSetupData", JSON.stringify(data));

      if (data.backupCodes) {
        setBackupCodes(data.backupCodes);
      }
    } catch (error) {
      console.error("Error setting up OTP:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Verify OTP code
  const onOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    try {
      setIsProcessing(true);
      const success = await verifyOTP(values.otp);
      if (success) {
        setOtpSetupData(null);
        setShowBackupCodes(true);

        // Nettoyer localStorage après vérification réussie
        localStorage.removeItem("otpSetupData");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Disable OTP
  const onDisableOtpSubmit = async (
    values: z.infer<typeof disableOtpSchema>
  ) => {
    try {
      setIsProcessing(true);
      await disableOTP(values.password);
      disableOtpForm.reset();
    } catch (error) {
      console.error("Error disabling OTP:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get backup codes
  const handleGetBackupCodes = async () => {
    try {
      setIsProcessing(true);
      const codes = await getBackupCodes();
      setBackupCodes(codes);
      setShowBackupCodes(true);
    } catch (error) {
      console.error("Error getting backup codes:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy backup codes
  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
  };

  // Copier la clé secrète avec feedback - utiliser une méthode alternative de copie
  const copySecretKey = () => {
    if (!otpSetupData?.secret) {
      console.error("No secret key available to copy");
      return;
    }

    try {
      // Méthode alternative utilisant un élément textarea temporaire
      const textArea = document.createElement("textarea");
      textArea.value = otpSetupData.secret;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setSecretCopied(true);

      // Réinitialiser après 2 secondes
      setTimeout(() => {
        setSecretCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy secret key:", error);
    }
  };

  const hasOtpEnabled = user?.otpEnabled;

  return (
    <Tabs defaultValue="password" className="w-full max-w-4xl mx-auto">
      {/* <TabsList className="mb-8">
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="2fa">Two-Factor Authentication</TabsTrigger>
      </TabsList> */}

      <TabsContent value="password" className="space-y-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("settings.security.password.title")}
            </h2>
            <p className="text-muted-foreground mt-2">
              {t("settings.security.password.description")}
            </p>
          </div>

          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-6 max-w-lg"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.security.password.current_label")}
                    </FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.security.password.new_label")}
                    </FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t("settings.security.password.new_helper")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.security.password.confirm_label")}
                    </FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isProcessing} className="mt-4">
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("settings.security.password.submit")}
              </Button>
            </form>
          </Form>
        </div>
      </TabsContent>

      <TabsContent value="2fa" className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("settings.security.two_factor.title")}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t("settings.security.two_factor.description")}
          </p>
        </div>

        <div className="space-y-8">
          {!hasOtpEnabled && !otpSetupData && (
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center space-x-2">
                <Switch id="2fa" disabled={true} />
                <label htmlFor="2fa" className="text-sm font-medium">
                  {t("settings.security.two_factor.disabled_label")}
                </label>
              </div>
              {/* Utiliser div au lieu de button pour éviter le rechargement */}
              <div
                onClick={handleSetupOTP}
                className={`
                  inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  disabled:pointer-events-none disabled:opacity-50
                  bg-primary text-primary-foreground hover:bg-primary/90
                  h-10 px-4 py-2 cursor-pointer
                `}
                style={{ userSelect: "none" }}
              >
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("settings.security.two_factor.enable")}
              </div>
            </div>
          )}

          {otpSetupData && (
            <div className="space-y-8 max-w-lg">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {t("settings.security.two_factor.instructions.title")}
                </AlertTitle>
                <AlertDescription>
                  {t("settings.security.two_factor.instructions.body")}
                </AlertDescription>
              </Alert>

              <div className="flex justify-center my-8">
                <div className="p-4 bg-white rounded-lg border">
                  <QRCode value={otpSetupData.otpAuthUrl} size={200} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">
                    {t("settings.security.two_factor.secret_label")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copySecretKey}
                    className="h-8"
                  >
                    {secretCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                        {t("common.copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        {t("common.copy")}
                      </>
                    )}
                  </Button>
                </div>
                {otpSetupData && otpSetupData.secret ? (
                  <p className="p-3 bg-secondary text-secondary-foreground rounded text-center font-mono">
                    {otpSetupData.secret}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="p-3 bg-secondary text-secondary-foreground rounded text-center text-red-500">
                      {t("settings.security.two_factor.secret_unavailable")}
                    </p>
                    <Button
                      onClick={refetchOtpData}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t("settings.security.two_factor.regenerate")}
                    </Button>
                  </div>
                )}
              </div>

              <Form {...otpForm}>
                <form
                  onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("settings.security.two_factor.otp_label")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={6}
                            placeholder={t(
                              "settings.security.two_factor.otp_placeholder"
                            )}
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("settings.security.two_factor.verify")}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {hasOtpEnabled && !otpSetupData && (
            <div className="space-y-6 max-w-lg">
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-500" />
                <AlertTitle>
                  {t("settings.security.two_factor.enabled.title")}
                </AlertTitle>
                <AlertDescription>
                  {t("settings.security.two_factor.enabled.description")}
                </AlertDescription>
              </Alert>

              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={handleGetBackupCodes}>
                  {t("settings.security.backup_codes.show")}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      {t("settings.security.two_factor.disable")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("settings.security.two_factor.disable")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("settings.security.two_factor.disable_description")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Form {...disableOtpForm}>
                      <form
                        onSubmit={disableOtpForm.handleSubmit(
                          onDisableOtpSubmit
                        )}
                      >
                        <FormField
                          control={disableOtpForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("settings.security.two_factor.confirm_password")}
                              </FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <AlertDialogFooter className="mt-4">
                          <AlertDialogCancel>
                            {t("common.cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button
                              type="submit"
                              variant="destructive"
                              disabled={isProcessing}
                            >
                              {isProcessing && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {t("settings.security.two_factor.disable")}
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </form>
                    </Form>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {showBackupCodes && backupCodes.length > 0 && (
            <div className="mt-8 border rounded-lg p-6 space-y-4 max-w-lg">
              <div>
                <h3 className="text-lg font-semibold">
                  {t("settings.security.backup_codes.title")}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {t("settings.security.backup_codes.description")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 my-4">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-2 bg-secondary text-secondary-foreground rounded font-mono text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <Button
                onClick={copyBackupCodes}
                variant="outline"
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("settings.security.backup_codes.copy_all")}
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
