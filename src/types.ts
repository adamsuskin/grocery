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

// Category type can be either a predefined category from CATEGORIES array or a custom category name
export type Category = typeof CATEGORIES[number];

// Custom category types
export interface CustomCategory {
  id: string;
  name: string;
  listId: string;
  createdBy: string;
  color?: string; // Hex color code like #FF5733
  icon?: string; // Emoji or icon identifier
  displayOrder: number; // Higher numbers = higher priority in display
  isArchived: boolean; // Soft delete flag
  archivedAt?: number; // Timestamp when archived
  isLocked: boolean; // Whether category is locked (only owner can edit)
  lastEditedBy?: string; // User who last edited this category
  createdAt: number;
  updatedAt: number;
}

export interface CustomCategoryTable {
  id: string;
  name: string;
  list_id: string;
  created_by: string;
  color: string | null;
  icon: string | null;
  display_order: number;
  is_archived: boolean;
  archived_at: number | null;
  is_locked: boolean;
  last_edited_by: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateCustomCategoryInput {
  name: string;
  listId: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
}

export interface UpdateCustomCategoryInput {
  id: string;
  name?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
}

// Database types
export interface Database {
  grocery_items: GroceryItemTable;
  lists: ListTable;
  list_members: ListMemberTable;
  custom_categories: CustomCategoryTable;
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
  updated_at: number;
  price: number | null; // Price per unit
}

export interface ListTable {
  id: string;
  name: string;
  owner_id: string;
  color: string;
  icon: string;
  created_at: number;
  updated_at: number;
  budget: number | null; // Budget amount for the list
  currency: string; // Currency code (e.g., 'USD', 'EUR')
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
  updated_at: number;
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
  updatedAt: number;
  price?: number; // Price per unit
  unit?: string; // Unit of measurement (e.g., 'cup', 'lb', 'kg')
  quantityDecimal?: number; // Fractional amounts for more precise quantities
}

// Input types for mutations
export interface AddItemInput {
  name: string;
  quantity: number;
  category: Category;
  notes: string;
  price?: number; // Optional price per unit
}

export interface UpdateItemInput {
  id: string;
  gotten: boolean;
}

// Filter types
export type CategoryFilterMode = 'include' | 'exclude';
export type CategoryType = 'all' | 'predefined' | 'custom';

export interface SavedFilter {
  id: string;
  name: string;
  searchText: string;
  showGotten: boolean;
  categories: Category[];
  categoryMode: CategoryFilterMode;
  categoryType: CategoryType;
  createdAt: number;
  lastUsed: number;
  useCount: number;
}

export interface FilterState {
  searchText: string;
  showGotten: boolean;
  categories: Category[];
  categoryMode: CategoryFilterMode; // Include or exclude selected categories
  categoryType: CategoryType; // All, predefined only, or custom only
}

export interface FilterOptions {
  searchText?: string;
  showGotten?: boolean;
  categories?: Category[];
  categoryMode?: CategoryFilterMode;
  categoryType?: CategoryType;
}

export type FilterChangeHandler = (filters: Partial<FilterState>) => void;

export interface FilterBarProps {
  filters: FilterState;
  onChange: FilterChangeHandler;
  totalCount: number;
  filteredCount: number;
}

// Sort types
export type SortField = 'name' | 'quantity' | 'date' | 'category';
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
  budget?: number; // Budget amount for the list
  currency?: string; // Currency code (e.g., 'USD', 'EUR')
}

/**
 * Alias for GroceryListData for backward compatibility
 */
export type List = GroceryListData;

/**
 * Budget information for a list
 */
export interface BudgetInfo {
  total: number; // Total budget amount
  spent: number; // Amount spent so far
  remaining: number; // Remaining budget
  percentUsed: number; // Percentage of budget used (0-100)
}

/**
 * Price statistics for items in a list
 */
export interface PriceStats {
  totalItems: number; // Total number of items
  itemsWithPrice: number; // Number of items with price set
  averagePrice: number; // Average price of items with prices
  minPrice: number; // Minimum price among items
  maxPrice: number; // Maximum price among items
}

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
  updatedAt: number;
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
 * Custom category definition for templates
 */
export interface TemplateCustomCategory {
  name: string;
  color?: string;
  icon?: string;
}

/**
 * Template item for pre-populating lists
 */
export interface TemplateItem {
  name: string;
  quantity: number;
  category: string; // Can be predefined Category or custom category name
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
  createCustomCategories?: boolean; // If true, create custom categories when applying template
  customCategories?: TemplateCustomCategory[]; // Custom category definitions
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
  | 'items_bulk_deleted'
  | 'category_created'
  | 'category_updated'
  | 'category_archived'
  | 'category_restored'
  | 'category_deleted'
  | 'category_merged'
  | 'category_edited'
  | 'category_locked'
  | 'category_unlocked'
  | 'category_suggested'
  | 'category_suggestion_approved'
  | 'category_suggestion_rejected'
  | 'category_comment_added'
  | 'category_voted';

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

// Conflict Resolution types

/**
 * Type of conflict that occurred
 */
export type ConflictType =
  | 'concurrent_edit' // Both users edited the same item
  | 'delete_edit' // One user deleted while another edited
  | 'edit_edit'; // Both users edited different fields

/**
 * Resolution strategy for conflicts
 */
export type ConflictResolution = 'mine' | 'theirs' | 'manual';

/**
 * Field-level change in a conflict
 */
export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

/**
 * Version of an item in a conflict
 */
export interface ConflictVersion {
  value: any;
  changes: FieldChange[];
  timestamp: number;
  userId: string;
  userName: string;
}

/**
 * Represents a conflict between two versions of data
 */
export interface Conflict {
  id: string;
  type: ConflictType;
  itemId: string;
  itemName: string;
  listId: string;
  localVersion: ConflictVersion;
  remoteVersion: ConflictVersion;
  timestamp: number;
  priority: number; // Higher priority shown first
  autoResolvable: boolean;
}

/**
 * Props for ConflictNotification component
 */
export interface ConflictNotificationProps {
  conflict: Conflict;
  onResolve: (conflictId: string, resolution: ConflictResolution) => void;
  onDismiss: (conflictId: string) => void;
  countdown?: number;
  isPersistent?: boolean;
}

/**
 * Props for ConflictResolutionModal component
 * Note: ConflictResolutionModal uses ConflictData (defined in the component)
 * which is a simplified interface focused on item comparison
 */
export interface ConflictResolutionModalProps {
  conflict: {
    itemId: string;
    itemName: string;
    local: GroceryItem;
    remote: GroceryItem;
    timestamp: number;
  };
  onResolve: (resolvedItem: GroceryItem) => void;
  onCancel: () => void;
  currentUserName?: string;
  remoteUserName?: string;
}

// Category Collaboration types

/**
 * Status of a category suggestion
 */
export type CategorySuggestionStatus = 'pending' | 'approved' | 'rejected';

/**
 * Category suggestion from viewers
 */
export interface CategorySuggestion {
  id: string;
  listId: string;
  suggestedBy: string;
  name: string;
  color?: string;
  icon?: string;
  reason?: string;
  status: CategorySuggestionStatus;
  reviewedBy?: string;
  reviewedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Database table for category suggestions
 */
export interface CategorySuggestionTable {
  id: string;
  list_id: string;
  suggested_by: string;
  name: string;
  color: string | null;
  icon: string | null;
  reason: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: number | null;
  created_at: number;
  updated_at: number;
}

/**
 * Input for creating a category suggestion
 */
export interface CreateCategorySuggestionInput {
  listId: string;
  name: string;
  color?: string;
  icon?: string;
  reason?: string;
}

/**
 * Input for reviewing a category suggestion
 */
export interface ReviewCategorySuggestionInput {
  suggestionId: string;
  action: 'approve' | 'reject';
}

/**
 * Category comment for discussions
 */
export interface CategoryComment {
  id: string;
  categoryId: string;
  userId: string;
  commentText: string;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Database table for category comments
 */
export interface CategoryCommentTable {
  id: string;
  category_id: string;
  user_id: string;
  comment_text: string;
  parent_id: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Input for creating a category comment
 */
export interface CreateCategoryCommentInput {
  categoryId: string;
  commentText: string;
  parentId?: string;
}

/**
 * Vote type for categories
 */
export type CategoryVoteType = 'keep' | 'remove';

/**
 * Category vote
 */
export interface CategoryVote {
  id: string;
  categoryId: string;
  userId: string;
  voteType: CategoryVoteType;
  createdAt: number;
  updatedAt: number;
}

/**
 * Database table for category votes
 */
export interface CategoryVoteTable {
  id: string;
  category_id: string;
  user_id: string;
  vote_type: string;
  created_at: number;
  updated_at: number;
}

/**
 * Input for casting a category vote
 */
export interface CastCategoryVoteInput {
  categoryId: string;
  voteType: CategoryVoteType;
}

/**
 * Vote type for category suggestions
 */
export type SuggestionVoteType = 'upvote' | 'downvote';

/**
 * Category suggestion vote
 */
export interface CategorySuggestionVote {
  id: string;
  suggestionId: string;
  userId: string;
  voteType: SuggestionVoteType;
  createdAt: number;
}

/**
 * Database table for category suggestion votes
 */
export interface CategorySuggestionVoteTable {
  id: string;
  suggestion_id: string;
  user_id: string;
  vote_type: string;
  created_at: number;
}

/**
 * Input for voting on a suggestion
 */
export interface VoteSuggestionInput {
  suggestionId: string;
  voteType: SuggestionVoteType;
}

/**
 * Category with collaboration metadata
 */
export interface CategoryWithCollaboration extends CustomCategory {
  creatorName?: string;
  lastEditorName?: string;
  commentCount: number;
  keepVotes: number;
  removeVotes: number;
}

/**
 * Category suggestion with enriched data
 */
export interface CategorySuggestionWithDetails extends CategorySuggestion {
  suggesterName: string;
  suggesterEmail: string;
  reviewerName?: string;
  reviewerEmail?: string;
  listName: string;
  upvotes: number;
  downvotes: number;
}

/**
 * Props for CategoryCollaboration component
 */
export interface CategoryCollaborationProps {
  listId: string;
  category: CustomCategory;
  permission: ListPermission;
  onClose: () => void;
}

/**
 * Props for CategorySuggestions component
 */
export interface CategorySuggestionsProps {
  listId: string;
  permission: ListPermission;
  onClose: () => void;
}

/**
 * Category conflict data
 */
export interface CategoryConflict {
  id: string;
  categoryId: string;
  categoryName: string;
  listId: string;
  localVersion: {
    name: string;
    color?: string;
    icon?: string;
    userId: string;
    userName: string;
    timestamp: number;
  };
  remoteVersion: {
    name: string;
    color?: string;
    icon?: string;
    userId: string;
    userName: string;
    timestamp: number;
  };
  conflictType: 'name' | 'properties' | 'simultaneous_creation';
}

/**
 * Props for CategoryConflictResolver component
 */
export interface CategoryConflictResolverProps {
  conflict: CategoryConflict;
  onResolve: (resolution: 'local' | 'remote' | 'merge') => void;
  onCancel: () => void;
}

// Gamification types

/**
 * Achievement identifier type
 */
export type AchievementId =
  | 'category_creator'
  | 'color_coordinator'
  | 'icon_master'
  | 'organization_expert'
  | 'minimalist'
  | 'perfectionist'
  | 'speed_organizer'
  | 'diverse_categorizer'
  | 'category_veteran'
  | 'detail_oriented';

/**
 * Achievement rarity level
 */
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * User level in gamification system
 */
export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

/**
 * Challenge type
 */
export type ChallengeType = 'tip' | 'goal' | 'milestone';

/**
 * Achievement entity
 */
export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

/**
 * Challenge entity for encouraging specific actions
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  icon: string;
  completed: boolean;
  dismissible: boolean;
  priority: number;
}

/**
 * Gamification statistics for a list
 */
export interface GamificationStats {
  totalCategoriesCreated: number;
  totalCategoriesWithColors: number;
  totalCategoriesWithIcons: number;
  categoriesWithBoth: number;
  mostUsedCategory: { name: string; count: number } | null;
  itemsInCustomCategories: number;
  itemsInOther: number;
  totalItems: number;
  categorizationScore: number;
  organizationScore: number;
  streak: number;
  lastActivity: number;
}

/**
 * Leaderboard entry for shared lists
 */
export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userEmail: string;
  categoriesCreated: number;
  totalUsage: number;
  score: number;
}

/**
 * Level information
 */
export interface LevelInfo {
  level: UserLevel;
  title: string;
  minCategories: number;
  icon: string;
  color: string;
}

/**
 * Complete gamification data for a list
 */
export interface GamificationData {
  achievements: Achievement[];
  stats: GamificationStats;
  level: UserLevel;
  challenges: Challenge[];
  lastUpdated: number;
  totalPoints: number;
}

/**
 * Gamification settings
 */
export interface GamificationSettings {
  funModeEnabled: boolean;
  showNotifications: boolean;
  showChallenges: boolean;
  showLeaderboard: boolean;
}

/**
 * Props for GamificationBadges component
 */
export interface GamificationBadgesProps {
  achievements: Achievement[];
  onClose: () => void;
}

/**
 * Props for GamificationProgress component
 */
export interface GamificationProgressProps {
  stats: GamificationStats;
  level: UserLevel;
  totalPoints: number;
  compact?: boolean;
}

/**
 * Props for GamificationChallenges component
 */
export interface GamificationChallengesProps {
  listId: string;
  challenges: Challenge[];
  onDismiss?: (challengeId: string) => void;
  maxVisible?: number;
}

/**
 * Props for GamificationNotification component
 */
export interface GamificationNotificationProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHideDuration?: number;
  animationDuration?: number;
}

/**
 * Props for GamificationLeaderboard component
 */
export interface GamificationLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  onClose?: () => void;
  collaborative?: boolean;
}

/**
 * Props for GamificationSettings component
 */
export interface GamificationSettingsProps {
  currentListId?: string;
  onClose?: () => void;
}

// Phase 26: Recipe Integration types

// Recipe difficulty levels
export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

// Cuisine types
export type CuisineType =
  | 'Italian'
  | 'Mexican'
  | 'Asian'
  | 'American'
  | 'Mediterranean'
  | 'Indian'
  | 'French'
  | 'Thai'
  | 'Other';

// Meal types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Measurement units
export type MeasurementUnit =
  | 'cup'
  | 'tbsp'
  | 'tsp'
  | 'oz'
  | 'lb'
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'piece'
  | 'whole'
  | 'clove'
  | 'bunch'
  | 'package';

// Recipe ingredient
export interface RecipeIngredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  notes?: string;
  category?: string; // Maps to grocery categories
  orderIndex: number;
  createdAt: number;
}

// Recipe
export interface Recipe {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  prepTime?: number; // minutes
  cookTime?: number; // minutes
  servings: number;
  difficulty?: RecipeDifficulty;
  cuisineType?: CuisineType;
  imageUrl?: string;
  userId: string;
  listId?: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  ingredients?: RecipeIngredient[]; // populated when fetched with ingredients
}

// Meal plan entry
export interface MealPlan {
  id: string;
  userId: string;
  listId?: string;
  recipeId: string;
  plannedDate: number; // unix timestamp
  mealType: MealType;
  servings: number;
  notes?: string;
  isCooked: boolean;
  createdAt: number;
  updatedAt: number;
  recipe?: Recipe; // populated when fetched with recipe
}

// Recipe collection
export interface RecipeCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  recipes?: Recipe[]; // populated when fetched with recipes
  recipeCount?: number;
}

// Input types for creating/updating
export interface CreateRecipeInput {
  name: string;
  description?: string;
  instructions: string;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  difficulty?: RecipeDifficulty;
  cuisineType?: CuisineType;
  imageUrl?: string;
  listId?: string;
  isPublic?: boolean;
  ingredients: Omit<RecipeIngredient, 'id' | 'recipeId' | 'createdAt'>[];
}

export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {
  id: string;
}

export interface CreateMealPlanInput {
  recipeId: string;
  listId?: string;
  plannedDate: number;
  mealType: MealType;
  servings?: number;
  notes?: string;
}

export interface UpdateMealPlanInput extends Partial<CreateMealPlanInput> {
  id: string;
  isCooked?: boolean;
}

// Recipe filter and sort
export interface RecipeFilterState {
  searchText: string;
  difficulty?: RecipeDifficulty[];
  cuisineType?: CuisineType[];
  prepTimeMax?: number;
  cookTimeMax?: number;
  isPublic?: boolean;
}

export interface RecipeSortState {
  field: 'name' | 'createdAt' | 'prepTime' | 'cookTime';
  direction: 'asc' | 'desc';
}

// Phase 27: Unit Conversion types

// Unit system type
export type UnitSystem = 'metric' | 'imperial' | 'mixed';

// Unit conversion
export interface UnitConversion {
  id: string;
  fromUnit: string;
  toUnit: string;
  conversionFactor: number;
  category: 'volume' | 'weight' | 'count';
  notes?: string;
  createdAt: number;
}

// User preferences for unit display
export interface UserPreferences {
  id: string;
  userId: string;
  preferredSystem: 'metric' | 'imperial' | 'mixed';
  defaultVolumeUnit: MeasurementUnit;
  defaultWeightUnit: MeasurementUnit;
  displayFormat: 'full' | 'abbreviated';
  autoConvert: boolean;
  createdAt: number;
  updatedAt: number;
}
