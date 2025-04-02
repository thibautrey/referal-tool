import { LinkAnalytics } from "./links/LinkAnalytics";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      </div>

      <LinkAnalytics />
    </div>
  );
}
