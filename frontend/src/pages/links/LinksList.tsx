import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash,
  X,
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReferralLink } from "../types";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
type ApiSortField = "createdAt";
type ApiSortOrder = "asc" | "desc";
type ListSortField = "createdAt" | "name" | "clicks" | "expiresAt";
type ExpirationFilter = "all" | "expired" | "active" | "noExpiration";

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
  const [apiSortField, setApiSortField] = useState<ApiSortField>("createdAt");
  const [apiSortOrder, setApiSortOrder] = useState<ApiSortOrder>("desc");
  const [listSortField, setListSortField] = useState<ListSortField>("createdAt");
  const [listSortOrder, setListSortOrder] = useState<SortOrder>("desc");
  const [expirationFilter, setExpirationFilter] =
    useState<ExpirationFilter>("all");
  const [errorState, setErrorState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const previousProjectId = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useAppTranslation();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset to page 1 when search changes
      setCurrentPage(1);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      sortBy: ApiSortField = "createdAt",
      order: SortOrder = "desc",
      search?: string,
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

        const response = await api.getLinks(projectId, page, sortBy, order, 10, search);

        if (shouldAbort()) {
          return;
        }

        setLinks(response.links || []);
        setTotalPages(response.totalPages || 1);
        setCurrentPage(response.page || 1);
        setApiSortField((response.sortBy as ApiSortField) || "createdAt");
        setApiSortOrder(response.sortOrder || "desc");
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
    fetchLinks(currentPage, apiSortField, apiSortOrder, debouncedSearchQuery, {
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, [projectId, currentPage, apiSortField, apiSortOrder, debouncedSearchQuery, fetchLinks]);

  useEffect(() => {
    setCurrentDomain(window.location.host);
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleListSortOrder = () => {
    setListSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
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

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString(i18n.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const renderExpirationCell = (dateString?: string | null) => {
    if (!dateString) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("links.list.no_expiration")}
        </span>
      );
    }

    try {
      const date = new Date(dateString);
      const formatted = formatDateTime(dateString);
      const isExpired = date.getTime() <= Date.now();

      if (!formatted) {
        return (
          <span className="text-sm text-muted-foreground">
            {t("links.list.no_expiration")}
          </span>
        );
      }

      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{formatted}</span>
          <Badge
            variant={isExpired ? "destructive" : "secondary"}
            className="text-xs font-medium w-fit"
          >
            {isExpired
              ? t("links.list.expired")
              : t("links.list.expires_badge")}
          </Badge>
        </div>
      );
    } catch {
      return (
        <span className="text-sm text-muted-foreground">
          {t("links.list.no_expiration")}
        </span>
      );
    }
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredAndSortedLinks = [...(links ?? [])]
    .filter((link) => {
      if (!normalizedSearchQuery) return true;
      const shortUrl = `${currentDomain}/l/${link.shortCode}`.toLowerCase();
      return (
        link.name.toLowerCase().includes(normalizedSearchQuery) ||
        link.baseUrl.toLowerCase().includes(normalizedSearchQuery) ||
        link.shortCode.toLowerCase().includes(normalizedSearchQuery) ||
        shortUrl.includes(normalizedSearchQuery)
      );
    })
    .filter((link) => {
      if (expirationFilter === "all") return true;

      if (!link.expiresAt) {
        return expirationFilter === "noExpiration";
      }

      const isExpired = new Date(link.expiresAt).getTime() <= Date.now();
      if (expirationFilter === "expired") return isExpired;
      if (expirationFilter === "active") return !isExpired;
      return true;
    })
    .sort((a, b) => {
      const orderMultiplier = listSortOrder === "asc" ? 1 : -1;

      if (listSortField === "name") {
        return a.name.localeCompare(b.name, i18n.language) * orderMultiplier;
      }

      if (listSortField === "clicks") {
        return (a.clicks - b.clicks) * orderMultiplier;
      }

      if (listSortField === "expiresAt") {
        const aTime = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
        return (aTime - bTime) * orderMultiplier;
      }

      const aCreated = new Date(a.createdAt).getTime();
      const bCreated = new Date(b.createdAt).getTime();
      return (aCreated - bCreated) * orderMultiplier;
    });

  if (isLoading) {
    return (
      <AnimatedCard>
        <Card className={glassCardStyle}>
          <CardContent className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
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
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium">{t("links.list.load_error")}</h3>
            <p className="max-w-md mx-auto text-muted-foreground">{errorState}</p>
            <Button
              variant="glass"
              className="ring-1 ring-white/10 hover:ring-white/20"
              onClick={() => fetchLinks(1, apiSortField, apiSortOrder)}
            >
              {t("links.list.load_error_cta")}
            </Button>
          </CardContent>
        </Card>
      </AnimatedCard>
    );
  }

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    searchInputRef.current?.focus();
  };

  if (links?.length === 0 && !debouncedSearchQuery) {
    return (
      <AnimatedCard>
        <Card className={glassCardStyle}>
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div className="p-4 rounded-full bg-muted/30 backdrop-blur-sm">
              <Plus className="w-8 h-8 text-primary/70" />
            </div>
            <h3 className="text-lg font-medium">{t("links.list.empty_title")}</h3>
            <p className="text-muted-foreground">
              {t("links.list.empty_description")}
            </p>
            <Button onClick={onAddLinkClick}>
              <Plus className="w-4 h-4" />
              {t("links.list.create")}
            </Button>
          </CardContent>
        </Card>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("links.list.title")}
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t("links.list.search_placeholder") || "Rechercher..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 text-sm border rounded-md sm:w-64 border-input bg-background pl-9 pr-9 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute -translate-y-1/2 right-3 top-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button onClick={onAddLinkClick}>
            <Plus className="w-4 h-4" />
            {t("links.list.create")}
          </Button>
        </div>
      </div>

      <Card className={glassCardStyle}>
        <CardContent className="px-6 py-0">
          <div className="flex flex-col gap-3 py-4 border-b border-white/10 md:flex-row md:items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("links.list.search_placeholder")}
                className="pl-9 pr-9"
                aria-label={t("links.list.search_placeholder")}
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select
              value={expirationFilter}
              onValueChange={(value) =>
                setExpirationFilter(value as ExpirationFilter)
              }
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("links.list.filter_all")}</SelectItem>
                <SelectItem value="active">{t("links.list.filter_active")}</SelectItem>
                <SelectItem value="expired">{t("links.list.filter_expired")}</SelectItem>
                <SelectItem value="noExpiration">
                  {t("links.list.filter_no_expiration")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={listSortField}
              onValueChange={(value) => setListSortField(value as ListSortField)}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">{t("links.list.sort_created_at")}</SelectItem>
                <SelectItem value="name">{t("links.list.sort_name")}</SelectItem>
                <SelectItem value="clicks">{t("links.list.sort_clicks")}</SelectItem>
                <SelectItem value="expiresAt">{t("links.list.sort_expiration")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={toggleListSortOrder}
              aria-label={t("links.list.sort_order")}
              className="w-full md:w-auto"
            >
              {listSortOrder === "asc"
                ? t("links.list.sort_asc")
                : t("links.list.sort_desc")}
            </Button>
          </div>
          {filteredAndSortedLinks.length === 0 && debouncedSearchQuery ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-4 py-12">
              <div className="p-4 rounded-full bg-muted/30 backdrop-blur-sm">
                <Search className="w-8 h-8 text-primary/70" />
              </div>
              <h3 className="text-lg font-medium">
                {t("links.list.no_search_results_title") || "Aucun résultat"}
              </h3>
              <p className="max-w-md text-muted-foreground">
                {t("links.list.no_search_results_description") || `Aucun lien ne correspond à "${debouncedSearchQuery}"`}
              </p>
              <Button variant="outline" onClick={handleClearSearch}>
                <X className="w-4 h-4 mr-2" />
                {t("links.list.clear_search") || "Effacer la recherche"}
              </Button>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b hover:bg-transparent border-white/10">
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
                  <TableHead className="font-semibold">
                    {t("links.list.created_at")}
                  </TableHead>
                  <TableHead className="font-semibold">
                    {t("links.list.expiration")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("links.list.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedLinks.map((link, index) => (
                  <motion.tr
                    key={link.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="transition-colors hover:bg-white/5"
                  >
                    <TableCell className="font-medium">{link.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {link.baseUrl}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center">
                        <div className="flex items-center px-3 py-1 border rounded-md bg-muted/30">
                          <span className="text-sm">{currentDomain}/l/</span>
                          <span className="text-sm font-medium">
                            {link.shortCode}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 ml-1"
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
                    <TableCell>{renderExpirationCell(link.expiresAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0"
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
                              className="w-8 h-8 p-0 hover:text-destructive"
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
          )}
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
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="glass"
              size="sm"
              className="ring-1 ring-white/10 hover:ring-white/20"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label={t("links.list.next")}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </AnimatedCard>
  );
}
