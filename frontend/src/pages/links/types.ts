import { GeoRule } from "./AddLinkForm";

export interface LinkFormData {
  name: string;
  baseUrl: string;
  shortCode: string;
  rules: GeoRule[];
}

export type LinkFormProps = {
  formData: LinkFormData;
  onFormChange: (data: Partial<LinkFormData>) => void;
  onSubmit: (data: LinkFormData) => void;
};
