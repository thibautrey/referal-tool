import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ReferralLink } from "../types";

interface LinkAnalyticsProps {
  links: ReferralLink[];
}

export function LinkAnalytics({ links }: LinkAnalyticsProps) {
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const totalConversions = links.reduce(
    (sum, link) => sum + link.conversions,
    0
  );
  const conversionRate =
    totalClicks > 0
      ? ((totalConversions / totalClicks) * 100).toFixed(2) + "%"
      : "0%";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Links Performance</CardTitle>
        <CardDescription>
          Statistics and performance of all your referral links.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Clicks</CardDescription>
                <CardTitle className="text-3xl">{totalClicks}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Conversions</CardDescription>
                <CardTitle className="text-3xl">{totalConversions}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Conversion Rate</CardDescription>
                <CardTitle className="text-3xl">{conversionRate}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Number of Links</CardDescription>
                <CardTitle className="text-3xl">{links.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
