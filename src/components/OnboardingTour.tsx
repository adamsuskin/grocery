import { useState, useEffect, useCallback, useRef } from 'react';
import './OnboardingTour.css';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
}

export interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Grocery List!',
    description: 'Let\'s take a quick tour of the list sharing features. You can skip this tour at any time.',
    position: 'center',
  },
  {
    id: 'list-selector',
    title: 'List Selector',
    description: 'Click here to switch between your lists, create new ones, or use templates. You can have multiple lists for different purposes.',
    targetSelector: '.list-selector-button',
    position: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'create-list',
    title: 'Create New Lists',
    description: 'Click the list selector dropdown to create new blank lists or use pre-built templates like "Weekly Groceries" or "Party Planning".',
    targetSelector: '.list-selector-button',
    position: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'manage-list',
    title: 'List Settings',
    description: 'Click this settings icon to manage your list - rename it, customize colors, view stats, or delete it.',
    targetSelector: '.btn-manage-list',
    position: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'share-list',
    title: 'Share Your List',
    description: 'Want to collaborate? Press Ctrl+S or go to list settings to share your list with others. You can invite people by email and set their permission level.',
    targetSelector: '.btn-manage-list',
    position: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'permissions',
    title: 'Permission Levels',
    description: 'When sharing, you can set permissions:\n\n• Owner - Full control (only you)\n• Editor - Can add, edit, and delete items\n• Viewer - Can only view the list',
    position: 'center',
  },
  {
    id: 'members',
    title: 'List Members',
    description: 'See who has access to your list. Member avatars show here, and you can click to view all members and manage permissions.',
    targetSelector: '.member-avatars',
    position: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Speed up your workflow with shortcuts:\n\n• Ctrl+N - Create new list\n• Ctrl+S - Share list (owners only)\n• Ctrl+L - Open list selector\n• ? - View all shortcuts',
    targetSelector: '.btn-help',
    position: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You now know the basics of list sharing. Start creating and sharing lists with your family and friends. You can restart this tour anytime from your profile settings.',
    position: 'center',
  },
];

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);

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
        onComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, isFirstStep, isLastStep, onSkip, onComplete]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
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

  return (
    <div className="onboarding-tour">
      {/* Overlay */}
      <div className="tour-overlay" onClick={onSkip} />

      {/* Highlight spotlight */}
      {highlightRect && (
        <div
          className="tour-highlight"
          style={{
            top: highlightRect.top + window.scrollY - (currentStep.highlightPadding || 12),
            left: highlightRect.left + window.scrollX - (currentStep.highlightPadding || 12),
            width: highlightRect.width + (currentStep.highlightPadding || 12) * 2,
            height: highlightRect.height + (currentStep.highlightPadding || 12) * 2,
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
            onClick={onSkip}
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
            <button
              className="tour-btn tour-btn-skip"
              onClick={onSkip}
            >
              Skip Tour
            </button>

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
