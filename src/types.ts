// Category types
export const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Bakery',
  'Pantry',
  'Frozen',
  'Beverages',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

// Database types
export interface Database {
  grocery_items: GroceryItemTable;
  lists: ListTable;
  list_members: ListMemberTable;
}

export interface GroceryItemTable {
  id: string;
  name: string;
  quantity: number;
  gotten: number; // SQLite uses INTEGER for boolean (0 = false, 1 = true)
  category: string;
  notes: string;
  user_id: string;
  list_id: string;
  created_at: number;
}

export interface ListTable {
  id: string;
  name: string;
  owner_id: string;
  color: string;
  icon: string;
  created_at: number;
  updated_at: number;
}

export interface ListMemberTable {
  id: string;
  list_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  permission: string;
  added_at: number;
  added_by: string;
}

// Application types (with proper boolean)
export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  gotten: boolean;
  category: Category;
  notes: string;
  userId: string;
  listId: string;
  createdAt: number;
}

// Input types for mutations
export interface AddItemInput {
  name: string;
  quantity: number;
  category: Category;
  notes: string;
}

export interface UpdateItemInput {
  id: string;
  gotten: boolean;
}

// Filter types
export interface FilterState {
  searchText: string;
  showGotten: boolean;
  categories: Category[];
}

export interface FilterOptions {
  searchText?: string;
  showGotten?: boolean;
  categories?: Category[];
}

export type FilterChangeHandler = (filters: Partial<FilterState>) => void;

export interface FilterBarProps {
  filters: FilterState;
  onChange: FilterChangeHandler;
  totalCount: number;
  filteredCount: number;
}

// Sort types
export type SortField = 'name' | 'quantity' | 'date';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

export type SortChangeHandler = (sort: SortState) => void;

export interface SortControlsProps {
  sort: SortState;
  onChange: SortChangeHandler;
}

// Bulk operation types
export interface BulkOperationsProps {
  itemCount: number;
  gottenCount: number;
  onMarkAllGotten: () => Promise<void>;
  onDeleteAllGotten: () => Promise<void>;
  disabled?: boolean;
}

// Authentication types

/**
 * Represents a user in the system
 */
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}

/**
 * Authentication state for the application
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: AuthError | null;
}

/**
 * Credentials required for user login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Credentials required for user registration
 */
export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

/**
 * Authentication error with code and message
 */
export interface AuthError {
  code: string;
  message: string;
}

/**
 * Response from authentication endpoints
 */
export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Authentication context type for React context
 */
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// List sharing and collaboration types

/**
 * Permission levels for list members
 */
export type ListPermission = 'owner' | 'editor' | 'viewer';

/**
 * Alias for ListPermission for backward compatibility
 */
export type PermissionLevel = ListPermission;

/**
 * Represents a shared grocery list
 */
export interface GroceryListData {
  id: string;
  name: string;
  ownerId: string;
  color: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
  isArchived: boolean;
  archivedAt?: number;
}

/**
 * Alias for GroceryListData for backward compatibility
 */
export type List = GroceryListData;

/**
 * Represents a member of a shared list
 */
export interface ListMember {
  id: string;
  listId: string;
  userId: string;
  userEmail: string;
  userName: string;
  permission: ListPermission;
  addedAt: number;
  addedBy: string;
}

/**
 * Enriched list data with member count
 */
export interface ListWithMembers extends GroceryListData {
  memberCount: number;
  members?: ListMember[];
  currentUserPermission?: ListPermission;
}

/**
 * Input for creating a new list
 */
export interface CreateListInput {
  name: string;
  color?: string;
  icon?: string;
}

/**
 * Input for updating list customization
 */
export interface UpdateListCustomizationInput {
  listId: string;
  color?: string;
  icon?: string;
  name?: string;
}

/**
 * Input for sharing a list
 */
export interface ShareListInput {
  listId: string;
  userEmail: string;
  permission: ListPermission;
}

/**
 * Input for updating list member permission
 */
export interface UpdateMemberPermissionInput {
  listId: string;
  memberId: string;
  permission: ListPermission;
}

/**
 * Props for ListSelector component
 */
export interface ListSelectorProps {
  currentListId: string | null;
  onListChange: (listId: string) => void;
  onCreateList: () => void;
  onManageList: (listId: string) => void;
}

/**
 * Props for ListManagement component
 */
export interface ListManagementProps {
  listId: string;
  onClose: () => void;
  onListDeleted?: () => void;
  onListUpdated?: () => void;
}

// Notification types

/**
 * Type of notification event
 */
export type NotificationType = 'list_shared' | 'permission_changed' | 'list_removed' | 'list_updated' | 'ownership_transferred';

/**
 * Represents a notification for list sharing events
 */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  listId: string;
  listName: string;
  actorName: string;
  actorId: string;
  timestamp: number;
  read: boolean;
}

/**
 * Input for creating a notification
 */
export interface CreateNotificationInput {
  type: NotificationType;
  message: string;
  listId: string;
  listName: string;
  actorName: string;
  actorId: string;
}

/**
 * Props for Notifications component
 */
export interface NotificationsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHideDuration?: number;
}

// List template types

/**
 * Template item for pre-populating lists
 */
export interface TemplateItem {
  name: string;
  quantity: number;
  category: Category;
  notes?: string;
}

/**
 * List template with name, description, and default items
 */
export interface ListTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: TemplateItem[];
}

// Avatar and Member Display types

/**
 * Size variants for avatar component
 */
export type AvatarSize = 'small' | 'medium' | 'large';

/**
 * Size variants for badge components
 */
export type BadgeSize = 'small' | 'medium' | 'large';

/**
 * Props for Avatar component
 */
export interface AvatarProps {
  name: string;
  email: string;
  size?: AvatarSize;
  tooltip?: string;
  className?: string;
}

/**
 * Member information for display in avatars
 */
export interface MemberInfo {
  userId: string;
  userName: string;
  userEmail: string;
  permission?: ListPermission;
}

/**
 * Props for MemberAvatars component
 */
export interface MemberAvatarsProps {
  members: MemberInfo[];
  maxVisible?: number;
  size?: AvatarSize;
  onShowAll?: () => void;
  className?: string;
}

/**
 * Props for PermissionBadge component
 */
export interface PermissionBadgeProps {
  permission: ListPermission;
  size?: BadgeSize;
  showIcon?: boolean;
  className?: string;
}

// List statistics types

/**
 * Activity by member for statistics
 */
export interface MemberActivity {
  userId: string;
  userName: string;
  userEmail: string;
  activityCount: number;
}

/**
 * Recent activity summary
 */
export interface RecentActivity {
  id: string;
  action: string;
  userName: string;
  details: any;
  timestamp: number;
}

/**
 * List statistics data
 */
export interface ListStats {
  totalItems: number;
  itemsGotten: number;
  itemsRemaining: number;
  percentageComplete: number;
  itemsAddedThisWeek: number;
  itemsGottenThisWeek: number;
  mostActiveMembers: MemberActivity[];
  recentActivities: RecentActivity[];
  categoryBreakdown: Array<{
    category: Category;
    count: number;
    percentage: number;
  }>;
  activityTrend: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Props for ListStats component
 */
export interface ListStatsProps {
  listId: string;
  onClose: () => void;
}

// Activity tracking types

/**
 * Activity action types
 */
export type ActivityAction =
  | 'list_created'
  | 'list_renamed'
  | 'list_deleted'
  | 'list_archived'
  | 'list_unarchived'
  | 'list_shared'
  | 'member_added'
  | 'member_removed'
  | 'member_permission_changed'
  | 'ownership_transferred'
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
  created_at: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  list_name: string;
}

/**
 * Props for ListActivity component
 */
export interface ListActivityProps {
  listId: string;
  limit?: number;
}

// Invite link types

/**
 * Invite link data
 */
export interface InviteLink {
  inviteToken: string;
  expiresAt: string;
  inviteUrl: string;
}

/**
 * Invite details for public view
 */
export interface InviteDetails {
  listId: string;
  listName: string;
  ownerName: string;
  memberCount: number;
  expiresAt?: string;
}

/**
 * Props for InviteAccept component
 */
export interface InviteAcceptProps {
  token: string;
}

// List Actions types

/**
 * Props for ListActions component
 */
export interface ListActionsProps {
  list: List;
  currentUserId: string;
  permission: PermissionLevel;
  onExport?: (listId: string) => void;
  onShare?: (listId: string) => void;
  onDuplicate?: (listId: string) => void;
  onArchive?: (listId: string) => void;
  onPin?: (listId: string, isPinned: boolean) => void;
}

/**
 * List action type for tracking user actions
 */
export type ListActionType = 'pin' | 'unpin' | 'duplicate' | 'archive' | 'export' | 'share' | 'delete';

/**
 * List action result
 */
export interface ListActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Onboarding Tour types

/**
 * Tour step configuration
 */
export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
}

/**
 * Props for OnboardingTour component
 */
export interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * State returned by useOnboardingTour hook
 */
export interface OnboardingTourState {
  hasCompletedTour: boolean;
  showTour: boolean;
  startTour: () => void;
  completeTour: () => void;
  skipTour: () => void;
}
