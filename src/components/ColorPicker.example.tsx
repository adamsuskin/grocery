import { useState } from 'react';
import { ColorPicker } from './ColorPicker';
import './ColorPicker.css';

/**
 * Example usage of the ColorPicker component
 *
 * This demonstrates how to use the ColorPicker component
 * with different configurations and preset colors.
 */
export function ColorPickerExample() {
  const [basicColor, setBasicColor] = useState('#4caf50');
  const [customPresetsColor, setCustomPresetsColor] = useState('#e57373');
  const [disabledColor, setDisabledColor] = useState('#64b5f6');

  // Custom preset colors for different use cases
  const foodColors = [
    '#81c784', // Green for produce
    '#ffb74d', // Orange for bakery
    '#e57373', // Red for meat
    '#64b5f6', // Blue for dairy
    '#a1887f', // Brown for pantry
    '#ba68c8', // Purple for beverages
  ];

  const vibrantColors = [
    '#f44336', // Red
    '#e91e63', // Pink
    '#9c27b0', // Purple
    '#673ab7', // Deep Purple
    '#3f51b5', // Indigo
    '#2196f3', // Blue
    '#03a9f4', // Light Blue
    '#00bcd4', // Cyan
    '#009688', // Teal
    '#4caf50', // Green
    '#8bc34a', // Light Green
    '#cddc39', // Lime
    '#ffeb3b', // Yellow
    '#ffc107', // Amber
    '#ff9800', // Orange
    '#ff5722', // Deep Orange
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>ColorPicker Component Examples</h1>

      {/* Example 1: Basic ColorPicker with default presets */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Basic ColorPicker (Default Presets)</h2>
        <p>Uses food and category-related default colors</p>
        <ColorPicker
          value={basicColor}
          onChange={setBasicColor}
          label="Select a color"
        />
        <div style={{ marginTop: '16px', padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
          <strong>Selected Color:</strong> {basicColor}
        </div>
      </section>

      {/* Example 2: Custom preset colors */}
      <section style={{ marginBottom: '40px' }}>
        <h2>ColorPicker with Custom Presets</h2>
        <p>Food-themed color palette</p>
        <ColorPicker
          value={customPresetsColor}
          onChange={setCustomPresetsColor}
          presetColors={foodColors}
          label="Food Category Color"
        />
        <div style={{ marginTop: '16px', padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
          <strong>Selected Color:</strong> {customPresetsColor}
        </div>
      </section>

      {/* Example 3: Vibrant colors palette */}
      <section style={{ marginBottom: '40px' }}>
        <h2>ColorPicker with Vibrant Colors</h2>
        <p>Material Design-inspired color palette</p>
        <ColorPicker
          value={vibrantColors[0]}
          onChange={(color) => console.log('Color changed:', color)}
          presetColors={vibrantColors}
          label="Theme Color"
        />
      </section>

      {/* Example 4: Disabled state */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Disabled ColorPicker</h2>
        <p>Shows how the component looks when disabled</p>
        <ColorPicker
          value={disabledColor}
          onChange={setDisabledColor}
          label="Disabled Color Picker"
          disabled={true}
        />
      </section>

      {/* Example 5: Without label */}
      <section style={{ marginBottom: '40px' }}>
        <h2>ColorPicker Without Label</h2>
        <ColorPicker
          value="#ff5722"
          onChange={(color) => console.log('Color:', color)}
          label=""
        />
      </section>

      {/* Integration Example */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Integration Example</h2>
        <p>Example of using ColorPicker in a form</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert(`Form submitted with color: ${basicColor}`);
          }}
          style={{
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: 'white',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="category-name" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Category Name
            </label>
            <input
              id="category-name"
              type="text"
              placeholder="e.g., Spices, Snacks"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <ColorPicker
              value={basicColor}
              onChange={setBasicColor}
              label="Category Color"
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 24px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Create Category
          </button>
        </form>
      </section>

      {/* Accessibility Features */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Accessibility Features</h2>
        <ul>
          <li>✓ Keyboard navigation support (Tab, Enter, Space, Arrow keys)</li>
          <li>✓ ARIA labels and roles for screen readers</li>
          <li>✓ Clear focus indicators</li>
          <li>✓ High contrast mode support</li>
          <li>✓ Reduced motion support</li>
          <li>✓ Semantic HTML structure</li>
        </ul>
      </section>
    </div>
  );
}

// Default export for easy importing
export default ColorPickerExample;
