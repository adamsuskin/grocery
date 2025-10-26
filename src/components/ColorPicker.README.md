# ColorPicker Component

A comprehensive, accessible color picker component for custom categories in the Grocery List application.

## Features

- **Preset Colors Grid**: Displays a grid of preset colors for quick selection (default: food and category-related colors)
- **Custom Color Input**: HTML5 color picker with hex input for custom colors
- **Color Preview**: Real-time color preview with current selection display
- **Reset/Clear Option**: Quick reset to default color
- **Keyboard Navigation**: Full keyboard accessibility support
- **Responsive Design**: Works on mobile, tablet, and desktop
- **High Contrast Mode**: Support for accessibility preferences
- **Reduced Motion**: Respects user's motion preferences

## Usage

### Basic Usage

```tsx
import { ColorPicker } from './components/ColorPicker';

function MyComponent() {
  const [color, setColor] = useState('#4caf50');

  return (
    <ColorPicker
      value={color}
      onChange={setColor}
      label="Select a color"
    />
  );
}
```

### With Custom Preset Colors

```tsx
const foodColors = [
  '#81c784', // Green
  '#e57373', // Red
  '#64b5f6', // Blue
  '#ffb74d', // Orange
];

<ColorPicker
  value={color}
  onChange={setColor}
  presetColors={foodColors}
  label="Category Color"
/>
```

### Disabled State

```tsx
<ColorPicker
  value={color}
  onChange={setColor}
  label="Color"
  disabled={true}
/>
```

## Props

### ColorPickerProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `'#4caf50'` | Current hex color value |
| `onChange` | `(color: string) => void` | Required | Callback when color changes |
| `presetColors` | `string[]` | Default food colors | Array of preset hex colors to display |
| `label` | `string` | `'Color'` | Label for the color picker |
| `disabled` | `boolean` | `false` | Whether the picker is disabled |

## Default Preset Colors

The component includes 24 default preset colors:

- **Category Colors**: Produce (green), Dairy (blue), Meat (red), Bakery (orange), Pantry (brown), Frozen (cyan), Beverages (purple), Other (gray)
- **Material Design Colors**: Primary, danger, blue, orange, purple, amber, cyan, deep orange, deep purple, indigo, teal, light green, lime, yellow, brown, blue gray

## Accessibility Features

### Keyboard Navigation

- **Tab**: Navigate between preset colors, custom color button, and inputs
- **Arrow Keys**: Navigate through preset color grid
- **Enter/Space**: Select a preset color or toggle custom input
- **Escape**: Close custom input section (if open)

### Screen Reader Support

- ARIA labels on all interactive elements
- Role="radiogroup" for preset colors grid
- Role="radio" for individual color buttons
- Clear focus indicators
- Status announcements for color changes

### Visual Accessibility

- High contrast borders for selected colors
- Focus visible outlines on all interactive elements
- Color preview with accessible touch targets (min 44x44px on mobile)
- Error messages with clear visual indicators

### Motion Preferences

- Respects `prefers-reduced-motion` media query
- Disables animations when user prefers reduced motion

## Styling

The component uses CSS custom properties from the main app theme:

```css
--primary-color
--text-color
--text-muted
--border-color
--danger-color
```

Custom styling can be applied by overriding the `.color-picker` class and its children.

## Integration with CustomCategoryManager

The ColorPicker is integrated into the CustomCategoryManager component for both:

1. **Add Category Form**: Allows users to select a color when creating a new category
2. **Edit Category Form**: Allows users to change the color of existing categories

Example integration:

```tsx
<ColorPicker
  value={newCategoryColor}
  onChange={setNewCategoryColor}
  label="Color (optional)"
  disabled={isAdding}
/>
```

## Responsive Behavior

### Desktop (>768px)
- 8 columns grid for preset colors
- Full-width custom color input section

### Tablet (768px and below)
- 6 columns grid for preset colors
- Stacked layout for actions

### Mobile (600px and below)
- 5 columns grid for preset colors
- Full-width buttons
- Larger touch targets

### Small Mobile (480px and below)
- 4 columns grid for preset colors
- Compact layout optimized for small screens

## Browser Support

- Modern browsers with ES6+ support
- HTML5 color input support
- Fallback to text input for hex colors

## Files

- `ColorPicker.tsx` - Main component implementation
- `ColorPicker.css` - Component styles with responsive design
- `ColorPicker.example.tsx` - Usage examples and demos
- `ColorPicker.README.md` - This documentation

## Testing

The component can be tested using the example file:

```tsx
import { ColorPickerExample } from './components/ColorPicker.example';

// Render the example in your app to see all features
<ColorPickerExample />
```

## Future Enhancements

Potential future improvements:

- Color palette management (save/load custom palettes)
- Recent colors history
- Color contrast checker for text readability
- Color picker from image
- Gradient support
- Color name display (e.g., "Forest Green")
- Opacity/alpha channel support

## Related Components

- `EmojiPicker` - Icon/emoji selection for categories
- `CustomCategoryManager` - Parent component using ColorPicker

## License

Part of the Grocery List application.
