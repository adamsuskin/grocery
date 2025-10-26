import { useMemo } from 'react';
import './Avatar.css';

export type AvatarSize = 'small' | 'medium' | 'large';

export interface AvatarProps {
  /** User name to display initials from */
  name: string;
  /** User email for color generation */
  email: string;
  /** Size variant of the avatar */
  size?: AvatarSize;
  /** Optional tooltip text (defaults to name and email) */
  tooltip?: string;
  /** Optional custom class name */
  className?: string;
}

/**
 * Generates a consistent color from a string (email)
 * Uses a simple hash function to create deterministic colors
 */
function generateColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use HSL for better color distribution
  // Hue: 0-360, Saturation: 60-70%, Lightness: 45-55%
  const hue = Math.abs(hash % 360);
  const saturation = 65;
  const lightness = 50;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Extracts initials from a name
 * Takes first letter of first two words, or first two letters if single word
 */
function getInitials(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    return '?';
  }

  const words = trimmed.split(/\s+/);

  if (words.length >= 2) {
    // First letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // First two letters of single word (or just first if only one letter)
  return trimmed.substring(0, 2).toUpperCase();
}

/**
 * Avatar Component
 *
 * Displays a circular avatar with user initials and a color generated from their email.
 * Includes a tooltip showing the user's name and email on hover.
 *
 * @example
 * ```tsx
 * <Avatar name="John Doe" email="john@example.com" size="medium" />
 * ```
 */
export function Avatar({
  name,
  email,
  size = 'medium',
  tooltip,
  className = '',
}: AvatarProps) {
  const initials = useMemo(() => getInitials(name), [name]);
  const backgroundColor = useMemo(() => generateColor(email), [email]);
  const tooltipText = tooltip || `${name}\n${email}`;

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{ backgroundColor }}
      title={tooltipText}
      aria-label={`Avatar for ${name}`}
    >
      <span className="avatar-initials">{initials}</span>
    </div>
  );
}
