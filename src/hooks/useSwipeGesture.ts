import { useRef, useEffect, RefObject } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe in pixels
  velocityThreshold?: number; // Minimum velocity for swipe
}

/**
 * Hook to detect swipe gestures on touch devices
 */
export function useSwipeGesture<T extends HTMLElement>(
  options: SwipeGestureOptions
): RefObject<T> {
  const elementRef = useRef<T>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3,
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Calculate velocity
      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Determine if it's a horizontal or vertical swipe
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontal) {
        // Horizontal swipe
        if (Math.abs(deltaX) >= threshold && velocityX >= velocityThreshold) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) >= threshold && velocityY >= velocityThreshold) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      touchStartRef.current = null;
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold]);

  return elementRef;
}

/**
 * Hook to detect long press gesture
 */
export function useLongPress<T extends HTMLElement>(
  callback: () => void,
  duration: number = 500
): RefObject<T> {
  const elementRef = useRef<T>(null);
  const timerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const startLongPress = (e: TouchEvent | MouseEvent) => {
      isLongPressRef.current = false;
      timerRef.current = window.setTimeout(() => {
        isLongPressRef.current = true;
        callback();

        // Prevent context menu on long press
        if (e instanceof TouchEvent) {
          e.preventDefault();
        }
      }, duration);
    };

    const cancelLongPress = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      isLongPressRef.current = false;
    };

    // Touch events
    element.addEventListener('touchstart', startLongPress, { passive: true });
    element.addEventListener('touchend', cancelLongPress);
    element.addEventListener('touchmove', cancelLongPress);
    element.addEventListener('touchcancel', cancelLongPress);

    // Mouse events (for desktop testing)
    element.addEventListener('mousedown', startLongPress);
    element.addEventListener('mouseup', cancelLongPress);
    element.addEventListener('mouseleave', cancelLongPress);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      element.removeEventListener('touchstart', startLongPress);
      element.removeEventListener('touchend', cancelLongPress);
      element.removeEventListener('touchmove', cancelLongPress);
      element.removeEventListener('touchcancel', cancelLongPress);
      element.removeEventListener('mousedown', startLongPress);
      element.removeEventListener('mouseup', cancelLongPress);
      element.removeEventListener('mouseleave', cancelLongPress);
    };
  }, [callback, duration]);

  return elementRef;
}
