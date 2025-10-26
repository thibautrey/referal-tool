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
import { useAppTranslation } from "@/i18n";
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
  const { t } = useAppTranslation();

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
        setError(t("links.errors.load"));
        setLinks([]);
      } finally {
        setLoadingLinks(false);
      }
    };

    fetchLinks();
  }, [currentProjectId, t]);

  const totalClicks = analyticsData?.totalVisits || 0;

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

        const formattedData: LinkAnalyticsData = {
          totalVisits: apiData.totalVisits,
          visitsByCountry: apiData.visitsByCountry,
          visitsByDate: apiData.visitsByDate || [],
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
        setError(t("analytics.error_description"));
      } finally {
        setLoading(false);
      }
    };

    if (currentProjectId || selectedLink) {
      fetchAnalytics();
    }
  }, [selectedLink, timeRange, currentProjectId, t]);

  if (!currentProjectId) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>{t("analytics.no_project_title")}</CardTitle>
          <CardDescription>
            {t("analytics.no_project_description")}
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
          <CardTitle>{t("analytics.error_title")}</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{t("analytics.error_description")}</p>
        </CardContent>
      </Card>
    );
  }

  if (links.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="w-[90%] max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>{t("links.empty.title")}</CardTitle>
            <CardDescription>
              {t("links.empty.description")}
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
            {t("analytics.header.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("analytics.header.subtitle")}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>{t("analytics.header.total_clicks")}</CardDescription>
              <CardTitle className="text-4xl font-bold">
                {totalClicks}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>
                {t("analytics.header.number_of_links")}
              </CardDescription>
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
              {t("analytics.details.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("analytics.details.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 p-4 bg-secondary/10 rounded-lg">
            <Select
              value={selectedLink || "all"}
              onValueChange={setSelectedLink}
            >
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder={t("analytics.filters.link_label")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("analytics.filters.all_links")}
                </SelectItem>
                {links.map((link) => (
                  <SelectItem key={link.id} value={link.id.toString()}>
                    {link.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder={t("analytics.filters.time_label")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t("analytics.filters.day")}</SelectItem>
                <SelectItem value="week">{t("analytics.filters.week")}</SelectItem>
                <SelectItem value="month">{t("analytics.filters.month")}</SelectItem>
                <SelectItem value="year">{t("analytics.filters.year")}</SelectItem>
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
                {t("analytics.tabs.visits")}
              </TabsTrigger>
              <TabsTrigger value="countries" className="px-6">
                {t("analytics.tabs.countries")}
              </TabsTrigger>
              {analyticsData.visitsByRule &&
                analyticsData.visitsByRule.length > 0 && (
                  <TabsTrigger value="rules" className="px-6">
                    {t("analytics.tabs.rules")}
                  </TabsTrigger>
                )}
            </TabsList>

            <TabsContent value="visits">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>{t("analytics.charts.visits_over_time")}</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <LineChart
                    data={(analyticsData.visitsByDate || []).map((item) => ({
                      date: new Date(item.date).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                        }
                      ),
                      visits: item.count,
                    }))}
                    index="date"
                    categories={["visits"]}
                    colors={["blue"]}
                    valueFormatter={(value) =>
                      t("analytics.charts.value_visits", { count: value })
                    }
                    showLegend={false}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="countries">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t("analytics.charts.distribution_country")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PieChart
                      data={analyticsData.visitsByCountry.map((item) => ({
                        name: item.country || t("common.unknown"),
                        value: item.count,
                      }))}
                      index="name"
                      category="value"
                      valueFormatter={(value) =>
                        t("analytics.charts.value_visits", { count: value })
                      }
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("analytics.charts.top_countries")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={analyticsData.visitsByCountry
                        .slice(0, 5)
                        .map((item) => ({
                          country: item.country || t("common.unknown"),
                          visits: item.count,
                        }))}
                      index="country"
                      categories={["visits"]}
                      colors={["blue"]}
                      valueFormatter={(value) =>
                        t("analytics.charts.value_visits", { count: value })
                      }
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
                      <CardTitle>
                        {t("analytics.charts.rules_performance")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BarChart
                        data={analyticsData.visitsByRule.map((item) => ({
                          rule: item.ruleInfo
                            ? t("analytics.charts.rule_label", {
                                id: item.ruleId,
                                url: item.ruleInfo.redirectUrl,
                              })
                            : t("analytics.charts.rule_fallback", {
                                id: item.ruleId,
                              }),
                          visits: item.count,
                        }))}
                        index="rule"
                        categories={["visits"]}
                        colors={["blue"]}
                        valueFormatter={(value) =>
                          t("analytics.charts.value_visits", { count: value })
                        }
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
              {t("analytics.empty_title")}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
