export interface ApiKey {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface ApiKeyWithSecret extends ApiKey {
  key: string;
}

export interface CreateApiKeyDto {
  name: string;
  description?: string;
  expiresAt?: string;
}

export enum RoleType {
  ADMIN = 'admin',
  MAINTAINER = 'maintainer',
  VIEWER = 'viewer',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export interface Invitation {
  id: string;
  email: string;
  role: RoleType;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy?: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface InvitationWithUrl extends Invitation {
  invitationUrl: string;
}

export interface CreateInvitationDto {
  email: string;
  role: RoleType;
}

export interface AcceptInvitationDto {
  token: string;
  username: string;
  password: string;
  fullName: string;
}

export interface InvitationVerification {
  email: string;
  role: RoleType;
  organizationName: string;
  expiresAt: string;
}

export interface OrganizationMember {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles?: Array<{
    role: string;
    scope: string;
  }>;
}
