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

export interface LinkFormData {
  name: string;
  baseUrl: string;
  shortCode: string;
  rules: GeoRule[];
  deviceRules: DeviceRule[];
}

export type LinkFormProps = {
  formData: LinkFormData;
  onFormChange: (data: Partial<LinkFormData>) => void;
  onSubmit: (data: LinkFormData) => void;
};
