import { Image } from "@/components/shared/Image";
import { useAppTranslation } from "@/i18n";

export function Logo() {
  const { t } = useAppTranslation();

  return (
    <div className="flex items-center">
      <Image
        src="/images/logo.avif"
        alt={t("landing.header.logo_alt")}
        className="h-8 w-auto"
      />
      <span className="ml-2 text-lg font-bold">{t("app.name")}</span>
    </div>
  );
}
