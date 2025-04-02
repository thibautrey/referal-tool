export interface ReferralLink {
  id: number;
  name: string;
  shortCode: string;
  baseUrl: string;
  projectId: number;
  clicks: number;
  conversions: number;
  conversionRate?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    LinkVisit?: number;
  };
}

export interface CountryVisit {
  country: string;
  count: number;
}

export interface DateVisit {
  date: string;
  count: number;
}

export interface RuleVisit {
  ruleId: number;
  count: number;
  ruleInfo: {
    id: number;
    redirectUrl: string;
    countries: string[];
    name?: string;
    description?: string;
    type?: string;
    status?: string;
  } | null;
}

export interface LinkAnalyticsData {
  totalVisits: number;
  visitsByCountry: CountryVisit[];
  visitsByDate: DateVisit[];
  visitsByRule?: RuleVisit[];
}
