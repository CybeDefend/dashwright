import { ApiKey, ApiKeyWithSecret, CreateApiKeyDto } from "../types";
import { apiClient } from "./apiClient";

export const apiKeyService = {
  async create(data: CreateApiKeyDto): Promise<ApiKeyWithSecret> {
    const response = await apiClient.post<ApiKeyWithSecret>("/api-keys", data);
    return response.data;
  },

  async getAll(): Promise<ApiKey[]> {
    const response = await apiClient.get<ApiKey[]>("/api-keys");
    return response.data;
  },

  async getOne(id: string): Promise<ApiKey> {
    const response = await apiClient.get<ApiKey>(`/api-keys/${id}`);
    return response.data;
  },

  async revoke(id: string): Promise<void> {
    await apiClient.patch(`/api-keys/${id}/revoke`);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api-keys/${id}`);
  },
};
