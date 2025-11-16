import {
  Invitation,
  InvitationWithUrl,
  CreateInvitationDto,
  AcceptInvitationDto,
  InvitationVerification,
} from "../types";
import { apiClient } from "./apiClient";

export const invitationService = {
  async create(data: CreateInvitationDto): Promise<InvitationWithUrl> {
    const response = await apiClient.post<InvitationWithUrl>(
      "/invitations",
      data
    );
    return response.data;
  },

  async getAll(): Promise<Invitation[]> {
    const response = await apiClient.get<Invitation[]>("/invitations");
    return response.data;
  },

  async verify(token: string): Promise<InvitationVerification> {
    const response = await apiClient.get<InvitationVerification>(
      `/invitations/verify/${token}`
    );
    return response.data;
  },

  async accept(
    data: AcceptInvitationDto
  ): Promise<{ message: string; userId: string; username: string }> {
    const response = await apiClient.post("/invitations/accept", data);
    return response.data;
  },

  async revoke(id: string): Promise<void> {
    await apiClient.patch(`/invitations/${id}/revoke`);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/invitations/${id}`);
  },
};
