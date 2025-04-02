import { AddLinkForm, GeoRule } from "./links/AddLinkForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiResponse, api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

import { AlertCircle } from "lucide-react";
import { LinksList } from "./links/LinksList";
import { ReferralLink } from "./types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

interface LinkFormData {
  id?: number;
  name: string;
  baseUrl: string;
  shortCode: string;
  rules: GeoRule[];
}

const glassCardStyle =
  "bg-opacity-30 backdrop-blur-lg border-opacity-20 bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-800/40 dark:to-gray-900/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300";

export default function LinksPage() {
  const { currentProjectId } = useAuth();
  const [activeTab, setActiveTab] = useState("all-links");
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Détecter le paramètre 'tab' dans l'URL au chargement
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && (tabParam === "all-links" || tabParam === "add-link")) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Mettre à jour l'URL quand l'onglet actif change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const handleAddLink = async (formData: LinkFormData) => {
    try {
      console.log(formData);
      let response: ApiResponse<ReferralLink>;
      const linkData = {
        name: formData.name,
        baseUrl: formData.baseUrl,
        shortCode: formData.shortCode,
        rules: formData.rules.map((rule) => ({
          redirectUrl: rule.redirectUrl,
          countries: rule.countries,
        })),
      };

      if (formData.id) {
        response = await api.updateLink(formData.id, linkData);
        setLinks(
          links.map((link) => (link.id === formData.id ? response.data : link))
        );
        toast.success("Link updated successfully");
      } else {
        response = await api.post<ReferralLink>(
          "/links/project",
          linkData,
          currentProjectId
        );
        setLinks([...links, response.data]);
        toast.success("Link created successfully");
      }

      setActiveTab("all-links");
      setSearchParams({ tab: "all-links" });
    } catch (err) {
      console.error("Error saving link:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save link";
      toast.error(errorMessage);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Referral Links</h1>
      </div>

      {error && (
        <Alert variant="destructive" className={cn("mb-4", glassCardStyle)}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2 text-sm">
              <p>Please try again or contact support if this issue persists.</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs
        defaultValue="all-links"
        className="w-full"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-links">All Links</TabsTrigger>
          <TabsTrigger value="add-link">Add Link</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="all-links">
            {!currentProjectId && (
              <Alert className={cn("mb-4", glassCardStyle)}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Project Selected</AlertTitle>
                <AlertDescription>
                  Please select a project to view links
                </AlertDescription>
              </Alert>
            )}

            {currentProjectId && (
              <LinksList
                projectId={currentProjectId}
                onAddLinkClick={() => setActiveTab("add-link")}
                onEditLinkClick={(link) => {
                  setActiveTab("add-link");
                  setSearchParams({
                    tab: "add-link",
                    mode: "edit",
                    id: `${link.id}`,
                  });
                }}
                onError={(message: string) => setError(message)}
              />
            )}
          </TabsContent>

          <TabsContent value="add-link">
            <AddLinkForm onSubmit={handleAddLink} />
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}
