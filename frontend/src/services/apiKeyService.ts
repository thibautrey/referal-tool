import { api } from "../lib/api";

export interface ApiKey {
  id: number;
  name: string;
  key: string;
  createdAt: string;
}

export const apiKeyService = {
  async list(): Promise<ApiKey[]> {
    const { data } = await api.get<ApiKey[]>("/api-keys");
    return data;
  },

  async create(name: string): Promise<ApiKey> {
    const { data } = await api.post<ApiKey>("/api-keys", { name });
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api-keys/${id}`);
  },
};
