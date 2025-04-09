export interface GeoRule {
  redirectUrl: string;
  region?: string;
  countries: string[];
}

export interface LinkFormData {
  id?: number;
  name: string;
  baseUrl: string;
  shortCode: string;
  rules?: GeoRule[];
}

export interface AddLinkFormProps {
  onSubmit: (data: LinkFormData) => Promise<void>;
  initialData?: {
    id: number;
    name: string;
    baseUrl: string;
    shortCode: string;
    rules: GeoRule[];
  };
  mode?: "add" | "edit";
}
