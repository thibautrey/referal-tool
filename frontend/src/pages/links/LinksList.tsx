import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Edit,
  Loader2,
  Plus,
  Trash,
} from "lucide-react";
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ReferralLink } from "../types";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAppTranslation } from "@/i18n";

const glassCardStyle =
  "bg-opacity-30 backdrop-blur-lg border-opacity-20 bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-800/40 dark:to-gray-900/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300";

const AnimatedCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface LinksListProps {
  onAddLinkClick: () => void;
  onEditLinkClick: (link: ReferralLink) => void;
  projectId: number;
  onError?: (message: string) => void;
}

type SortOrder = "asc" | "desc";
type SortField = "createdAt";

export function LinksList({
  onAddLinkClick,
  onEditLinkClick,
  projectId,
  onError,
}: LinksListProps) {
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentDomain, setCurrentDomain] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [errorState, setErrorState] = useState<string | null>(null);
  const previousProjectId = useRef<number | null>(null);
  const { t, i18n } = useAppTranslation();

  useEffect(() => {
    if (previousProjectId.current === projectId) {
      return;
    }

    previousProjectId.current = projectId;

    if (!projectId) {
      setLinks([]);
      setTotalPages(1);
      setCurrentPage(1);
      setErrorState(null);
      return;
    }

    setLinks([]);
    setTotalPages(1);
    setCurrentPage(1);
    setErrorState(null);
    setIsLoading(true);
  }, [projectId]);

  const fetchLinks = useCallback(
    async (
      page: number,
      sortBy: SortField = "createdAt",
      order: SortOrder = "desc",
      options?: { signal?: AbortSignal }
    ) => {
      if (!projectId) {
        return;
      }

      const { signal } = options ?? {};

      const shouldAbort = () => signal?.aborted === true;

      try {
        setIsLoading(true);
        setErrorState(null);

        const response = await api.getLinks(projectId, page, sortBy, order);

        if (shouldAbort()) {
          return;
        }

        setLinks(response.links || []);
        setTotalPages(response.totalPages || 1);
        setCurrentPage(response.page || 1);
        setSortField((response.sortBy as SortField) || "createdAt");
        setSortOrder(response.sortOrder || "desc");
      } catch (err) {
        if (shouldAbort()) {
          return;
        }

        console.error("Error fetching links:", err);

        let errorMessage = t("links.list.load_error");
        if (err instanceof Error && err.message) {
          errorMessage = err.message;
        }

        setErrorState(errorMessage);
        if (onError) onError(errorMessage);

        setLinks([]);
        setTotalPages(1);
        setCurrentPage(1);
      } finally {
        if (!shouldAbort()) {
          setIsLoading(false);
        }
      }
    },
    [projectId, onError, t]
  );

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const abortController = new AbortController();
    fetchLinks(currentPage, sortField, sortOrder, {
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, [projectId, currentPage, sortField, sortOrder, fetchLinks]);

  useEffect(() => {
    setCurrentDomain(window.location.host);
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: SortField) => {
    const newOrder =
      field === sortField && sortOrder === "desc" ? "asc" : "desc";
    setSortField(field);
    setSortOrder(newOrder);
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await api.deleteLink(projectId, id);
      setLinks(links.filter((link) => link.id !== parseInt(id)));
      toast.success(t("links.list.delete_success"));
    } catch {
      toast.error(t("links.list.delete_error"));
    }
  };

  const handleCopyLink = (shortCode: string) => {
    const fullUrl = `${window.location.protocol}//${currentDomain}/l/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success(t("links.list.copy_success"));
  };
  const handleEditClick = (link: ReferralLink) => {
    onEditLinkClick?.(link);
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);
      return date.toLocaleDateString(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1 inline" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 inline" />
    );
  };

  if (isLoading) {
    return (
      <AnimatedCard>
        <Card className={glassCardStyle}>
          <CardContent className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </CardContent>
        </Card>
      </AnimatedCard>
    );
  }

  if (errorState) {
    return (
      <AnimatedCard>
        <Card className={glassCardStyle}>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div className="p-4 rounded-full bg-destructive/10 backdrop-blur-sm">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium">{t("links.list.load_error")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{errorState}</p>
            <Button
              variant="glass"
              className="ring-1 ring-white/10 hover:ring-white/20"
              onClick={() => fetchLinks(1, sortField, sortOrder)}
            >
              {t("links.list.load_error_cta")}
            </Button>
          </CardContent>
        </Card>
      </AnimatedCard>
    );
  }

  if (links?.length === 0) {
    return (
      <AnimatedCard>
        <Card className={glassCardStyle}>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div className="p-4 rounded-full bg-muted/30 backdrop-blur-sm">
              <Plus className="h-8 w-8 text-primary/70" />
            </div>
            <h3 className="text-lg font-medium">{t("links.list.empty_title")}</h3>
            <p className="text-muted-foreground">
              {t("links.list.empty_description")}
            </p>
            <Button onClick={onAddLinkClick}>
              <Plus className="h-4 w-4" />
              {t("links.list.create")}
            </Button>
          </CardContent>
        </Card>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("links.list.title")}
        </h2>
        <Button onClick={onAddLinkClick}>
          <Plus className="h-4 w-4" />
          {t("links.list.create")}
        </Button>
      </div>

      <Card className={glassCardStyle}>
        <CardContent className="px-6 py-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-white/10">
                  <TableHead className="font-semibold">
                    {t("links.list.name")}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {t("links.list.referral_url")}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {t("links.list.short_url")}
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    {t("links.list.clicks")}
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer select-none"
                    onClick={() => handleSort("createdAt")}
                  >
                    {t("links.list.created_at")}{" "}
                    {getSortIcon("createdAt")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("links.list.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links?.map((link, index) => (
                  <motion.tr
                    key={link.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="font-medium">{link.name}</TableCell>
                    <TableCell className="truncate max-w-xs text-muted-foreground">
                      {link.baseUrl}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center">
                        <div className="flex items-center border rounded-md px-3 py-1 bg-muted/30">
                          <span className="text-sm">{currentDomain}/l/</span>
                          <span className="font-medium text-sm">
                            {link.shortCode}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 ml-1"
                          onClick={() => handleCopyLink(link.shortCode)}
                          title={t("links.list.copy")}
                          aria-label={t("links.list.copy")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{link.clicks}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(link.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditClick(link)}
                          aria-label={t("links.breadcrumb.edit")}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:text-destructive"
                              aria-label={t("links.list.delete_confirm")}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("links.list.delete_title")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("links.list.delete_description")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("links.list.cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() =>
                                  handleDeleteLink(link.id.toString())
                                }
                              >
                                {t("links.list.delete_confirm")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between py-4 border-t border-white/10">
          <div className="text-sm text-muted-foreground">
            {t("links.list.page_info", {
              current: currentPage,
              total: totalPages,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="sm"
              className="ring-1 ring-white/10 hover:ring-white/20"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label={t("links.list.previous")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="glass"
              size="sm"
              className="ring-1 ring-white/10 hover:ring-white/20"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label={t("links.list.next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </AnimatedCard>
  );
}
