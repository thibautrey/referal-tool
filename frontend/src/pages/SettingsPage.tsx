import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ApiKeysSettings from "./settings/ApiKeysSettings";
import GeneralSettings from "./settings/GeneralSettings";
import NotificationSettings from "./settings/NotificationSettings";
import ProfileSettings from "./settings/ProfileSettings";
import SecuritySettings from "./settings/SecuritySettings";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { useAppTranslation } from "@/i18n";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { t } = useAppTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("settings.title")}
        </h1>
        <LanguageSelector />
      </div>

      <Tabs
        defaultValue="general"
        className="w-full"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="general">
            {t("settings.tabs.general")}
          </TabsTrigger>
          <TabsTrigger value="profile">
            {t("settings.tabs.profile")}
          </TabsTrigger>
          <TabsTrigger value="security">
            {t("settings.tabs.security")}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {t("settings.tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            {t("settings.tabs.api_keys")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeysSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
