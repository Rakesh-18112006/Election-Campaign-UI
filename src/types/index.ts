export type UserRole = 'MAIN_ADMIN' | 'MAYOR' | 'CORPORATOR' | 'DIVISIONAL_INCHARGE' | 'WARD_MEMBER';
export type AccountStatus = 'active' | 'suspended' | 'pending';
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';
export type AreaType = 'district' | 'ward' | 'village' | 'street' | 'other';
export type RecordStatus = 'unassigned' | 'assigned' | 'visited' | 'not_visited';

export type PartyType = 'TDP' | 'YSRCP' | 'JANASENA' | 'BJP' | 'CONGRESS' | 'OTHER';

export interface PartyTheme {
  primary: string;
  dark: string;
  tint: string;
  accent: string;
}

export interface UserTheme extends PartyTheme {
  partyType: PartyType;
  partyName: string;
}

export interface Party {
  _id: string;
  name: string;
  description?: string;
  partyType?: PartyType;
  theme?: PartyTheme;
  adminUserId?: string | User;
  createdBy: string | User;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  name: string;
  username: string;
  role: UserRole;
  status: AccountStatus;
  partyId?: string | Party;
  parentUserId?: string | User;
  assignedScopeIds: string[];
  mustChangePassword: boolean;
  createdBy?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  _id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  createdBy: string | User;
  partyId?: string | Party;
  createdAt: string;
  updatedAt: string;
}

export interface GeographicArea {
  _id: string;
  name: string;
  areaType: AreaType;
  campaignId: string | Campaign;
  parentAreaId?: string | GeographicArea;
  managerIds: string[] | User[];
  status: 'active' | 'inactive';
  partyId?: string | Party;
  createdAt: string;
  updatedAt: string;
}

export interface VoterRecord {
  _id: string;
  campaignId: string | Campaign;
  geographicAreaId: string | GeographicArea;
  partyId?: string | Party;
  name: string;
  voterIdRef?: string;
  houseNumber?: string;
  phone?: string;
  address?: string;
  currentAssignmentId?: string | RecordAssignment;
  recordStatus: RecordStatus;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecordAssignment {
  _id: string;
  voterRecordId: string | VoterRecord;
  assignedUserId: string | User;
  assignedBy: string | User;
  assignmentStatus: 'active' | 'unassigned' | 'reassigned';
  assignedAt: string;
  unassignedAt?: string;
  reassignmentReason?: string;
}

export interface VisitEvent {
  _id: string;
  voterRecordId: string;
  campaignId: string;
  actorUserId: string | User;
  previousStatus: string;
  newStatus: 'visited' | 'not_visited' | 'correction';
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  capturedAt?: string;
  receivedAt: string;
  correctionReason?: string;
}

export interface AuditLog {
  _id: string;
  actorUserId: string | User;
  action: string;
  entityType: string;
  entityId?: string;
  relevantMetadata?: Record<string, unknown>;
  timestamp: string;
}

export interface DashboardStats {
  parties?: { total: number; active: number };
  mayors?: { total: number };
  campaigns: { total: number; active: number };
  records: {
    total: number;
    visited: number;
    notVisited: number;
    assigned: number;
    unassigned: number;
    completionRate: number;
  };
  users: { total: number; active: number; suspended: number };
  recentActivity: AuditLog[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
}
