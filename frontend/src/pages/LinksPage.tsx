import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiResponse, api } from "@/lib/api";
import { ChevronRight, Home, Plus, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AddLinkForm } from "./links/AddLinkForm";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkFormData } from "./links/types";
import { LinksList } from "./links/LinksList";
import { ReferralLink } from "./types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAppTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface AddLinkFormRef {
  getFormData: () => LinkFormData;
}

const glassCardStyle =
  "bg-opacity-30 backdrop-blur-lg border-opacity-20 bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-800/40 dark:to-gray-900/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300";

export default function LinksPage() {
  const { currentProjectId } = useAuth();
  const [view, setView] = useState<"list" | "form">("list");
  const [editingLink, setEditingLink] = useState<ReferralLink | null>(null);
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const formRef = useRef<AddLinkFormRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useAppTranslation();

  const checkParams = () => {
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");

    if (mode === "edit" && id) {
      setView("form");
    } else if (mode === "add") {
      setView("form");
      setEditingLink(null);
    } else {
      setView("list");
      setEditingLink(null);
    }
  };

  useEffect(() => {
    if (currentProjectId) {
      checkParams();
    }
  }, [searchParams, currentProjectId]);

  const navigateToList = () => {
    setView("list");
    setEditingLink(null);
    setSearchParams({});
  };

  const navigateToAddForm = () => {
    setView("form");
    setEditingLink(null);
    setSearchParams({ mode: "add" });
  };

  const navigateToEditForm = (link: ReferralLink) => {
    setView("form");
    setEditingLink(link);
    setSearchParams({ mode: "edit", id: `${link.id}` });
  };

  const handleAddLink = async (formData: LinkFormData) => {
    try {
      let response: ApiResponse<ReferralLink>;
      const linkData = {
        name: formData.name,
        baseUrl: formData.baseUrl,
        shortCode: formData.shortCode,
        rules: formData.rules.map((rule) => ({
          redirectUrl: rule.redirectUrl,
          countries: rule.countries,
        })),
        deviceRules: formData.deviceRules,
      };

      if (formData.id) {
        response = await api.updateLink(formData.id, linkData);
      } else {
        response = await api.createLink(currentProjectId!, linkData);
      }
      if (response?.status !== 200) {
        throw new Error(t("links.errors.invalid_response"));
      }

      const processedResponse = {
        ...response.data,
        rules: response.data.rules.map((rule) => ({
          ...rule,
          countries:
            typeof rule.countries === "string"
              ? JSON.parse(rule.countries)
              : rule.countries,
        })),
        deviceRules: response.data.deviceRules.map((rule) => ({
          ...rule,
          devices:
            typeof rule.devices === "string"
              ? JSON.parse(rule.devices)
              : rule.devices,
        })),
      };

      if (formData.id) {
        setLinks(
          links.map((link) =>
            link.id === formData.id ? processedResponse : link
          )
        );
        toast.success(t("links.notifications.updated"));
      } else {
        setLinks([...links, processedResponse]);
        toast.success(t("links.notifications.created"));
      }

      navigateToList();
    } catch (err) {
      console.error("Error saving link:", err);
      const errorMessage =
        err instanceof Error && err.message
          ? err.message
          : t("links.errors.save");
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleFormSubmit = async () => {
    if (!formRef.current) return;
    setIsSubmitting(true);

    try {
      const formData = formRef.current.getFormData();
      await handleAddLink(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle =
    view === "list"
      ? t("links.title_list")
      : editingLink
      ? t("links.title_edit")
      : t("links.title_create");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
      </div>

      <div className="flex justify-between items-center">
        <nav className="flex items-center space-x-4" aria-label={t("links.breadcrumb.list")}>
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {view === "form" && (
              <li className="inline-flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateToList}
                  className="inline-flex items-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  {t("links.breadcrumb.list")}
                </Button>
              </li>
            )}

            {view === "form" && (
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {editingLink
                      ? t("links.breadcrumb.edit")
                      : t("links.breadcrumb.create")}
                  </span>
                </div>
              </li>
            )}
          </ol>
        </nav>

        {view === "form" && (
          <Button
            onClick={handleFormSubmit}
            disabled={isSubmitting}
            className="relative"
          >
            {isSubmitting ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : editingLink ? (
              <Save className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isSubmitting
              ? t("links.actions.saving")
              : editingLink
              ? t("links.actions.save")
              : t("links.actions.add")}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className={cn("mb-4", glassCardStyle)}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("analytics.error_title")}</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2 text-sm">
              <p>{t("analytics.error_description")}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6">
        {view === "list" ? (
          <>
            {!currentProjectId && (
              <Alert className={cn("mb-4", glassCardStyle)}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("analytics.no_project_title")}</AlertTitle>
                <AlertDescription>
                  {t("analytics.no_project_description")}
                </AlertDescription>
              </Alert>
            )}

            {currentProjectId && (
              <LinksList
                projectId={currentProjectId}
                onAddLinkClick={navigateToAddForm}
                onEditLinkClick={navigateToEditForm}
                onError={(message: string) => setError(message)}
              />
            )}
          </>
        ) : (
          <AddLinkForm ref={formRef} onSubmit={handleAddLink} />
        )}
      </div>
    </motion.div>
  );
}
