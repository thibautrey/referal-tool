// Simple wrapper for fetch with authentication token management

import { GeoRule } from "@/pages/links/AddLinkForm";
import { ReferralLink } from "@/pages/types";

// API URL is always at /api under the same domain
const API_BASE_URL = "/api";

// Type for request options
interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

// Type for the response
export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  status: number;
}

// Type for API errors
export interface ApiError {
  status?: number;
  message?: string;
  data?: unknown;
}

// Type for the response of the links API
export interface LinksResponse {
  links: ReferralLink[];
  total: number;
  page: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Types for statistics
export interface RuleInfo {
  id: number;
  redirectUrl: string;
  countries: string[];
  name?: string;
  description?: string;
  type?: string;
  status?: "active" | "inactive";
}

export interface VisitStats {
  totalVisits: number;
  visitsByCountry: { country: string; count: number }[];
  visitsByDate: { date: string; count: number }[];
  visitsByRule?: { ruleId: number; count: number; ruleInfo: RuleInfo | null }[];
}

export interface DashboardStats {
  totalLinks: number;
  totalVisits: number;
  last24HoursVisits: number;
  topCountries: { country: string; visits: number }[];
  topLinks: { linkId: number; visits: number; details: ReferralLink }[];
}

export interface ProjectOwner {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  role?: string;
  owner?: ProjectOwner | null;
}

export interface ProjectMemberUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface ProjectMember {
  id: number;
  role: string;
  createdAt: string;
  user: ProjectMemberUser;
}

export interface ProjectMembersResponse {
  owner: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  members: ProjectMember[];
}

// Class to manage API calls
class Api {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.headers = {
      "Content-Type": "application/json",
    };
  }

  // Method to set the authorization header
  setAuthHeader(token: string): void {
    this.headers["Authorization"] = `Bearer ${token}`;
  }

  // Method to remove the authorization header
  removeAuthHeader(): void {
    delete this.headers["Authorization"];
  }

  // Private method to build the full URL
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${
      endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    }`;
  }

  // Generic method for requests
  private async request<T>(
    endpoint: string,
    method: string,
    data?: unknown,
    projectId?: number | null
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);

    const options: RequestOptions = {
      method,
      headers: { ...this.headers },
    };

    try {
      const token = localStorage.getItem("auth_token");

      if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
      }

      if (projectId) {
        options.headers["X-Project-ID"] = projectId.toString();
      }

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          data: responseData,
          message: responseData.message || "An error occurred",
        };
      }

      return {
        ...responseData,
        data: responseData.data,
        message: responseData.message,
        status: response.status,
      };
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw {
        status: 500,
        message: (error as Error).message || "Network error",
        data: null,
      };
    }
  }

  // Public methods for different types of requests
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "GET");
  }

  async post<T, D = unknown>(
    endpoint: string,
    data: D,
    projectId?: number | null
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "POST", data, projectId);
  }

  async put<T, D = unknown>(
    endpoint: string,
    data: D
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "PUT", data);
  }

  async delete<T>(
    endpoint: string,
    projectId?: number | null
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "DELETE", undefined, projectId);
  }

  async getLinks(
    projectId: number,
    page: number = 1,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
    limit: number = 10
  ): Promise<LinksResponse> {
    const response = await this.get<LinksResponse>(
      `/projects/${projectId}/links?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    );
    return response.data;
  }

  async deleteLink(projectId: number, id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/links/${id}`, projectId);
  }

  // Method to get visit statistics for a specific link
  async getLinkStats(
    linkId: number,
    timeRange: string = "week",
    startDate?: Date,
    endDate?: Date,
    countries?: string[]
  ): Promise<VisitStats> {
    let endpoint = `/analytics/visits?linkId=${linkId}&timeRange=${timeRange}`;

    if (startDate) {
      endpoint += `&startDate=${startDate.toISOString()}`;
    }

    if (endDate) {
      endpoint += `&endDate=${endDate.toISOString()}`;
    }

    if (countries && countries.length) {
      endpoint += `&countries=${countries.join(",")}`;
    }

    const response = await this.get<VisitStats>(endpoint);
    return response.data;
  }

  // Method to get visit statistics for a project
  async getProjectStats(
    projectId: number,
    timeRange: string = "week",
    startDate?: Date,
    endDate?: Date,
    countries?: string[]
  ): Promise<VisitStats> {
    let endpoint = `/analytics/visits?projectId=${projectId}&timeRange=${timeRange}`;

    if (startDate) {
      endpoint += `&startDate=${startDate.toISOString()}`;
    }

    if (endDate) {
      endpoint += `&endDate=${endDate.toISOString()}`;
    }

    if (countries && countries.length) {
      endpoint += `&countries=${countries.join(",")}`;
    }

    const response = await this.get<VisitStats>(endpoint);
    return response.data;
  }

  // Method to get dashboard statistics
  async getDashboardStats(projectId?: number): Promise<DashboardStats> {
    const endpoint = projectId
      ? `/analytics/dashboard?projectId=${projectId}`
      : "/analytics/dashboard";

    const response = await this.get<DashboardStats>(endpoint);
    return response.data;
  }

  async getProject(projectId: number): Promise<Project> {
    const response = await this.get<Project>(`/projects/${projectId}`);
    return response.data;
  }

  // Method to update a project
  async updateProject(
    projectId: number,
    data: {
      name?: string;
      description?: string;
    }
  ): Promise<ApiResponse<Project>> {
    return this.put<Project, typeof data>(`/projects/${projectId}`, data);
  }

  async deleteProject(projectId: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/projects/${projectId}`);
  }

  async getProjectMembers(
    projectId: number
  ): Promise<ApiResponse<ProjectMembersResponse>> {
    return this.get<ProjectMembersResponse>(
      `/projects/${projectId}/members`
    );
  }

  async addProjectMember(
    projectId: number,
    email: string
  ): Promise<ApiResponse<ProjectMember>> {
    return this.post<ProjectMember>(`/projects/${projectId}/members`, { email });
  }

  async removeProjectMember(
    projectId: number,
    memberId: number
  ): Promise<ApiResponse<void>> {
    return this.delete<void>(`/projects/${projectId}/members/${memberId}`);
  }

  async updateLink(
    linkId: number,
    data: {
      name: string;
      baseUrl: string;
      rules: GeoRule[];
      deviceRules?: { deviceType: string; redirectUrl: string }[];
      isPasswordProtected?: boolean;
      password?: string;
      removePassword?: boolean;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
      utmContent?: string;
      expiresAt?: string | null;
    }
  ): Promise<ApiResponse<ReferralLink>> {
    const transformedData = {
      ...data,
      name: data.name,
      baseUrl: data.baseUrl,
      rules: data.rules.map((rule) => ({
        redirectUrl: rule.redirectUrl,
        countries: rule.countries,
      })),
      deviceRules: data.deviceRules || [],
      isPasswordProtected: data.isPasswordProtected,
      password: data.password,
      removePassword: data.removePassword,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmTerm: data.utmTerm,
      utmContent: data.utmContent,
      expiresAt: data.expiresAt,
    };
    return this.put<ReferralLink>(`/links/${linkId}`, transformedData);
  }

  async createLink(
    projectId: number,
    data: {
      name: string;
      baseUrl: string;
      shortCode: string;
      rules: GeoRule[];
      deviceRules?: { deviceType: string; redirectUrl: string }[];
      isPasswordProtected?: boolean;
      password?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmTerm?: string;
      utmContent?: string;
      expiresAt?: string | null;
    }
  ): Promise<ApiResponse<ReferralLink>> {
    const transformedData = {
      name: data.name,
      baseUrl: data.baseUrl,
      shortCode: data.shortCode,
      rules: data.rules.map((rule) => ({
        redirectUrl: rule.redirectUrl,
        countries: rule.countries,
      })),
      deviceRules: data.deviceRules || [],
      isPasswordProtected: data.isPasswordProtected,
      password: data.password,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmTerm: data.utmTerm,
      utmContent: data.utmContent,
      expiresAt: data.expiresAt,
    };
    return this.post<ReferralLink>("/links", transformedData, projectId);
  }

  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.get<Project[]>("/projects");
  }

  async createProject(
    data: { name: string; description?: string | null }
  ): Promise<ApiResponse<Project>> {
    return this.post<Project, { name: string; description?: string | null }>(
      "/projects",
      data
    );
  }

  // Method to update user's theme preference
  async updateTheme(
    theme: "light" | "dark" | "system"
  ): Promise<ApiResponse<{ theme: string }>> {
    return this.post<{ theme: string }>("/users/theme", { theme });
  }

  // Method to get user's theme preference
  async getUserTheme(): Promise<string> {
    const response = await this.get<{ theme: string }>("/users/me");
    return response.data.theme || "system";
  }

  async updateLastProject(
    projectId: number
  ): Promise<ApiResponse<{ lastProjectId: number }>> {
    return this.post<{ lastProjectId: number }>("/users/last-project", {
      projectId,
    });
  }
}

export const api = new Api(API_BASE_URL);
