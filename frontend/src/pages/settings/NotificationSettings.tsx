import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppTranslation } from "@/i18n";

export default function NotificationSettings() {
  const { t } = useAppTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.notifications.title")}</CardTitle>
        <CardDescription>
          {t("settings.notifications.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{t("settings.notifications.empty")}</p>
      </CardContent>
    </Card>
  );
}
