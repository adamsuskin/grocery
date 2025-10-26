import { useState, useMemo, useCallback } from 'react';
import { useMealPlans, useMealPlanMutations } from '../hooks/useMealPlans';
import { useRecipes } from '../hooks/useRecipes';
import { MealSlot } from './MealSlot';
import { RecipeSelector } from './RecipeSelector';
import { WeekNavigator } from './WeekNavigator';
import {
  getWeekStart,
  getWeekDates,
  getPreviousWeek,
  getNextWeek,
  getStartOfDay,
  formatDayName,
  formatMonthDay,
  isToday,
} from '../utils/dateUtils';
import type { MealType, MealPlan, Recipe } from '../types';
import './MealPlanner.css';

export interface MealPlannerProps {
  userId: string;
  listId?: string;
  onGenerateList?: (listId: string) => void;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function MealPlanner({ userId, listId, onGenerateList }: MealPlannerProps) {
  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));

  // Get week dates
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Calculate date range for fetching meal plans
  const startTimestamp = useMemo(() => getStartOfDay(weekDates[0]), [weekDates]);
  const endTimestamp = useMemo(
    () => getStartOfDay(weekDates[6]) + 24 * 60 * 60 * 1000,
    [weekDates]
  );

  // Fetch data
  const mealPlans = useMealPlans(userId, startTimestamp, endTimestamp);
  const recipes = useRecipes(userId);
  const { createMealPlan, updateMealPlan, deleteMealPlan, markMealCooked } =
    useMealPlanMutations();

  // Recipe selector modal state
  const [selectorState, setSelectorState] = useState<{
    isOpen: boolean;
    date: Date | null;
    mealType: MealType | null;
  }>({
    isOpen: false,
    date: null,
    mealType: null,
  });

  // Recipe detail modal state
  const [detailState, setDetailState] = useState<{
    isOpen: boolean;
    mealPlan: MealPlan | null;
  }>({
    isOpen: false,
    mealPlan: null,
  });

  // Drag and drop state
  const [draggedMealPlan, setDraggedMealPlan] = useState<MealPlan | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{
    date: Date;
    mealType: MealType;
  } | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);

  // Touch state for mobile drag-and-drop
  const [touchState, setTouchState] = useState<{
    startTime: number | null;
    startPos: { x: number; y: number } | null;
    currentPos: { x: number; y: number } | null;
    isDragging: boolean;
    longPressTimer: NodeJS.Timeout | null;
    draggedMealPlan: MealPlan | null;
    isLongPressing: boolean;
  }>({
    startTime: null,
    startPos: null,
    currentPos: null,
    isDragging: false,
    longPressTimer: null,
    draggedMealPlan: null,
    isLongPressing: false,
  });

  // Create a map of meal plans by date and meal type for easy lookup
  const mealPlanMap = useMemo(() => {
    const map = new Map<string, MealPlan>();
    mealPlans.forEach((plan) => {
      const dateKey = new Date(plan.plannedDate).toDateString();
      const key = `${dateKey}-${plan.mealType}`;
      map.set(key, plan);
    });
    return map;
  }, [mealPlans]);

  // Create a map of recipes by ID for easy lookup
  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    recipes.forEach((recipe) => {
      map.set(recipe.id, recipe);
    });
    return map;
  }, [recipes]);

  // Get meal plan for a specific date and meal type
  const getMealPlan = useCallback(
    (date: Date, mealType: MealType): MealPlan | undefined => {
      const key = `${date.toDateString()}-${mealType}`;
      return mealPlanMap.get(key);
    },
    [mealPlanMap]
  );

  // Navigation handlers
  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => getPreviousWeek(prev));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => getNextWeek(prev));
  };

  const handleToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  // Meal plan handlers
  const handleAddMeal = (date: Date, mealType: MealType) => {
    setSelectorState({
      isOpen: true,
      date,
      mealType,
    });
  };

  const handleSelectRecipe = async (recipe: Recipe, servings: number) => {
    if (!selectorState.date || !selectorState.mealType) return;

    const plannedDate = getStartOfDay(selectorState.date);

    await createMealPlan({
      recipeId: recipe.id,
      plannedDate,
      mealType: selectorState.mealType,
      servings,
      listId,
    });

    setSelectorState({ isOpen: false, date: null, mealType: null });
  };

  const handleViewMeal = (mealPlan: MealPlan) => {
    setDetailState({ isOpen: true, mealPlan });
  };

  const handleRemoveMeal = async (mealPlanId: string) => {
    if (confirm('Remove this meal from your plan?')) {
      await deleteMealPlan(mealPlanId);
    }
  };

  const handleToggleCooked = async (mealPlanId: string, isCooked: boolean) => {
    await markMealCooked(mealPlanId, isCooked);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, mealPlan: MealPlan) => {
    setDraggedMealPlan(mealPlan);

    // Check if copy mode (Ctrl/Cmd key held)
    const isCopy = e.ctrlKey || e.metaKey;
    setIsCopyMode(isCopy);

    // Set effect allowed based on copy mode
    e.dataTransfer.effectAllowed = isCopy ? 'copy' : 'move';

    // Create custom drag image with rotation effect
    const dragElement = e.currentTarget as HTMLElement;
    const clone = dragElement.cloneNode(true) as HTMLElement;
    clone.style.width = `${dragElement.offsetWidth}px`;
    clone.style.opacity = '0.8';
    clone.style.transform = 'rotate(-3deg)';
    clone.style.position = 'absolute';
    clone.style.top = '-1000px';
    clone.style.left = '-1000px';
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, dragElement.offsetWidth / 2, dragElement.offsetHeight / 2);

    // Clean up the clone after drag starts
    setTimeout(() => {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }, 0);

    // Add dragging class to element
    dragElement.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.classList.remove('dragging');
    setDraggedMealPlan(null);
    setIsCopyMode(false);
  };

  const handleDragOver = (e: React.DragEvent, date: Date, mealType: MealType) => {
    e.preventDefault();

    // Update copy mode dynamically during drag
    const isCopy = e.ctrlKey || e.metaKey;
    setIsCopyMode(isCopy);

    // Allow both recipe and meal plan drops
    if (e.dataTransfer.types.includes('application/recipe')) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = isCopy ? 'copy' : 'move';
    }

    setDragOverSlot({ date, mealType });
  };

  // Note: Currently unused but available for future drag-and-drop enhancements
  const _handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, date: Date, mealType: MealType) => {
    e.preventDefault();
    setDragOverSlot(null);

    // Check if dragging a recipe from RecipeList
    const recipeId = e.dataTransfer.getData('application/recipe');

    if (recipeId) {
      // Recipe drop - create a new meal plan
      const recipe = recipeMap.get(recipeId);
      if (!recipe) return;

      const plannedDate = getStartOfDay(date);
      await createMealPlan({
        recipeId: recipe.id,
        plannedDate,
        mealType,
        servings: recipe.servings || 4,
        listId,
      });
    } else if (draggedMealPlan) {
      // Meal plan drop - check if copy or move
      const newPlannedDate = getStartOfDay(date);
      const isCopy = e.ctrlKey || e.metaKey;

      if (isCopy) {
        // Copy the meal - create a new meal plan with the same recipe
        await createMealPlan({
          recipeId: draggedMealPlan.recipeId,
          plannedDate: newPlannedDate,
          mealType,
          servings: draggedMealPlan.servings,
          listId,
        });
      } else {
        // Move the meal - update existing meal plan
        await updateMealPlan(draggedMealPlan.id, {
          id: draggedMealPlan.id,
          plannedDate: newPlannedDate,
          mealType,
        });
      }

      setDraggedMealPlan(null);
      setIsCopyMode(false);
    }
  };

  // Touch event handlers for mobile drag-and-drop
  const handleTouchStart = (e: React.TouchEvent, mealPlan: MealPlan) => {
    const touch = e.touches[0];
    const startTime = Date.now();
    const startPos = { x: touch.clientX, y: touch.clientY };

    // Start long-press timer (500ms)
    const timer = setTimeout(() => {
      // Haptic feedback on drag start (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      setTouchState((prev) => ({
        ...prev,
        isDragging: true,
        isLongPressing: false,
        draggedMealPlan: mealPlan,
      }));
    }, 500);

    setTouchState({
      startTime,
      startPos,
      currentPos: startPos,
      isDragging: false,
      longPressTimer: timer,
      draggedMealPlan: mealPlan,
      isLongPressing: true,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const currentPos = { x: touch.clientX, y: touch.clientY };

    // If we moved too much during long-press, cancel it
    if (touchState.isLongPressing && touchState.startPos) {
      const dx = Math.abs(currentPos.x - touchState.startPos.x);
      const dy = Math.abs(currentPos.y - touchState.startPos.y);

      if (dx > 10 || dy > 10) {
        // Cancel long-press if finger moved too much
        if (touchState.longPressTimer) {
          clearTimeout(touchState.longPressTimer);
        }
        setTouchState((prev) => ({
          ...prev,
          isLongPressing: false,
          longPressTimer: null,
        }));
        return;
      }
    }

    if (touchState.isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging

      setTouchState((prev) => ({
        ...prev,
        currentPos,
      }));

      // Find the element under the touch point
      const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elementUnderTouch) {
        // Find the closest meal slot
        const mealSlotElement = elementUnderTouch.closest('[data-meal-slot]');
        if (mealSlotElement) {
          const dateStr = mealSlotElement.getAttribute('data-date');
          const mealType = mealSlotElement.getAttribute('data-meal-type') as MealType;

          if (dateStr && mealType) {
            const date = new Date(dateStr);
            setDragOverSlot({ date, mealType });
          }
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    // Clean up long-press timer
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
    }

    if (touchState.isDragging && touchState.draggedMealPlan && dragOverSlot) {
      // Drop the meal plan
      const newPlannedDate = getStartOfDay(dragOverSlot.date);
      await updateMealPlan(touchState.draggedMealPlan.id, {
        id: touchState.draggedMealPlan.id,
        plannedDate: newPlannedDate,
        mealType: dragOverSlot.mealType,
      });

      // Haptic feedback on successful drop
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }

    // Reset touch state
    setTouchState({
      startTime: null,
      startPos: null,
      currentPos: null,
      isDragging: false,
      longPressTimer: null,
      draggedMealPlan: null,
      isLongPressing: false,
    });

    setDragOverSlot(null);
  };

  const handleTouchCancel = () => {
    // Clean up on touch cancel
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
    }

    setTouchState({
      startTime: null,
      startPos: null,
      currentPos: null,
      isDragging: false,
      longPressTimer: null,
      draggedMealPlan: null,
      isLongPressing: false,
    });

    setDragOverSlot(null);
  };

  // Generate shopping list handler
  const handleGenerateList = () => {
    if (!listId) {
      alert('Please select a list first');
      return;
    }

    // Get all recipes for the week
    const recipesForWeek = mealPlans
      .map((plan) => recipeMap.get(plan.recipeId))
      .filter((recipe): recipe is Recipe => recipe !== undefined);

    if (recipesForWeek.length === 0) {
      alert('Add some meals to your plan first');
      return;
    }

    if (onGenerateList) {
      onGenerateList(listId);
    }

    alert(
      `Shopping list would be generated for ${recipesForWeek.length} recipes. This feature will be fully implemented when recipe ingredients are connected to the grocery list.`
    );
  };

  const mealTypeLabels: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  };

  return (
    <div className="meal-planner">
      <div className="meal-planner-header">
        <div className="meal-planner-title-section">
          <h1 className="meal-planner-title">Meal Planner</h1>
          <p className="meal-planner-subtitle">Plan your meals for the week</p>
        </div>

        <button
          className="btn-generate-list"
          onClick={handleGenerateList}
          disabled={mealPlans.length === 0}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 7H21M3 12H21M3 17H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Generate Shopping List
        </button>
      </div>

      <WeekNavigator
        currentWeekStart={currentWeekStart}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
      />

      <div className="meal-calendar">
        {/* Desktop/Tablet grid view */}
        <div className="meal-calendar-grid">
          {/* Header row with day names and dates */}
          <div className="meal-calendar-header">
            <div className="meal-calendar-header-corner"></div>
            {weekDates.map((date) => (
              <div
                key={date.toISOString()}
                className={`meal-calendar-day-header ${isToday(date) ? 'today' : ''}`}
              >
                <div className="day-name">{formatDayName(date)}</div>
                <div className="day-date">{formatMonthDay(date)}</div>
              </div>
            ))}
          </div>

          {/* Meal type rows */}
          {MEAL_TYPES.map((mealType) => (
            <div key={mealType} className="meal-calendar-row">
              <div className="meal-type-label">
                <span className={`meal-type-icon meal-type-icon-${mealType}`}>
                  {mealTypeLabels[mealType]}
                </span>
              </div>

              {weekDates.map((date) => {
                const mealPlan = getMealPlan(date, mealType);
                const recipe = mealPlan ? recipeMap.get(mealPlan.recipeId) : undefined;
                const isDragOver =
                  dragOverSlot?.date.toDateString() === date.toDateString() &&
                  dragOverSlot?.mealType === mealType;

                return (
                  <MealSlot
                    key={`${date.toISOString()}-${mealType}`}
                    date={date}
                    mealType={mealType}
                    mealPlan={mealPlan}
                    recipe={recipe}
                    onAdd={handleAddMeal}
                    onView={handleViewMeal}
                    onRemove={handleRemoveMeal}
                    onToggleCooked={handleToggleCooked}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, date, mealType)}
                    onDrop={(e) => handleDrop(e, date, mealType)}
                    isDragOver={isDragOver}
                    isCopyMode={isCopyMode}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Mobile stacked list view */}
        <div className="meal-calendar-mobile">
          {weekDates.map((date) => (
            <div key={date.toISOString()} className="meal-day-section">
              <div className={`meal-day-header ${isToday(date) ? 'today' : ''}`}>
                <h3 className="meal-day-title">
                  {formatDayName(date)}, {formatMonthDay(date)}
                </h3>
                {isToday(date) && <span className="today-badge">Today</span>}
              </div>

              <div className="meal-day-meals">
                {MEAL_TYPES.map((mealType) => {
                  const mealPlan = getMealPlan(date, mealType);
                  const recipe = mealPlan ? recipeMap.get(mealPlan.recipeId) : undefined;
                  const isDragOver =
                    dragOverSlot?.date.toDateString() === date.toDateString() &&
                    dragOverSlot?.mealType === mealType;

                  return (
                    <div key={mealType} className="meal-mobile-slot">
                      <div className="meal-mobile-label">{mealTypeLabels[mealType]}</div>
                      <MealSlot
                        date={date}
                        mealType={mealType}
                        mealPlan={mealPlan}
                        recipe={recipe}
                        onAdd={handleAddMeal}
                        onView={handleViewMeal}
                        onRemove={handleRemoveMeal}
                        onToggleCooked={handleToggleCooked}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchCancel}
                        isDragOver={isDragOver}
                        isLongPressing={
                          touchState.isLongPressing &&
                          touchState.draggedMealPlan?.id === mealPlan?.id
                        }
                        isTouchDragging={
                          touchState.isDragging &&
                          touchState.draggedMealPlan?.id === mealPlan?.id
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Selector Modal */}
      {selectorState.isOpen && selectorState.date && selectorState.mealType && (
        <RecipeSelector
          recipes={recipes}
          date={selectorState.date}
          mealType={selectorState.mealType}
          onSelect={handleSelectRecipe}
          onClose={() => setSelectorState({ isOpen: false, date: null, mealType: null })}
        />
      )}

      {/* Recipe Detail Modal (placeholder for future implementation) */}
      {detailState.isOpen && detailState.mealPlan && (
        <div className="recipe-detail-overlay" onClick={() => setDetailState({ isOpen: false, mealPlan: null })}>
          <div className="recipe-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-detail-header">
              <h2>Recipe Details</h2>
              <button className="btn-close" onClick={() => setDetailState({ isOpen: false, mealPlan: null })}>
                &times;
              </button>
            </div>
            <div className="recipe-detail-content">
              <p>Recipe detail view will be implemented in a future phase.</p>
              <p>Meal Plan ID: {detailState.mealPlan.id}</p>
              <p>Recipe ID: {detailState.mealPlan.recipeId}</p>
            </div>
          </div>
        </div>
      )}

      {/* Touch Drag Preview */}
      {touchState.isDragging && touchState.currentPos && touchState.draggedMealPlan && (
        <div
          className="touch-drag-preview"
          style={{
            position: 'fixed',
            left: touchState.currentPos.x,
            top: touchState.currentPos.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <div className="touch-drag-preview-content">
            {recipeMap.get(touchState.draggedMealPlan.recipeId)?.name || 'Meal'}
          </div>
        </div>
      )}
    </div>
  );
}
