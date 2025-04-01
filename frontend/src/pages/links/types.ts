export interface LinkFormData {
  name: string;
  url: string;
}

export type LinkFormProps = {
  formData: LinkFormData;
  onFormChange: (data: Partial<LinkFormData>) => void;
  onSubmit: (data: LinkFormData) => void;
};
