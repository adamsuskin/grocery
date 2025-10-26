import { memo } from 'react';
import type { RecipeSortState } from '../types';
import './RecipeSortControls.css';

interface RecipeSortControlsProps {
  sort: RecipeSortState;
  onChange: (sort: RecipeSortState) => void;
}

type SortField = RecipeSortState['field'];

const SORT_FIELDS: Array<{ value: SortField; label: string }> = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'prepTime', label: 'Prep Time' },
  { value: 'cookTime', label: 'Cook Time' },
];

export const RecipeSortControls = memo(function RecipeSortControls({
  sort,
  onChange,
}: RecipeSortControlsProps) {
  const handleFieldChange = (field: SortField) => {
    onChange({ ...sort, field });
  };

  const handleDirectionToggle = () => {
    onChange({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="recipe-sort-controls">
      <div className="sort-label">Sort by:</div>

      <div className="sort-fields">
        {SORT_FIELDS.map(({ value, label }) => (
          <button
            key={value}
            className={`sort-field-btn ${sort.field === value ? 'active' : ''}`}
            onClick={() => handleFieldChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        className="sort-direction-btn"
        onClick={handleDirectionToggle}
        aria-label={`Sort ${sort.direction === 'asc' ? 'descending' : 'ascending'}`}
        title={`Sort ${sort.direction === 'asc' ? 'descending' : 'ascending'}`}
      >
        <span className={`sort-arrow ${sort.direction}`}>
          {sort.direction === 'asc' ? '↑' : '↓'}
        </span>
      </button>
    </div>
  );
});
