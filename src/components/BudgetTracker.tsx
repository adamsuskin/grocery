import { useState, useMemo } from 'react';
import type { GroceryItem } from '../types';
import './BudgetTracker.css';

interface BudgetTrackerProps {
  items: GroceryItem[];
  budget?: number;
  currency?: string;
  onUpdateBudget?: (budget: number) => void;
}

interface PriceStats {
  average: number;
  min: number;
  max: number;
}

export function BudgetTracker({
  items,
  budget,
  currency = '$',
  onUpdateBudget
}: BudgetTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(budget?.toString() || '');

  // Calculate budget statistics
  const budgetStats = useMemo(() => {
    // For this implementation, we'll assume items have an optional price field
    // Since GroceryItem doesn't have price in the type definition, we'll use (item as any).price
    const itemsWithPrices = items.filter((item) => {
      const price = (item as any).price;
      return price !== undefined && price !== null && price > 0;
    });

    const itemsWithoutPrices = items.filter((item) => {
      const price = (item as any).price;
      return price === undefined || price === null || price === 0;
    });

    const totalSpending = items.reduce((sum, item) => {
      const price = (item as any).price || 0;
      return sum + (price * item.quantity);
    }, 0);

    const remaining = budget ? budget - totalSpending : 0;
    const percentageUsed = budget && budget > 0 ? (totalSpending / budget) * 100 : 0;

    // Calculate price statistics
    let priceStats: PriceStats | null = null;
    if (itemsWithPrices.length > 0) {
      const prices = itemsWithPrices.map(item => (item as any).price);
      priceStats = {
        average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    }

    return {
      totalSpending,
      remaining,
      percentageUsed,
      itemsWithPrices: itemsWithPrices.length,
      itemsWithoutPrices: itemsWithoutPrices.length,
      priceStats
    };
  }, [items, budget]);

  const handleUpdateBudget = () => {
    const newBudget = parseFloat(budgetInput);
    if (!isNaN(newBudget) && newBudget >= 0 && onUpdateBudget) {
      onUpdateBudget(newBudget);
      setIsEditingBudget(false);
    }
  };

  const handleCancelEdit = () => {
    setBudgetInput(budget?.toString() || '');
    setIsEditingBudget(false);
  };

  const getStatusClass = () => {
    if (!budget) return '';
    if (budgetStats.percentageUsed > 100) return 'over-budget';
    if (budgetStats.percentageUsed > 80) return 'near-budget';
    return 'within-budget';
  };

  const formatCurrency = (value: number) => {
    return `${currency}${value.toFixed(2)}`;
  };

  if (!budget && !onUpdateBudget) {
    return null;
  }

  return (
    <div className={`budget-tracker ${getStatusClass()}`}>
      {/* Compact View */}
      <div className="budget-tracker-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="budget-overview">
          <div className="budget-icon">
            {!budget && '💰'}
            {budget && budgetStats.percentageUsed <= 80 && '✓'}
            {budget && budgetStats.percentageUsed > 80 && budgetStats.percentageUsed <= 100 && '⚠️'}
            {budget && budgetStats.percentageUsed > 100 && '⚠️'}
          </div>

          <div className="budget-summary">
            {!budget ? (
              <div className="budget-not-set">
                <span className="budget-label">Budget not set</span>
                <span className="budget-hint">Click to set a budget</span>
              </div>
            ) : (
              <>
                <div className="budget-amounts">
                  <span className="budget-spending">
                    {formatCurrency(budgetStats.totalSpending)}
                  </span>
                  <span className="budget-separator">/</span>
                  <span className="budget-total">{formatCurrency(budget)}</span>
                </div>
                <div className="budget-status-text">
                  {budgetStats.remaining >= 0 ? (
                    <span className="budget-remaining">
                      {formatCurrency(budgetStats.remaining)} remaining
                    </span>
                  ) : (
                    <span className="budget-over">
                      {formatCurrency(Math.abs(budgetStats.remaining))} over budget
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="budget-actions">
          {budget && (
            <div className="budget-percentage">
              {budgetStats.percentageUsed.toFixed(0)}%
            </div>
          )}
          <button
            className="budget-expand-btn"
            aria-label={isExpanded ? 'Collapse budget details' : 'Expand budget details'}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Progress Bar - Always visible when budget is set */}
      {budget && (
        <div className="budget-progress-container">
          <div className="budget-progress-bar">
            <div
              className="budget-progress-fill"
              style={{
                width: `${Math.min(budgetStats.percentageUsed, 100)}%`
              }}
              role="progressbar"
              aria-valuenow={budgetStats.percentageUsed}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="budget-details">
          {/* Budget Editor */}
          <div className="budget-editor">
            <div className="budget-editor-header">
              <h3>Budget Settings</h3>
            </div>

            {isEditingBudget ? (
              <div className="budget-input-group">
                <div className="budget-input-wrapper">
                  <span className="budget-currency-symbol">{currency}</span>
                  <input
                    type="number"
                    className="budget-input"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="Enter budget amount"
                    min="0"
                    step="0.01"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateBudget();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    aria-label="Budget amount"
                  />
                </div>
                <div className="budget-editor-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleUpdateBudget}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="budget-display">
                <div className="budget-current">
                  {budget ? (
                    <>
                      <span className="budget-label">Total Budget:</span>
                      <span className="budget-value">{formatCurrency(budget)}</span>
                    </>
                  ) : (
                    <span className="budget-label">No budget set</span>
                  )}
                </div>
                {onUpdateBudget && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsEditingBudget(true)}
                  >
                    {budget ? 'Edit Budget' : 'Set Budget'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Spending Breakdown */}
          {budget && (
            <div className="budget-breakdown">
              <h3>Spending Overview</h3>
              <div className="breakdown-grid">
                <div className="breakdown-item">
                  <span className="breakdown-icon">💵</span>
                  <div className="breakdown-content">
                    <span className="breakdown-label">Current Spending</span>
                    <span className="breakdown-value">
                      {formatCurrency(budgetStats.totalSpending)}
                    </span>
                  </div>
                </div>

                <div className="breakdown-item">
                  <span className="breakdown-icon">
                    {budgetStats.remaining >= 0 ? '💰' : '⚠️'}
                  </span>
                  <div className="breakdown-content">
                    <span className="breakdown-label">
                      {budgetStats.remaining >= 0 ? 'Remaining' : 'Over Budget'}
                    </span>
                    <span className="breakdown-value">
                      {formatCurrency(Math.abs(budgetStats.remaining))}
                    </span>
                  </div>
                </div>

                <div className="breakdown-item">
                  <span className="breakdown-icon">📊</span>
                  <div className="breakdown-content">
                    <span className="breakdown-label">Budget Used</span>
                    <span className="breakdown-value">
                      {budgetStats.percentageUsed.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Item Price Status */}
          <div className="budget-items-status">
            <h3>Item Price Status</h3>
            <div className="items-status-grid">
              <div className="status-item">
                <span className="status-icon">✓</span>
                <div className="status-content">
                  <span className="status-value">{budgetStats.itemsWithPrices}</span>
                  <span className="status-label">Items with prices</span>
                </div>
              </div>

              <div className="status-item">
                <span className="status-icon">?</span>
                <div className="status-content">
                  <span className="status-value">{budgetStats.itemsWithoutPrices}</span>
                  <span className="status-label">Items without prices</span>
                </div>
              </div>

              <div className="status-item">
                <span className="status-icon">📦</span>
                <div className="status-content">
                  <span className="status-value">{items.length}</span>
                  <span className="status-label">Total items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Statistics */}
          {budgetStats.priceStats && (
            <div className="budget-price-stats">
              <h3>Price Statistics</h3>
              <div className="price-stats-grid">
                <div className="price-stat">
                  <span className="price-stat-label">Average Price</span>
                  <span className="price-stat-value">
                    {formatCurrency(budgetStats.priceStats.average)}
                  </span>
                </div>

                <div className="price-stat">
                  <span className="price-stat-label">Lowest Price</span>
                  <span className="price-stat-value">
                    {formatCurrency(budgetStats.priceStats.min)}
                  </span>
                </div>

                <div className="price-stat">
                  <span className="price-stat-label">Highest Price</span>
                  <span className="price-stat-value">
                    {formatCurrency(budgetStats.priceStats.max)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warnings and Tips */}
          {budget && (
            <div className="budget-alerts">
              {budgetStats.percentageUsed > 100 && (
                <div className="budget-alert alert-danger">
                  <span className="alert-icon">⚠️</span>
                  <div className="alert-content">
                    <strong>Over Budget</strong>
                    <p>You've exceeded your budget by {formatCurrency(Math.abs(budgetStats.remaining))}.</p>
                  </div>
                </div>
              )}

              {budgetStats.percentageUsed > 80 && budgetStats.percentageUsed <= 100 && (
                <div className="budget-alert alert-warning">
                  <span className="alert-icon">⚠️</span>
                  <div className="alert-content">
                    <strong>Near Budget Limit</strong>
                    <p>You've used {budgetStats.percentageUsed.toFixed(0)}% of your budget.</p>
                  </div>
                </div>
              )}

              {budgetStats.itemsWithoutPrices > 0 && (
                <div className="budget-alert alert-info">
                  <span className="alert-icon">ℹ️</span>
                  <div className="alert-content">
                    <strong>Missing Prices</strong>
                    <p>
                      {budgetStats.itemsWithoutPrices} item{budgetStats.itemsWithoutPrices !== 1 ? 's' : ''} {budgetStats.itemsWithoutPrices !== 1 ? 'have' : 'has'} no price set. Add prices for more accurate budget tracking.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
