import { GeoRule } from "./links/AddLinkForm/types";

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
  rules: GeoRule[];
  deviceRules: DeviceRule[]; // Add this line
  _count?: {
    LinkVisit?: number;
  };
}

export interface TopLinkSummary {
  id: number;
  name: string;
  shortCode: string;
  visits: number;
  baseUrl?: string;
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

export interface Rule {
  id: number;
  redirectUrl: string;
  countries: string[];
  linkId: number;
}

export interface DeviceRule {
  id: number;
  redirectUrl: string;
  deviceType: string;
  devices: string[];
  linkId: number;
}
