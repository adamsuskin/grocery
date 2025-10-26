import type { SortControlsProps, SortField } from '../types';

export function SortControls({ sort, onChange }: SortControlsProps) {
  const handleFieldChange = (field: SortField) => {
    onChange({ ...sort, field });
  };

  const handleDirectionToggle = () => {
    onChange({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const getSortLabel = (field: SortField): string => {
    switch (field) {
      case 'name':
        return 'Name';
      case 'quantity':
        return 'Quantity';
      case 'date':
        return 'Date';
      case 'category':
        return 'Category';
    }
  };

  return (
    <div className="sort-controls">
      <label className="sort-label">Sort by:</label>
      <div className="sort-buttons">
        {(['name', 'quantity', 'date', 'category'] as SortField[]).map((field) => (
          <button
            key={field}
            onClick={() => handleFieldChange(field)}
            className={`btn btn-sort ${sort.field === field ? 'active' : ''}`}
            aria-label={`Sort by ${getSortLabel(field)}`}
          >
            {getSortLabel(field)}
          </button>
        ))}
      </div>
      <button
        onClick={handleDirectionToggle}
        className="btn btn-direction"
        aria-label={`Toggle sort direction (currently ${sort.direction === 'asc' ? 'ascending' : 'descending'})`}
        title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sort.direction === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  );
}
