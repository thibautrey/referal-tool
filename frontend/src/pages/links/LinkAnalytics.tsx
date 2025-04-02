import { BarChart, LineChart, PieChart } from "@/components/ui/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkAnalyticsData, ReferralLink } from "../types";
import { LinksResponse, VisitStats, api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

export function LinkAnalytics() {
  const { currentProjectId } = useAuth();
  const [selectedLink, setSelectedLink] = useState<string | null>("all");
  const [timeRange, setTimeRange] = useState<string>("week");
  const [analyticsData, setAnalyticsData] = useState<LinkAnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLinks, setLoadingLinks] = useState<boolean>(false);
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load links data
  useEffect(() => {
    const fetchLinks = async () => {
      if (!currentProjectId) return;

      try {
        setLoadingLinks(true);
        setError(null);
        const response: LinksResponse = await api.getLinks(currentProjectId);
        setLinks(response.links);
      } catch (err) {
        console.error("Error loading links:", err);
        setError("Failed to load links data");
        setLinks([]);
      } finally {
        setLoadingLinks(false);
      }
    };

    fetchLinks();
  }, [currentProjectId]);

  // Calculate aggregated metrics
  const totalClicks = analyticsData?.totalVisits || 0;

  // Load detailed analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentProjectId) return;

      try {
        setLoading(true);
        let apiData: VisitStats;

        if (selectedLink && selectedLink !== "all") {
          apiData = await api.getLinkStats(parseInt(selectedLink), timeRange);
        } else {
          apiData = await api.getProjectStats(currentProjectId, timeRange);
        }

        // Convert API data to LinkAnalyticsData format
        const formattedData: LinkAnalyticsData = {
          totalVisits: apiData.totalVisits,
          visitsByCountry: apiData.visitsByCountry,
          visitsByDate: apiData.visitsByDate || [], // Ensure we have an array even if API returns empty
          visitsByRule: apiData.visitsByRule?.map((rule) => ({
            ruleId: rule.ruleId,
            count: rule.count,
            ruleInfo: rule.ruleInfo
              ? {
                  id: rule.ruleInfo.id,
                  redirectUrl: rule.ruleInfo.redirectUrl,
                  countries: rule.ruleInfo.countries,
                }
              : null,
          })),
        };

        setAnalyticsData(formattedData);
      } catch (error) {
        console.error("Error loading statistics:", error);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    if (currentProjectId || selectedLink) {
      fetchAnalytics();
    }
  }, [selectedLink, timeRange, currentProjectId]);

  if (!currentProjectId) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>No Project Selected</CardTitle>
          <CardDescription>
            Please select a project to view analytics
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loadingLinks) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Please try again later or contact support if the issue persists.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (links.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="w-[90%] max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>No links available</CardTitle>
            <CardDescription>
              Create your first referral link to start seeing analytics
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <section>
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Links Performance
          </h2>
          <p className="text-muted-foreground">
            Statistics and performance of all your referral links.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Clicks</CardDescription>
              <CardTitle className="text-4xl font-bold">
                {totalClicks}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Number of Links</CardDescription>
              <CardTitle className="text-4xl font-bold">
                {links.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Detailed Analytics
            </h2>
            <p className="text-muted-foreground">
              View detailed performance by link and time period.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 p-4 bg-secondary/10 rounded-lg">
            <Select
              value={selectedLink || "all"}
              onValueChange={setSelectedLink}
            >
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Select a link" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All links</SelectItem>
                {links.map((link) => (
                  <SelectItem key={link.id} value={link.id.toString()}>
                    {link.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 mt-6">
            <Skeleton className="h-[400px] w-full" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        ) : analyticsData ? (
          <Tabs defaultValue="visits" className="mt-6">
            <TabsList className="mb-6 w-full justify-start gap-4">
              <TabsTrigger value="visits" className="px-6">
                Visits
              </TabsTrigger>
              <TabsTrigger value="countries" className="px-6">
                Countries
              </TabsTrigger>
              {analyticsData.visitsByRule &&
                analyticsData.visitsByRule.length > 0 && (
                  <TabsTrigger value="rules" className="px-6">
                    Rules
                  </TabsTrigger>
                )}
            </TabsList>

            <TabsContent value="visits">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Visits Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <LineChart
                    data={(analyticsData.visitsByDate || []).map((item) => ({
                      date: new Date(item.date).toLocaleDateString(),
                      visits: item.count,
                    }))}
                    index="date"
                    categories={["visits"]}
                    colors={["blue"]}
                    valueFormatter={(value) => `${value} visits`}
                    showLegend={false}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="countries">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution by Country</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PieChart
                      data={analyticsData.visitsByCountry.map((item) => ({
                        name: item.country || "Unknown",
                        value: item.count,
                      }))}
                      index="name"
                      category="value"
                      valueFormatter={(value) => `${value} visits`}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Top Countries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={analyticsData.visitsByCountry
                        .slice(0, 5)
                        .map((item) => ({
                          country: item.country || "Unknown",
                          visits: item.count,
                        }))}
                      index="country"
                      categories={["visits"]}
                      colors={["blue"]}
                      valueFormatter={(value) => `${value} visits`}
                      showLegend={false}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {analyticsData.visitsByRule &&
              analyticsData.visitsByRule.length > 0 && (
                <TabsContent value="rules">
                  <Card>
                    <CardHeader>
                      <CardTitle>Redirection Rules Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChart
                        data={analyticsData.visitsByRule.map((item) => ({
                          rule: item.ruleInfo
                            ? `Rule ${item.ruleId} (${item.ruleInfo.redirectUrl})`
                            : `Rule ${item.ruleId}`,
                          visits: item.count,
                        }))}
                        index="rule"
                        categories={["visits"]}
                        colors={["blue"]}
                        valueFormatter={(value) => `${value} visits`}
                        showLegend={false}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
          </Tabs>
        ) : (
          <div className="flex h-[400px] items-center justify-center bg-secondary/10 rounded-lg mt-6">
            <p className="text-muted-foreground text-lg">
              No analytics data available
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
