/**
 * Feature-gated wrapper for ColorPicker
 *
 * This component checks feature flags before rendering the ColorPicker.
 * If the color picker feature is disabled, it returns null.
 */

import { ColorPicker } from './ColorPicker';
import { useCustomCategoriesFlags } from '../hooks/useFeatureFlags';

interface ColorPickerWithFlagsProps {
  value?: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  label?: string;
  disabled?: boolean;
}

export function ColorPickerWithFlags(props: ColorPickerWithFlagsProps) {
  const categoryFlags = useCustomCategoriesFlags();

  // Don't render if custom categories or colors are disabled
  if (!categoryFlags.enabled || !categoryFlags.colors) {
    return null;
  }

  return <ColorPicker {...props} />;
}

export default ColorPickerWithFlags;
