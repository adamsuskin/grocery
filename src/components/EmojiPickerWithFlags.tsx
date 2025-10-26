/**
 * Feature-gated wrapper for EmojiPicker
 *
 * This component checks feature flags before rendering the EmojiPicker.
 * If the icon picker feature is disabled, it returns null.
 */

import { EmojiPicker } from './EmojiPicker';
import { useCustomCategoriesFlags } from '../hooks/useFeatureFlags';

interface EmojiPickerWithFlagsProps {
  value?: string;
  onChange: (emoji: string) => void;
  commonEmojis?: string[];
  label?: string;
  disabled?: boolean;
}

export function EmojiPickerWithFlags(props: EmojiPickerWithFlagsProps) {
  const categoryFlags = useCustomCategoriesFlags();

  // Don't render if custom categories or icons are disabled
  if (!categoryFlags.enabled || !categoryFlags.icons) {
    return null;
  }

  return <EmojiPicker {...props} />;
}

export default EmojiPickerWithFlags;
