import type { MealPlan, Recipe, MealType } from '../types';
import { formatDuration } from '../utils/dateUtils';

interface MealSlotProps {
  date: Date;
  mealType: MealType;
  mealPlan?: MealPlan;
  recipe?: Recipe;
  onAdd: (date: Date, mealType: MealType) => void;
  onView: (mealPlan: MealPlan) => void;
  onRemove: (mealPlanId: string) => void;
  onToggleCooked: (mealPlanId: string, isCooked: boolean) => void;
  onDragStart?: (e: React.DragEvent, mealPlan: MealPlan) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, date: Date, mealType: MealType) => void;
  isDragOver?: boolean;
  isCopyMode?: boolean;
  onTouchStart?: (e: React.TouchEvent, mealPlan: MealPlan) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
  onTouchCancel?: () => void;
  isLongPressing?: boolean;
  isTouchDragging?: boolean;
}

export function MealSlot({
  date,
  mealType,
  mealPlan,
  recipe,
  onAdd,
  onView,
  onRemove,
  onToggleCooked,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragOver,
  isCopyMode,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  isLongPressing,
  isTouchDragging,
}: MealSlotProps) {
  const isEmpty = !mealPlan || !recipe;

  const handleDragStart = (e: React.DragEvent) => {
    if (mealPlan && onDragStart) {
      onDragStart(e, mealPlan);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop) {
      onDrop(e, date, mealType);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mealPlan && onTouchStart) {
      onTouchStart(e, mealPlan);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (onTouchMove) {
      onTouchMove(e);
    }
  };

  const handleTouchEnd = () => {
    if (onTouchEnd) {
      onTouchEnd();
    }
  };

  const handleTouchCancel = () => {
    if (onTouchCancel) {
      onTouchCancel();
    }
  };

  if (isEmpty) {
    return (
      <div
        className={`meal-slot meal-slot-empty meal-slot-${mealType} ${isDragOver ? 'drag-over' : ''} ${
          isCopyMode ? 'drag-over-copy' : ''
        }`}
        onClick={() => onAdd(date, mealType)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-meal-slot="true"
        data-date={date.toISOString()}
        data-meal-type={mealType}
      >
        <div className="meal-slot-empty-content">
          <span className="meal-slot-add-icon">+</span>
          <span className="meal-slot-add-text">Add Recipe</span>
        </div>
      </div>
    );
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <div
      className={`meal-slot meal-slot-filled meal-slot-${mealType} ${isDragOver ? 'drag-over' : ''} ${
        isCopyMode && isDragOver ? 'drag-over-copy' : ''
      } ${mealPlan.isCooked ? 'meal-cooked' : ''} ${isLongPressing ? 'long-pressing' : ''} ${
        isTouchDragging ? 'touch-dragging' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      data-meal-slot="true"
      data-date={date.toISOString()}
      data-meal-type={mealType}
    >
      <div className="meal-slot-content" onClick={() => onView(mealPlan)}>
        {mealPlan.isCooked && (
          <div className="meal-cooked-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        <div className="meal-slot-header">
          <h4 className="meal-slot-title">{recipe.name}</h4>
        </div>

        <div className="meal-slot-details">
          <div className="meal-slot-detail">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
              <path
                d="M23 21V19C23 17.9391 22.5786 16.9217 21.8284 16.1716"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{mealPlan.servings} servings</span>
          </div>

          {totalTime > 0 && (
            <div className="meal-slot-detail">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 6V12L16 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>{formatDuration(totalTime)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="meal-slot-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={`meal-slot-action-btn meal-slot-check-btn ${mealPlan.isCooked ? 'checked' : ''}`}
          onClick={() => onToggleCooked(mealPlan.id, !mealPlan.isCooked)}
          title={mealPlan.isCooked ? 'Mark as not cooked' : 'Mark as cooked'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          className="meal-slot-action-btn meal-slot-remove-btn"
          onClick={() => onRemove(mealPlan.id)}
          title="Remove from meal plan"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
