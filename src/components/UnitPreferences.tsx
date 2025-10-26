import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserPreferences, MeasurementUnit } from '../types';
import './UnitPreferences.css';

const VOLUME_UNITS: MeasurementUnit[] = ['cup', 'tbsp', 'tsp', 'ml', 'l'];
const WEIGHT_UNITS: MeasurementUnit[] = ['oz', 'lb', 'g', 'kg'];

// Storage key for preferences
const PREFERENCES_STORAGE_KEY = 'grocery_unit_preferences';

// Default preferences
const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  preferredSystem: 'mixed',
  defaultVolumeUnit: 'cup',
  defaultWeightUnit: 'lb',
  displayFormat: 'full',
  autoConvert: false,
};

export function UnitPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (user) {
      try {
        const stored = localStorage.getItem(`${PREFERENCES_STORAGE_KEY}_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }, [user]);

  // Show temporary message
  const showMessage = (type: 'success' | 'error', text: string, duration = 3000) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), duration);
  };

  // Save preferences
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`${PREFERENCES_STORAGE_KEY}_${user.id}`, JSON.stringify(preferences));

      // TODO: When Zero hooks are available, also save to database:
      // await updateUserPreferences(preferences);

      showMessage('success', 'Preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      showMessage('error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle system change
  const handleSystemChange = (system: 'metric' | 'imperial' | 'mixed') => {
    setPreferences(prev => ({ ...prev, preferredSystem: system }));
  };

  // Handle unit changes
  const handleVolumeUnitChange = (unit: MeasurementUnit) => {
    setPreferences(prev => ({ ...prev, defaultVolumeUnit: unit }));
  };

  const handleWeightUnitChange = (unit: MeasurementUnit) => {
    setPreferences(prev => ({ ...prev, defaultWeightUnit: unit }));
  };

  // Handle toggle changes
  const handleAutoConvertToggle = () => {
    setPreferences(prev => ({ ...prev, autoConvert: !prev.autoConvert }));
  };

  // Handle display format change
  const handleDisplayFormatChange = (format: 'full' | 'abbreviated') => {
    setPreferences(prev => ({ ...prev, displayFormat: format }));
  };

  // Format unit name for display
  const formatUnitName = (unit: MeasurementUnit): string => {
    const names: Record<MeasurementUnit, string> = {
      cup: 'Cup',
      tbsp: 'Tablespoon',
      tsp: 'Teaspoon',
      oz: 'Ounce',
      lb: 'Pound',
      g: 'Gram',
      kg: 'Kilogram',
      ml: 'Milliliter',
      l: 'Liter',
      piece: 'Piece',
      whole: 'Whole',
      clove: 'Clove',
      bunch: 'Bunch',
      package: 'Package',
    };
    return names[unit] || unit;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="unit-preferences">
      <div className="preferences-header">
        <h3>Unit Preferences</h3>
        <p className="preferences-description">
          Configure how measurements are displayed in recipes and grocery lists
        </p>
      </div>

      {/* Message Display */}
      {saveMessage && (
        <div className={`preferences-message preferences-message-${saveMessage.type}`} role="status">
          <span className="message-icon">
            {saveMessage.type === 'success' ? '✓' : '✕'}
          </span>
          <span className="message-text">{saveMessage.text}</span>
        </div>
      )}

      {/* Preferred System */}
      <div className="preferences-section">
        <label className="section-label">Preferred Measurement System</label>
        <p className="section-description">
          Choose your preferred system for displaying measurements
        </p>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="system"
              value="metric"
              checked={preferences.preferredSystem === 'metric'}
              onChange={() => handleSystemChange('metric')}
            />
            <span className="radio-label">
              <span className="radio-title">Metric</span>
              <span className="radio-description">Grams, kilograms, milliliters, liters</span>
            </span>
          </label>

          <label className="radio-option">
            <input
              type="radio"
              name="system"
              value="imperial"
              checked={preferences.preferredSystem === 'imperial'}
              onChange={() => handleSystemChange('imperial')}
            />
            <span className="radio-label">
              <span className="radio-title">Imperial</span>
              <span className="radio-description">Ounces, pounds, cups, tablespoons</span>
            </span>
          </label>

          <label className="radio-option">
            <input
              type="radio"
              name="system"
              value="mixed"
              checked={preferences.preferredSystem === 'mixed'}
              onChange={() => handleSystemChange('mixed')}
            />
            <span className="radio-label">
              <span className="radio-title">Mixed</span>
              <span className="radio-description">Use both systems as appropriate</span>
            </span>
          </label>
        </div>
      </div>

      {/* Default Units */}
      <div className="preferences-section">
        <label className="section-label">Default Units</label>
        <p className="section-description">
          Choose the default units when adding new items
        </p>

        <div className="unit-selectors">
          <div className="unit-selector-group">
            <label htmlFor="volume-unit" className="unit-selector-label">
              Volume Unit
            </label>
            <select
              id="volume-unit"
              className="unit-select"
              value={preferences.defaultVolumeUnit}
              onChange={(e) => handleVolumeUnitChange(e.target.value as MeasurementUnit)}
            >
              {VOLUME_UNITS.map(unit => (
                <option key={unit} value={unit}>
                  {formatUnitName(unit)} ({unit})
                </option>
              ))}
            </select>
          </div>

          <div className="unit-selector-group">
            <label htmlFor="weight-unit" className="unit-selector-label">
              Weight Unit
            </label>
            <select
              id="weight-unit"
              className="unit-select"
              value={preferences.defaultWeightUnit}
              onChange={(e) => handleWeightUnitChange(e.target.value as MeasurementUnit)}
            >
              {WEIGHT_UNITS.map(unit => (
                <option key={unit} value={unit}>
                  {formatUnitName(unit)} ({unit})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Auto-Convert Toggle */}
      <div className="preferences-section">
        <div className="toggle-setting">
          <div className="toggle-info">
            <label htmlFor="auto-convert" className="toggle-label">
              Auto-Convert Units
            </label>
            <p className="toggle-description">
              Automatically convert units to your preferred system when viewing recipes
            </p>
          </div>
          <label className="toggle-switch">
            <input
              id="auto-convert"
              type="checkbox"
              checked={preferences.autoConvert}
              onChange={handleAutoConvertToggle}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Display Format */}
      <div className="preferences-section">
        <label className="section-label">Display Format</label>
        <p className="section-description">
          How should unit names be displayed?
        </p>
        <div className="radio-group radio-group-inline">
          <label className="radio-option radio-option-inline">
            <input
              type="radio"
              name="displayFormat"
              value="full"
              checked={preferences.displayFormat === 'full'}
              onChange={() => handleDisplayFormatChange('full')}
            />
            <span className="radio-label">
              <span className="radio-title">Full</span>
              <span className="radio-description">(e.g., "2 tablespoons")</span>
            </span>
          </label>

          <label className="radio-option radio-option-inline">
            <input
              type="radio"
              name="displayFormat"
              value="abbreviated"
              checked={preferences.displayFormat === 'abbreviated'}
              onChange={() => handleDisplayFormatChange('abbreviated')}
            />
            <span className="radio-label">
              <span className="radio-title">Abbreviated</span>
              <span className="radio-description">(e.g., "2 tbsp")</span>
            </span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="preferences-actions">
        <button
          className="btn-save-preferences"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="spinner-small"></span>
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>

      {/* Info Footer */}
      <div className="preferences-footer">
        <p className="footer-note">
          <strong>Note:</strong> These preferences will apply to all recipes and grocery items with measurements.
          You can always manually edit individual item units.
        </p>
      </div>
    </div>
  );
}
