import { formatWeekRange, isToday } from '../utils/dateUtils';

interface WeekNavigatorProps {
  currentWeekStart: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function WeekNavigator({
  currentWeekStart,
  onPreviousWeek,
  onNextWeek,
  onToday,
}: WeekNavigatorProps) {
  const weekRange = formatWeekRange(currentWeekStart);
  const isCurrentWeek = isToday(currentWeekStart) || (
    new Date() >= currentWeekStart &&
    new Date() <= new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="week-navigator">
      <button
        className="week-nav-btn week-nav-prev"
        onClick={onPreviousWeek}
        title="Previous week"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="week-nav-label">Previous</span>
      </button>

      <div className="week-nav-center">
        <h2 className="week-range">{weekRange}</h2>
        {!isCurrentWeek && (
          <button className="btn-today" onClick={onToday}>
            Today
          </button>
        )}
      </div>

      <button
        className="week-nav-btn week-nav-next"
        onClick={onNextWeek}
        title="Next week"
      >
        <span className="week-nav-label">Next</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 18L15 12L9 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
