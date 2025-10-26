import { useState, useEffect, useCallback, useRef } from 'react';
import './OnboardingTour.css';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
  allowInteraction?: boolean;
}

export interface CustomCategoriesOnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
  context: 'manager' | 'additem' | 'filter';
}

const TOUR_STEPS_MANAGER: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Custom Categories!',
    description: 'Organize your items your way. Custom categories let you create personalized groups beyond the standard categories.',
    position: 'center',
  },
  {
    id: 'create-category',
    title: 'Create a new category',
    description: 'Create a custom category with a name, color, and icon. Make it unique to your shopping needs!',
    targetSelector: '.category-form',
    position: 'bottom',
    highlightPadding: 12,
    allowInteraction: true,
  },
  {
    id: 'category-list',
    title: 'Your Custom Categories',
    description: 'All your custom categories appear here. You can edit, reorder, or delete them at any time.',
    targetSelector: '.custom-categories',
    position: 'top',
    highlightPadding: 12,
  },
  {
    id: 'bulk-operations',
    title: 'Bulk Operations',
    description: 'Select multiple categories to change colors, export, merge, or delete them all at once.',
    targetSelector: '.bulk-operations-toolbar',
    position: 'bottom',
    highlightPadding: 12,
  },
  {
    id: 'complete',
    title: 'You\'re all set!',
    description: 'Start organizing your list with custom categories. They\'ll appear in the dropdown when adding items and in the filter menu.',
    position: 'center',
  },
];

const TOUR_STEPS_ADDITEM: TourStep[] = [
  {
    id: 'welcome',
    title: 'Custom Categories in Action',
    description: 'Now that you have custom categories, let\'s see how to use them when adding items.',
    position: 'center',
  },
  {
    id: 'category-dropdown',
    title: 'Your custom categories appear here',
    description: 'When adding an item, your custom categories appear in the dropdown alongside standard categories.',
    targetSelector: '.category-select-wrapper',
    position: 'bottom',
    highlightPadding: 12,
    allowInteraction: true,
  },
  {
    id: 'manage-button',
    title: 'Quick access to manage',
    description: 'Click here anytime to manage your categories - create, edit, or organize them.',
    targetSelector: '.manage-categories-btn',
    position: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'complete',
    title: 'Start organizing!',
    description: 'You\'re ready to use custom categories. Try adding an item and selecting your custom category!',
    position: 'center',
  },
];

const TOUR_STEPS_FILTER: TourStep[] = [
  {
    id: 'welcome',
    title: 'Filter by Custom Categories',
    description: 'You can now filter your grocery list by your custom categories.',
    position: 'center',
  },
  {
    id: 'filter-dropdown',
    title: 'Filter items by custom categories here',
    description: 'Your custom categories appear in the category filter. Select them to show only items in those categories.',
    targetSelector: '.category-filter-controls',
    position: 'bottom',
    highlightPadding: 12,
  },
  {
    id: 'complete',
    title: 'Happy shopping!',
    description: 'You now know how to filter by custom categories. Keep your list organized!',
    position: 'center',
  },
];

export function CustomCategoriesOnboardingTour({
  onComplete,
  onSkip,
  context
}: CustomCategoriesOnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  // Select tour steps based on context
  const TOUR_STEPS =
    context === 'manager' ? TOUR_STEPS_MANAGER :
    context === 'additem' ? TOUR_STEPS_ADDITEM :
    TOUR_STEPS_FILTER;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  /**
   * Calculate highlight and tooltip positions
   */
  const updatePositions = useCallback(() => {
    if (!currentStep.targetSelector) {
      setHighlightRect(null);
      return;
    }

    const target = document.querySelector(currentStep.targetSelector);
    if (!target) {
      setHighlightRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    setHighlightRect(rect);

    // Calculate tooltip position based on step position
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = currentStep.highlightPadding || 12;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (currentStep.position) {
        case 'bottom':
          top = rect.bottom + padding + scrollY;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2 + scrollX;
          break;
        case 'top':
          top = rect.top - tooltipRect.height - padding + scrollY;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2 + scrollX;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2 + scrollY;
          left = rect.left - tooltipRect.width - padding + scrollX;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2 + scrollY;
          left = rect.right + padding + scrollX;
          break;
        default:
          // Center
          top = window.innerHeight / 2 - tooltipRect.height / 2 + scrollY;
          left = window.innerWidth / 2 - tooltipRect.width / 2 + scrollX;
      }

      // Ensure tooltip stays within viewport
      const maxLeft = window.innerWidth - tooltipRect.width - 20;
      const maxTop = window.innerHeight - tooltipRect.height - 20;
      left = Math.max(20, Math.min(left, maxLeft));
      top = Math.max(20, Math.min(top, maxTop));

      setTooltipPosition({ top, left });
    }
  }, [currentStep]);

  /**
   * Update positions when step changes or window resizes
   */
  useEffect(() => {
    updatePositions();

    const handleResize = () => updatePositions();
    const handleScroll = () => updatePositions();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    // Set up mutation observer to detect when target element appears/changes
    if (currentStep.targetSelector) {
      const observer = new MutationObserver(() => {
        updatePositions();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      observerRef.current = observer;
    }

    // Small delay to ensure tooltip ref is ready
    const timer = setTimeout(updatePositions, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentStep, updatePositions]);

  /**
   * Scroll target element into view
   */
  useEffect(() => {
    if (currentStep.targetSelector) {
      const target = document.querySelector(currentStep.targetSelector);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' && !isLastStep) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && !isFirstStep) {
        handlePrevious();
      } else if (e.key === 'Enter' && isLastStep) {
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, isFirstStep, isLastStep, onSkip]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentStepIndex(index);
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      // Save preference to not show again
      try {
        localStorage.setItem(`custom-categories-tour-${context}-dismissed`, 'true');
      } catch (error) {
        console.error('Failed to save tour preference:', error);
      }
    }
    onSkip();
  };

  const handleComplete = () => {
    if (dontShowAgain) {
      // Save preference to not show again
      try {
        localStorage.setItem(`custom-categories-tour-${context}-dismissed`, 'true');
      } catch (error) {
        console.error('Failed to save tour preference:', error);
      }
    }
    onComplete();
  };

  // Allow interaction with highlighted elements if specified
  const overlayStyle = currentStep.allowInteraction ? {
    pointerEvents: 'none' as const,
  } : {};

  return (
    <div className="onboarding-tour custom-categories-tour">
      {/* Overlay */}
      <div
        className="tour-overlay"
        onClick={handleSkip}
        style={overlayStyle}
      />

      {/* Highlight spotlight */}
      {highlightRect && (
        <div
          className="tour-highlight"
          style={{
            top: highlightRect.top + window.scrollY - (currentStep.highlightPadding || 12),
            left: highlightRect.left + window.scrollX - (currentStep.highlightPadding || 12),
            width: highlightRect.width + (currentStep.highlightPadding || 12) * 2,
            height: highlightRect.height + (currentStep.highlightPadding || 12) * 2,
            pointerEvents: currentStep.allowInteraction ? 'none' : 'auto',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`tour-tooltip ${currentStep.position === 'center' ? 'tour-tooltip-center' : ''}`}
        style={
          currentStep.position !== 'center'
            ? {
                position: 'absolute',
                top: tooltipPosition.top,
                left: tooltipPosition.left,
              }
            : undefined
        }
      >
        <div className="tour-tooltip-header">
          <h3 className="tour-tooltip-title">{currentStep.title}</h3>
          <button
            className="tour-close-btn"
            onClick={handleSkip}
            aria-label="Close tour"
          >
            ×
          </button>
        </div>

        <div className="tour-tooltip-body">
          <p className="tour-tooltip-description">{currentStep.description}</p>
        </div>

        <div className="tour-tooltip-footer">
          <div className="tour-progress">
            {TOUR_STEPS.map((step, index) => (
              <button
                key={step.id}
                className={`tour-progress-dot ${index === currentStepIndex ? 'active' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to step ${index + 1}: ${step.title}`}
              />
            ))}
          </div>

          <div className="tour-tooltip-actions">
            <div className="tour-options">
              <button
                className="tour-btn tour-btn-skip"
                onClick={handleSkip}
              >
                Skip Tour
              </button>

              {isLastStep && (
                <label className="tour-checkbox">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                  />
                  <span>Don't show again</span>
                </label>
              )}
            </div>

            <div className="tour-navigation">
              {!isFirstStep && (
                <button
                  className="tour-btn tour-btn-secondary"
                  onClick={handlePrevious}
                >
                  Previous
                </button>
              )}
              <button
                className="tour-btn tour-btn-primary"
                onClick={handleNext}
              >
                {isLastStep ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        <div className="tour-step-counter">
          {currentStepIndex + 1} of {TOUR_STEPS.length}
        </div>
      </div>
    </div>
  );
}
