import { GeoRule } from "./AddLinkForm";

export type DeviceType = "mobile" | "tablet" | "desktop" | "all";

export interface DeviceRule {
  redirectUrl: string;
  deviceType: DeviceType;
  devices: string[];
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
}

export interface UTMParametersType {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface LinkFormData extends UTMParametersType {
  id?: number;
  name: string;
  baseUrl: string;
  shortCode: string;
  rules: GeoRule[];
  deviceRules: DeviceRule[];
  isPasswordProtected?: boolean;
  password?: string;
}

export type LinkFormProps = {
  formData: LinkFormData;
  onFormChange: (data: Partial<LinkFormData>) => void;
  onSubmit: (data: LinkFormData) => void;
};
