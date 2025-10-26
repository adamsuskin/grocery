import { Request } from 'express';

/**
 * User entity representing a registered user in the system
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  reset_token?: string;
  reset_token_expires?: Date;
}

/**
 * User data returned to client (without sensitive fields)
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

/**
 * JWT token payload structure
 */
export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Token pair for authentication
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Registration request body
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Refresh token request body
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  details?: unknown;
  statusCode: number;
}

/**
 * Standard API success response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Forgot password request body
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request body
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * List permission levels (matching database schema)
 * - owner: Full control over the list (can delete, modify, manage members)
 * - editor: Can add, edit, and delete items in the list
 * - viewer: Can only view items in the list
 */
export type PermissionLevel = 'owner' | 'editor' | 'viewer';

/**
 * @deprecated Use PermissionLevel instead
 * Legacy type for backwards compatibility
 */
export type ListPermission = 'view' | 'edit' | 'admin';

/**
 * List entity representing a grocery list
 */
export interface List {
  id: string;
  name: string;
  owner_id: string;
  color: string;
  icon: string;
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
  archived_at?: Date;
  invite_token?: string;
  invite_expires_at?: Date;
}

/**
 * List member entity (matching database schema)
 */
export interface ListMember {
  list_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  joined_at: Date;
  invited_by?: string;
  last_accessed_at?: Date;
}

/**
 * List member with user information
 */
export interface ListMemberWithUser extends ListMember {
  user: UserResponse;
}

/**
 * List data returned to client
 */
export interface ListResponse {
  id: string;
  name: string;
  owner_id: string;
  color: string;
  icon: string;
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
  archived_at?: Date;
  permission?: PermissionLevel;
  members?: ListMemberWithUser[];
  is_pinned?: boolean;
  pinned_at?: Date;
}

/**
 * Create list request body
 */
export interface CreateListRequest {
  name: string;
  color?: string;
  icon?: string;
}

/**
 * Update list request body
 */
export interface UpdateListRequest {
  name?: string;
  color?: string;
  icon?: string;
}

/**
 * Add list member request body
 */
export interface AddListMemberRequest {
  userId: string;
  permission?: ListPermission;
}

/**
 * Update list member request body
 */
export interface UpdateListMemberRequest {
  permission: ListPermission;
}

/**
 * User search query parameters
 */
export interface UserSearchQuery {
  email: string;
}

/**
 * User search response
 */
export interface UserSearchResponse {
  users: UserResponse[];
}

/**
 * Activity action types
 */
export type ActivityAction =
  | 'list_created'
  | 'list_renamed'
  | 'list_updated'
  | 'list_deleted'
  | 'list_archived'
  | 'list_unarchived'
  | 'list_shared'
  | 'member_added'
  | 'member_removed'
  | 'member_permission_changed'
  | 'item_added'
  | 'item_updated'
  | 'item_deleted'
  | 'item_checked'
  | 'item_unchecked'
  | 'items_cleared'
  | 'items_bulk_deleted';

/**
 * Activity entity
 */
export interface Activity {
  id: string;
  list_id: string;
  user_id: string;
  action: ActivityAction;
  details: Record<string, any> | null;
  created_at: Date;
}

/**
 * Activity with user details
 */
export interface ActivityWithUser extends Activity {
  user: {
    id: string;
    email: string;
    name: string;
  };
  list_name: string;
}

/**
 * Member activity stats
 */
export interface MemberActivityStats {
  userId: string;
  userName: string;
  userEmail: string;
  activityCount: number;
}

/**
 * Recent activity summary
 */
export interface RecentActivitySummary {
  id: string;
  action: string;
  userName: string;
  details: Record<string, any> | null;
  timestamp: Date;
}

/**
 * Category breakdown for statistics
 */
export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

/**
 * Activity trend data point
 */
export interface ActivityTrendPoint {
  date: string;
  count: number;
}

/**
 * List statistics response
 */
export interface ListStatistics {
  totalItems: number;
  itemsGotten: number;
  itemsRemaining: number;
  percentageComplete: number;
  itemsAddedThisWeek: number;
  itemsGottenThisWeek: number;
  mostActiveMembers: MemberActivityStats[];
  recentActivities: RecentActivitySummary[];
  categoryBreakdown: CategoryBreakdown[];
  activityTrend: ActivityTrendPoint[];
}

/**
 * Generate invite link request body
 */
export interface GenerateInviteRequest {
  expiresInDays?: number;
}

/**
 * Invite details response
 */
export interface InviteDetails {
  listId: string;
  listName: string;
  ownerName: string;
  memberCount: number;
  expiresAt?: Date;
}

/**
 * Invite link response
 */
export interface InviteLink {
  inviteToken: string;
  expiresAt: Date;
  inviteUrl: string;
}
