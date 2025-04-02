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
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ReferralLink } from "../types";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface LinksListProps {
  onAddLinkClick: () => void;
  projectId: number;
  onError?: (message: string) => void;
}

type SortOrder = "asc" | "desc";
type SortField = "createdAt";

export function LinksList({
  onAddLinkClick,
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

  const fetchLinks = async (
    page: number,
    sortBy: SortField = "createdAt",
    order: SortOrder = "desc"
  ) => {
    try {
      setIsLoading(true);
      setErrorState(null);

      const response = await api.getLinks(projectId, page, sortBy, order);

      setLinks(response.links || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(response.page || 1);
      setSortField((response.sortBy as SortField) || "createdAt");
      setSortOrder(response.sortOrder || "desc");
    } catch (err) {
      console.error("Error fetching links:", err);

      // Format error message
      let errorMessage = "Unable to load links";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null) {
        const errorObj = err as Record<string, { name?: string } | string>;
        if (
          typeof errorObj.error === "object" &&
          errorObj.error?.name === "PrismaClientValidationError"
        ) {
          errorMessage = "Database validation error. Please contact support.";
        } else if (typeof errorObj.message === "string") {
          errorMessage = errorObj.message;
        }
      }

      setErrorState(errorMessage);
      if (onError) onError(errorMessage);

      // Set default values
      setLinks([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks(currentPage, sortField, sortOrder);
  }, [currentPage, sortField, sortOrder]);

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
      toast.success("Link deleted successfully");
    } catch {
      toast.error("An error occurred while deleting the link");
    }
  };

  const handleCopyLink = (shortCode: string) => {
    const fullUrl = `${window.location.protocol}//${currentDomain}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied to clipboard");
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
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
      <Card className="w-full">
        <CardContent className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (errorState) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <div className="p-4 rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-medium">Error Loading Links</h3>
          <p className="text-muted-foreground max-w-md mx-auto">{errorState}</p>
          <Button onClick={() => fetchLinks(1, sortField, sortOrder)}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (links?.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <div className="p-4 rounded-full bg-muted">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No links</h3>
          <p className="text-muted-foreground">
            Start by creating your first referral link
          </p>
          <Button onClick={onAddLinkClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight"></h2>
        <Button onClick={onAddLinkClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add link
        </Button>
      </div>

      <Card>
        <CardContent className="px-6 py-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Referral URL</TableHead>
                  <TableHead className="font-semibold">Short URL</TableHead>
                  <TableHead className="font-semibold text-right">
                    Clicks
                  </TableHead>
                  <TableHead
                    className="font-semibold cursor-pointer select-none"
                    onClick={() => handleSort("createdAt")}
                  >
                    Creation date {getSortIcon("createdAt")}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links?.map((link) => (
                  <TableRow key={link.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{link.name}</TableCell>
                    <TableCell className="truncate max-w-xs text-muted-foreground">
                      {link.baseUrl}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center">
                        <div className="flex items-center border rounded-md px-3 py-1 bg-muted/30">
                          <span className="text-sm">{currentDomain}/</span>
                          <span className="font-medium text-sm">
                            {link.shortCode}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 ml-1"
                          onClick={() => handleCopyLink(link.shortCode)}
                          title="Copy link"
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
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:text-destructive"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete link</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this link? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() =>
                                  handleDeleteLink(link.id.toString())
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
