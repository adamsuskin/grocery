import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (event: React.TouchEvent | React.MouseEvent) => void;
  delay?: number;
}

/**
 * Custom hook for handling long press gestures on mobile and desktop
 *
 * @param options - Configuration object
 * @param options.onLongPress - Callback fired when long press is detected
 * @param options.onClick - Optional callback for regular clicks
 * @param options.delay - Duration in ms before long press is triggered (default: 500)
 *
 * @returns Event handlers to spread on the target element
 *
 * @example
 * ```tsx
 * const longPressHandlers = useLongPress({
 *   onLongPress: (e) => console.log('Long pressed!'),
 *   onClick: (e) => console.log('Clicked!'),
 *   delay: 500,
 * });
 *
 * return <div {...longPressHandlers}>Press and hold me</div>;
 * ```
 */
export function useLongPress({ onLongPress, onClick, delay = 500 }: UseLongPressOptions) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget>();

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      // Prevent context menu on long press for touch events
      if ('touches' in event) {
        event.preventDefault();
      }

      target.current = event.target;
      timeout.current = setTimeout(() => {
        onLongPress(event);
        setLongPressTriggered(true);
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      if (shouldTriggerClick && !longPressTriggered && onClick) {
        onClick(event);
      }

      setLongPressTriggered(false);
      target.current = undefined;
    },
    [onClick, longPressTriggered]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
  };
}
