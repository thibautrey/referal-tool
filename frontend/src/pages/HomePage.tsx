import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Link as LinkIcon,
  PlusCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { Link } from "react-router-dom";
import { ReferralLink } from "./types";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// Style pour le glassmorphism
const glassCardStyle =
  "bg-opacity-30 backdrop-blur-lg border-opacity-20 bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-800/40 dark:to-gray-900/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300";

// Composant d'animation pour les cartes
const AnimatedCard = ({
  children,
  index = 0,
  className,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function HomePage() {
  const { currentProjectId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalLinks: number;
    totalClicks: number;
    recentClicks: { date: string; count: number }[];
  }>({
    totalLinks: 0,
    totalClicks: 0,
    recentClicks: [],
  });
  const [topLinks, setTopLinks] = useState<ReferralLink[]>([]);

  const fetchDashboardData = async () => {
    if (!currentProjectId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Charger les statistiques du projet
      const projectStats = await api.getProjectStats(currentProjectId, "week");

      try {
        // Charger les liens - traité séparément pour éviter qu'une erreur ici
        // n'empêche l'affichage des autres données
        const linksResponse = await api.getLinks(
          currentProjectId,
          1,
          "clicks",
          "desc"
        );

        setStats({
          totalLinks: linksResponse?.links?.length || 0,
          totalClicks: projectStats.totalVisits,
          recentClicks: projectStats.visitsByDate.map((item) => ({
            date: new Date(item.date).toLocaleDateString(),
            count: item.count,
          })),
        });

        // Récupérer les 5 meilleurs liens
        setTopLinks(linksResponse?.links?.slice(0, 5) || []);
      } catch (linkError) {
        console.error("Erreur lors du chargement des liens:", linkError);

        // On continue avec les statistiques mais sans les données de liens
        setStats({
          totalLinks: 0,
          totalClicks: projectStats.totalVisits,
          recentClicks: projectStats.visitsByDate.map((item) => ({
            date: new Date(item.date).toLocaleDateString(),
            count: item.count,
          })),
        });
        setTopLinks([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données du tableau de bord:",
        error
      );

      let errorMessage =
        "Une erreur est survenue lors du chargement des données";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        type ErrorWithDetails = {
          error?: { name?: string };
          name?: string;
          message?: string;
        };
        const errorObj = error as Record<string, ErrorWithDetails | string>;
        if (
          typeof errorObj.error === "object" &&
          errorObj.error?.name === "PrismaClientValidationError"
        ) {
          errorMessage =
            "Erreur de validation de la base de données. Veuillez contacter le support.";
        } else if (typeof errorObj.message === "string") {
          errorMessage = errorObj.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentProjectId]);

  if (isLoading) {
    return (
      <div className="space-y-6 relative z-10">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Dashboard
        </h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className={cn("h-[180px] w-full", glassCardStyle)} />
          <Skeleton className={cn("h-[180px] w-full", glassCardStyle)} />
          <Skeleton className={cn("h-[180px] w-full", glassCardStyle)} />
          <Skeleton
            className={cn("h-[300px] w-full md:col-span-2", glassCardStyle)}
          />
          <Skeleton className={cn("h-[300px] w-full", glassCardStyle)} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 relative z-10">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Dashboard
        </h1>
        <Card className={cn("w-full", glassCardStyle)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Loading failed
            </CardTitle>
            <CardDescription>Data could not be loaded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-md bg-destructive/10 mb-4 backdrop-blur-sm">
              <p className="text-sm">{error}</p>
            </div>
            <p className="text-muted-foreground mb-4">
              This could be due to a temporary issue or a server error.
            </p>
            <Button onClick={fetchDashboardData} variant="glass">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentProjectId) {
    return (
      <div className="space-y-6 relative z-10">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Dashboard
        </h1>
        <Card className={cn("w-full", glassCardStyle)}>
          <CardHeader>
            <CardTitle>Welcome to your referral tool</CardTitle>
            <CardDescription>
              Start by creating or selecting a project
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-center text-muted-foreground mb-6">
              No project is currently selected. Please create one or select an
              existing one to get started.
            </p>
            <Button
              asChild
              variant="glass"
              className="ring-1 ring-white/10 hover:ring-white/20"
            >
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Manage projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10">
      <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        Dashboard
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatedCard index={0}>
          <Card className={cn(glassCardStyle, "group hover:-translate-y-1")}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Referal links
                <LinkIcon className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" />
              </CardTitle>
              <CardDescription>Total of created links</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                {stats.totalLinks}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto glass-button"
                asChild
              >
                <Link to="/links">
                  View all <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={1}>
          <Card className={cn(glassCardStyle, "group hover:-translate-y-1")}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Total clicks
                <BarChart3 className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" />
              </CardTitle>
              <CardDescription>Global performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                {stats.totalClicks}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto glass-button"
                asChild
              >
                <Link to="/analytics">
                  View analytics <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={2}>
          <Card className={cn(glassCardStyle, "group hover:-translate-y-1")}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Quick Actions
                <PlusCircle className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" />
              </CardTitle>
              <CardDescription>Access to main features</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="glass"
                className="ring-1 ring-white/10 hover:ring-white/20"
                asChild
              >
                <Link to="/links?tab=add-link">Create a new link</Link>
              </Button>
              <Button
                variant="glass"
                className="ring-1 ring-white/10 hover:ring-white/20"
                asChild
              >
                <Link to="/analytics">View statistics</Link>
              </Button>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={3}>
          <Card
            className={cn(
              glassCardStyle,
              "group hover:-translate-y-1 col-span-2"
            )}
          >
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Last 7 days clicks</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {stats.recentClicks.length > 0 ? (
                <LineChart
                  data={stats.recentClicks}
                  index="date"
                  categories={["count"]}
                  colors={["#7c3aed"]}
                  valueFormatter={(value) => `${value} clics`}
                  showLegend={false}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    No clicks recorded in the last 7 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard index={4}>
          <Card className={cn(glassCardStyle, "group hover:-translate-y-1")}>
            <CardHeader>
              <CardTitle>Best links</CardTitle>
              <CardDescription>Top 5 most clicked links</CardDescription>
            </CardHeader>
            <CardContent>
              {topLinks.length > 0 ? (
                <div className="space-y-4">
                  {topLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 rounded-md bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
                    >
                      <div className="truncate mr-4">
                        <p className="font-medium truncate">{link.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          /{link.shortCode}
                        </p>
                      </div>
                      <div className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {link.clicks} clicks
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-muted-foreground">
                  No links available yet
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto glass-button"
                asChild
              >
                <Link to="/links">
                  See all links <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </AnimatedCard>
      </div>
    </div>
  );
}
