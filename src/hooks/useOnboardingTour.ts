import { useState, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'grocery-list-tour-completed';

export interface OnboardingTourState {
  hasCompletedTour: boolean;
  showTour: boolean;
  startTour: () => void;
  completeTour: () => void;
  skipTour: () => void;
}

/**
 * Hook for managing onboarding tour state with localStorage persistence
 *
 * @returns OnboardingTourState object with tour state and control functions
 *
 * @example
 * ```tsx
 * const { showTour, startTour, completeTour, skipTour } = useOnboardingTour();
 *
 * return (
 *   <>
 *     {showTour && (
 *       <OnboardingTour onComplete={completeTour} onSkip={skipTour} />
 *     )}
 *     <button onClick={startTour}>Show Tour</button>
 *   </>
 * );
 * ```
 */
export function useOnboardingTour(): OnboardingTourState {
  const [hasCompletedTour, setHasCompletedTour] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY);
      return stored === 'true';
    } catch (error) {
      console.warn('Failed to read tour completion status from localStorage:', error);
      return false;
    }
  });

  const [showTour, setShowTour] = useState<boolean>(false);

  /**
   * Check if this is the first visit and show tour automatically
   */
  useEffect(() => {
    if (!hasCompletedTour) {
      // Small delay to ensure the app is fully rendered
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour]);

  /**
   * Manually start the tour (e.g., from settings)
   */
  const startTour = () => {
    setShowTour(true);
  };

  /**
   * Complete the tour and save to localStorage
   */
  const completeTour = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setHasCompletedTour(true);
      setShowTour(false);
    } catch (error) {
      console.error('Failed to save tour completion status to localStorage:', error);
      // Still close the tour even if storage fails
      setShowTour(false);
    }
  };

  /**
   * Skip the tour and save to localStorage
   */
  const skipTour = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setHasCompletedTour(true);
      setShowTour(false);
    } catch (error) {
      console.error('Failed to save tour skip status to localStorage:', error);
      // Still close the tour even if storage fails
      setShowTour(false);
    }
  };

  return {
    hasCompletedTour,
    showTour,
    startTour,
    completeTour,
    skipTour,
  };
}

/**
 * Utility function to reset the tour completion status
 * Useful for testing or allowing users to restart the tour
 */
export function resetOnboardingTour(): void {
  try {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset tour completion status:', error);
  }
}
