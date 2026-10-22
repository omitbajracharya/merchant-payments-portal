import { UserRole } from './auth.model';

export type SensitiveFieldName =
  | 'TAX_ID_EIN'
  | 'BANK_ACCOUNT_NUMBER'
  | 'BANK_ROUTING_NUMBER'
  | 'BENEFICIAL_OWNER_SSN';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'REVEAL_SENSITIVE_DATA' | 'SUBMIT_DECISION' | 'REASSIGN_APPLICATION' | 'TOKEN_REFRESH';
  targetApplicationId?: string;
  targetApplicationNumber?: string;
  sensitiveField?: SensitiveFieldName;
  reason?: string;
  ipAddress?: string;
}

