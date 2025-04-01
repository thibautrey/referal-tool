import { AddLinkForm, GeoRule } from "./links/AddLinkForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LinkAnalytics } from "./links/LinkAnalytics";
import { LinksList } from "./links/LinksList";
import { ReferralLink } from "./types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface LinkFormData {
  name: string;
  baseUrl: string;
  geoRules: GeoRule[];
}

export default function LinksPage() {
  const { currentProjectId } = useAuth();
  const [activeTab, setActiveTab] = useState("all-links");
  const [links, setLinks] = useState<ReferralLink[]>([]);
  console.log("currentProjectId", currentProjectId);
  const handleAddLink = async (formData: LinkFormData) => {
    try {
      const linkData = {
        name: formData.name,
        baseUrl: formData.baseUrl,
        rules: formData.geoRules.map((rule) => ({
          redirectUrl: rule.redirectUrl,
          countries: rule.countries,
        })),
      };

      const response = await api.post<ReferralLink>(
        "/links/project",
        linkData,
        currentProjectId
      );
      setLinks([...links, response.data]);
      toast.success("Link created successfully");
      setActiveTab("all-links");
    } catch {
      toast.error("Failed to create link");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Referral Links</h1>
      </div>

      <Tabs
        defaultValue="all-links"
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="all-links">All Links</TabsTrigger>
          <TabsTrigger value="add-link">Add Link</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all-links">
          {!currentProjectId && <div className="text-red-500"></div>}

          {currentProjectId && (
            <LinksList
              projectId={currentProjectId}
              onAddLinkClick={() => setActiveTab("add-link")}
            />
          )}
        </TabsContent>

        <TabsContent value="add-link">
          <AddLinkForm onSubmit={handleAddLink} />
        </TabsContent>

        <TabsContent value="analytics">
          <LinkAnalytics links={links} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
