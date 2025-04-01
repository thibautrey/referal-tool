import { api } from "../lib/api";

export interface CreateLinkDTO {
  name: string;
  baseUrl: string;
  rules?: {
    redirectUrl: string;
    countries: string[];
  }[];
}

interface Link {
  id: string;
  name: string;
  baseUrl: string;
  rules?: Rule[];
}

interface Rule {
  id: string;
  redirectUrl: string;
  countries: string[];
}

export const linkService = {
  async getProjectLinks(projectId: string): Promise<Link[]> {
    const { data } = await api.get<Link[]>(`/links/project/${projectId}`);
    return data;
  },

  async createLink(projectId: string, linkData: CreateLinkDTO): Promise<Link> {
    const { data } = await api.post<Link>(
      `/links/project/${projectId}`,
      linkData
    );
    return data;
  },

  async updateLink(
    id: string,
    linkData: Partial<CreateLinkDTO>
  ): Promise<Link> {
    const { data } = await api.put<Link>(`/links/${id}`, linkData);
    return data;
  },

  async deleteLink(id: string): Promise<void> {
    await api.delete(`/links/${id}`);
  },

  async addRule(
    linkId: string,
    rule: { redirectUrl: string; countries: string[] }
  ): Promise<Rule> {
    const { data } = await api.post<Rule>(`/links/${linkId}/rules`, rule);
    return data;
  },

  async updateRule(
    ruleId: string,
    rule: { redirectUrl: string; countries: string[] }
  ): Promise<Rule> {
    const { data } = await api.put<Rule>(`/links/rules/${ruleId}`, rule);
    return data;
  },

  async deleteRule(ruleId: string): Promise<void> {
    await api.delete(`/links/rules/${ruleId}`);
  },
};
