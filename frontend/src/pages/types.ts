export interface ReferralLink {
  id: string;
  name: string;
  baseUrl: string;
  projectId: number;
  active: boolean;
  clicks: number;
  conversions: number;
  createdAt: Date;
  updatedAt: Date;
  shortCode: string;
  rules?: {
    id: number;
    redirectUrl: string;
    countries: string[];
    linkId: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
