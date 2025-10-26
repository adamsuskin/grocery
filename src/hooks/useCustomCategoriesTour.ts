import { useState, useEffect, useCallback } from 'react';

const TOUR_STORAGE_PREFIX = 'custom-categories-tour';

export type TourContext = 'manager' | 'additem' | 'filter';

export interface CustomCategoriesTourState {
  showTour: boolean;
  currentStep: number;
  hasCompletedTour: (context: TourContext) => boolean;
  hasDismissedTour: (context: TourContext) => boolean;
  startTour: (context: TourContext) => void;
  completeTour: (context: TourContext) => void;
  skipTour: (context: TourContext) => void;
  resetTour: (context: TourContext) => void;
  setCurrentStep: (step: number) => void;
  shouldShowTour: (context: TourContext, hasCustomCategories: boolean) => boolean;
}

/**
 * Hook for managing custom categories onboarding tour state with localStorage persistence
 *
 * Tracks tour completion separately for each context:
 * - 'manager': First time opening CustomCategoryManager
 * - 'additem': First time using AddItemForm after creating custom categories
 * - 'filter': First time filtering by custom categories
 *
 * Also tracks if user manually dismissed the tour with "Don't show again"
 */
export function useCustomCategoriesTour(): CustomCategoriesTourState {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeContext, setActiveContext] = useState<TourContext | null>(null);

  /**
   * Check if tour has been completed for a given context
   */
  const hasCompletedTour = useCallback((context: TourContext): boolean => {
    try {
      const key = `${TOUR_STORAGE_PREFIX}-${context}-completed`;
      return localStorage.getItem(key) === 'true';
    } catch (error) {
      console.warn('Failed to read tour completion status:', error);
      return false;
    }
  }, []);

  /**
   * Check if tour has been dismissed with "Don't show again" for a given context
   */
  const hasDismissedTour = useCallback((context: TourContext): boolean => {
    try {
      const key = `${TOUR_STORAGE_PREFIX}-${context}-dismissed`;
      return localStorage.getItem(key) === 'true';
    } catch (error) {
      console.warn('Failed to read tour dismissal status:', error);
      return false;
    }
  }, []);

  /**
   * Determine if the tour should be shown for a given context
   */
  const shouldShowTour = useCallback((
    context: TourContext,
    hasCustomCategories: boolean
  ): boolean => {
    // Don't show if already completed or dismissed
    if (hasCompletedTour(context) || hasDismissedTour(context)) {
      return false;
    }

    // For manager context, show on first visit
    if (context === 'manager') {
      return true;
    }

    // For additem and filter contexts, only show if user has custom categories
    if (context === 'additem' || context === 'filter') {
      return hasCustomCategories;
    }

    return false;
  }, [hasCompletedTour, hasDismissedTour]);

  /**
   * Start the tour for a given context
   */
  const startTour = useCallback((context: TourContext) => {
    setActiveContext(context);
    setCurrentStep(0);
    setShowTour(true);
  }, []);

  /**
   * Complete the tour and save to localStorage
   */
  const completeTour = useCallback((context: TourContext) => {
    try {
      const key = `${TOUR_STORAGE_PREFIX}-${context}-completed`;
      localStorage.setItem(key, 'true');
    } catch (error) {
      console.error('Failed to save tour completion status:', error);
    }

    setShowTour(false);
    setActiveContext(null);
    setCurrentStep(0);
  }, []);

  /**
   * Skip the tour (close without completing)
   */
  const skipTour = useCallback((context: TourContext) => {
    setShowTour(false);
    setActiveContext(null);
    setCurrentStep(0);
  }, []);

  /**
   * Reset the tour for a given context (for testing or manual restart)
   */
  const resetTour = useCallback((context: TourContext) => {
    try {
      localStorage.removeItem(`${TOUR_STORAGE_PREFIX}-${context}-completed`);
      localStorage.removeItem(`${TOUR_STORAGE_PREFIX}-${context}-dismissed`);
    } catch (error) {
      console.error('Failed to reset tour:', error);
    }
  }, []);

  /**
   * Resume tour if interrupted (e.g., page refresh during tour)
   */
  useEffect(() => {
    const resumeStep = sessionStorage.getItem(`${TOUR_STORAGE_PREFIX}-resume-step`);
    const resumeContext = sessionStorage.getItem(`${TOUR_STORAGE_PREFIX}-resume-context`) as TourContext | null;

    if (resumeStep && resumeContext && !hasCompletedTour(resumeContext)) {
      const step = parseInt(resumeStep, 10);
      if (!isNaN(step)) {
        setCurrentStep(step);
        setActiveContext(resumeContext);
        setShowTour(true);

        // Clear resume data
        sessionStorage.removeItem(`${TOUR_STORAGE_PREFIX}-resume-step`);
        sessionStorage.removeItem(`${TOUR_STORAGE_PREFIX}-resume-context`);
      }
    }
  }, [hasCompletedTour]);

  /**
   * Save current step to sessionStorage for resume functionality
   */
  useEffect(() => {
    if (showTour && activeContext) {
      sessionStorage.setItem(`${TOUR_STORAGE_PREFIX}-resume-step`, currentStep.toString());
      sessionStorage.setItem(`${TOUR_STORAGE_PREFIX}-resume-context`, activeContext);
    } else {
      sessionStorage.removeItem(`${TOUR_STORAGE_PREFIX}-resume-step`);
      sessionStorage.removeItem(`${TOUR_STORAGE_PREFIX}-resume-context`);
    }
  }, [showTour, currentStep, activeContext]);

  return {
    showTour,
    currentStep,
    hasCompletedTour,
    hasDismissedTour,
    startTour,
    completeTour,
    skipTour,
    resetTour,
    setCurrentStep,
    shouldShowTour,
  };
}

/**
 * Utility function to reset all custom categories tours
 */
export function resetAllCustomCategoriesTours(): void {
  const contexts: TourContext[] = ['manager', 'additem', 'filter'];
  contexts.forEach(context => {
    try {
      localStorage.removeItem(`${TOUR_STORAGE_PREFIX}-${context}-completed`);
      localStorage.removeItem(`${TOUR_STORAGE_PREFIX}-${context}-dismissed`);
    } catch (error) {
      console.error(`Failed to reset ${context} tour:`, error);
    }
  });

  // Clear resume data
  sessionStorage.removeItem(`${TOUR_STORAGE_PREFIX}-resume-step`);
  sessionStorage.removeItem(`${TOUR_STORAGE_PREFIX}-resume-context`);
}
