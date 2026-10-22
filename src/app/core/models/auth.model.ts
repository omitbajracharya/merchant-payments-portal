export type UserRole = 'SALES' | 'REVIEWER' | 'ADMIN';

export type Permission =
  | 'CREATE_APPLICATION'
  | 'EDIT_OWN_APPLICATION'
  | 'VIEW_ALL_APPLICATIONS'
  | 'VIEW_ASSIGNED_APPLICATIONS'
  | 'REVIEW_DECISION'
  | 'REASSIGN_APPLICATION'
  | 'REVEAL_SENSITIVE_DATA'
  | 'ACCESS_AUDIT_LOGS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  permissions: Permission[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
  tokenType: 'Bearer';
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

