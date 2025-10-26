/**
 * Feature-gated wrapper for CustomCategoryManager
 *
 * This component wraps the CustomCategoryManager and checks feature flags
 * before rendering. It also conditionally enables/disables sub-features
 * based on feature flag configuration.
 *
 * Use this component instead of CustomCategoryManager directly to get
 * automatic feature flag integration.
 */

import { CustomCategoryManager } from './CustomCategoryManager';
import { useCustomCategoriesFlags } from '../hooks/useFeatureFlags';
import { type PermissionLevel } from '../types';

interface CustomCategoryManagerWithFlagsProps {
  listId: string;
  onClose: () => void;
  permissionLevel?: PermissionLevel | null;
  onViewStatistics?: () => void;
}

export function CustomCategoryManagerWithFlags(props: CustomCategoryManagerWithFlagsProps) {
  const categoryFlags = useCustomCategoriesFlags();

  // Don't render anything if custom categories feature is disabled
  if (!categoryFlags.enabled) {
    return null;
  }

  // Pass through to the actual component
  // The component will check individual sub-feature flags internally
  return <CustomCategoryManager {...props} />;
}

// Re-export for convenience
export default CustomCategoryManagerWithFlags;
