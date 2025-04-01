import { useEffect, useState } from "react";

import { ReferralLink } from "../types";
import { linkService } from "../../services/linkService";
import { toast } from "sonner";
import { useParams } from "react-router-dom";

export function useLinksController() {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState("all-links");
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculs de pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLinks = links.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(links.length / itemsPerPage);

  useEffect(() => {
    if (projectId) {
      loadLinks();
    }
  }, [projectId]);

  const loadLinks = async () => {
    try {
      setIsLoading(true);
      const data = await linkService.getProjectLinks(projectId!);
      setLinks(data);
    } catch {
      toast.error("Failed to load links");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLink = async (data: {
    mainUrl: string;
    geoRules: { url: string; countries: string[] }[];
  }) => {
    try {
      await linkService.createLink(projectId!, {
        name: "New Link", // À adapter selon vos besoins
        baseUrl: data.mainUrl,
        rules: data.geoRules.map((rule) => ({
          redirectUrl: rule.url,
          countries: rule.countries,
        })),
      });
      toast.success("Link added successfully");
      loadLinks();
    } catch {
      toast.error("Failed to add link");
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await linkService.deleteLink(id);
      toast.success("Link deleted");
      loadLinks();
    } catch {
      toast.error("Failed to delete link");
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return {
    activeTab,
    setActiveTab,
    links,
    isLoading,
    currentPage,
    totalPages,
    currentLinks,
    handleAddLink,
    handleDeleteLink,
    handleCopyLink,
    setCurrentPage,
  };
}
