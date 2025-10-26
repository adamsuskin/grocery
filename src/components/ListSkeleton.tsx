import './ListSkeleton.css';

/**
 * Skeleton props for customization
 */
interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

/**
 * Base Skeleton component with shimmer effect
 */
export function Skeleton({ width, height, borderRadius, className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '16px',
        borderRadius: borderRadius || '4px',
      }}
    />
  );
}

/**
 * Skeleton for a single list card in grid/list view
 */
interface ListCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export function ListCardSkeleton({ viewMode = 'grid' }: ListCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="list-card-skeleton list-view-skeleton">
        <div className="skeleton-header">
          <Skeleton width="48px" height="48px" borderRadius="12px" />
          <div className="skeleton-badges">
            <Skeleton width="60px" height="24px" borderRadius="12px" />
          </div>
        </div>
        <div className="skeleton-body-horizontal">
          <Skeleton width="150px" height="24px" />
          <div className="skeleton-stats-horizontal">
            <Skeleton width="80px" height="20px" />
            <Skeleton width="90px" height="20px" />
          </div>
          <Skeleton width="120px" height="18px" />
        </div>
      </div>
    );
  }

  return (
    <div className="list-card-skeleton">
      <div className="skeleton-header">
        <Skeleton width="48px" height="48px" borderRadius="12px" />
        <div className="skeleton-badges">
          <Skeleton width="60px" height="24px" borderRadius="12px" />
        </div>
      </div>
      <div className="skeleton-body">
        <Skeleton width="70%" height="24px" />
        <div className="skeleton-stats">
          <Skeleton width="80px" height="20px" />
          <Skeleton width="90px" height="20px" />
        </div>
        <div className="skeleton-footer">
          <Skeleton width="120px" height="18px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for list dashboard with multiple cards
 */
interface ListDashboardSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export function ListDashboardSkeleton({ count = 6, viewMode = 'grid' }: ListDashboardSkeletonProps) {
  return (
    <div className={`lists-container-skeleton ${viewMode}-view`}>
      {Array.from({ length: count }).map((_, index) => (
        <ListCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  );
}

/**
 * Skeleton for list selector dropdown
 */
export function ListSelectorSkeleton() {
  return (
    <div className="list-selector-skeleton">
      <div className="skeleton-selector-current">
        <Skeleton width="40px" height="40px" borderRadius="8px" />
        <div className="skeleton-selector-info">
          <Skeleton width="150px" height="20px" />
          <Skeleton width="100px" height="16px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for list item in dropdown
 */
export function ListDropdownItemSkeleton() {
  return (
    <div className="list-dropdown-item-skeleton">
      <Skeleton width="40px" height="40px" borderRadius="8px" />
      <div className="skeleton-item-content">
        <Skeleton width="120px" height="18px" />
        <Skeleton width="90px" height="14px" />
      </div>
    </div>
  );
}

/**
 * Skeleton for multiple list items in dropdown
 */
interface ListDropdownSkeletonProps {
  count?: number;
}

export function ListDropdownSkeleton({ count = 5 }: ListDropdownSkeletonProps) {
  return (
    <div className="list-dropdown-skeleton">
      <div className="skeleton-dropdown-header">
        <Skeleton width="80px" height="20px" />
      </div>
      <div className="skeleton-dropdown-items">
        {Array.from({ length: count }).map((_, index) => (
          <ListDropdownItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for member list in list management
 */
interface MemberItemSkeletonProps {
  count?: number;
}

export function MemberListSkeleton({ count = 3 }: MemberItemSkeletonProps) {
  return (
    <div className="members-list-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="member-item-skeleton">
          <Skeleton width="48px" height="48px" borderRadius="50%" />
          <div className="skeleton-member-info">
            <Skeleton width="150px" height="18px" />
            <Skeleton width="180px" height="14px" />
          </div>
          <div className="skeleton-member-actions">
            <Skeleton width="80px" height="32px" borderRadius="4px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for statistics section
 */
export function StatsSkeleton() {
  return (
    <div className="stats-skeleton">
      <div className="skeleton-stats-grid">
        <div className="skeleton-stat-card">
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="32px" />
        </div>
        <div className="skeleton-stat-card">
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="32px" />
        </div>
        <div className="skeleton-stat-card">
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="32px" />
        </div>
        <div className="skeleton-stat-card">
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="32px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for general content loading
 */
interface ContentSkeletonProps {
  lines?: number;
}

export function ContentSkeleton({ lines = 3 }: ContentSkeletonProps) {
  return (
    <div className="content-skeleton">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height="16px"
        />
      ))}
    </div>
  );
}
