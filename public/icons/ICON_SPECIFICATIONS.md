# Icon Specifications for Designers

## Overview

This document provides detailed specifications for creating or modifying icons for the Grocery List PWA. Use this as a reference when designing or updating app icons.

---

## Quick Specifications

| Attribute | Value |
|-----------|-------|
| Primary Format | SVG (vector) |
| Canvas Size | 512x512 px |
| Safe Zone | 80% (409.6px diameter circle) |
| Primary Color | #4caf50 (Green) |
| Secondary Color | #ffffff (White) |
| Background | Solid or transparent |
| Export Formats | SVG, PNG (multiple sizes) |
| Design Style | Minimalist, modern, flat |

---

## Design Concept

### Primary Icon: Shopping Cart with Checkmark

**Symbolism:**
- **Shopping Cart**: Represents grocery shopping
- **Checkmark**: Represents completed/checked items
- **Green Background**: Brand color, represents freshness/growth
- **White Icon**: High contrast, clean, professional

**Key Features:**
- Centered composition
- Bold, recognizable shapes
- Works at small sizes (16x16)
- Clear visual hierarchy
- Grocery/shopping theme

---

## Color Specifications

### Brand Colors (from App.css)

```css
Primary Green:    #4caf50  RGB(76, 175, 80)
Darker Green:     #45a049  RGB(69, 160, 73)
Background Gray:  #f5f5f5  RGB(245, 245, 245)
White:            #ffffff  RGB(255, 255, 255)
Text Color:       #333333  RGB(51, 51, 51)
```

### Category Accent Colors

```css
Produce:      #81c784  RGB(129, 199, 132)  Light Green
Dairy:        #64b5f6  RGB(100, 181, 246)  Blue
Meat:         #e57373  RGB(229, 115, 115)  Red
Bakery:       #ffb74d  RGB(255, 183, 77)   Orange
Pantry:       #a1887f  RGB(161, 136, 127)  Brown
Frozen:       #4dd0e1  RGB(77, 208, 225)   Cyan
Beverages:    #ba68c8  RGB(186, 104, 200)  Purple
Other:        #90a4ae  RGB(144, 164, 174)  Gray-Blue
```

### Color Usage Guidelines

**For Icon Background:**
- Primary: #4caf50 (recommended)
- Alternative: #ffffff with border
- Gradient: #4caf50 to #45a049

**For Icon Elements:**
- Main elements: #ffffff (white)
- Accents: Category colors (sparingly)
- Shadows: 10-20% opacity black

---

## Size Requirements

### Standard Icons (PNG)

Export the following sizes from your SVG source:

```
Favicon:
- 16x16 px
- 32x32 px
- 48x48 px

Mobile/Tablet:
- 72x72 px   (Legacy Android)
- 96x96 px   (Android notifications)
- 120x120 px (iOS small)
- 144x144 px (Windows tiles)
- 152x152 px (iPad)
- 180x180 px (iOS large)
- 192x192 px (Android home screen - REQUIRED)
- 512x512 px (Android splash - REQUIRED)

Maskable:
- 192x192 px (maskable purpose)
- 512x512 px (maskable purpose)
```

### Export Settings

**PNG Export:**
- Color Mode: RGB
- Bit Depth: 32-bit (with alpha)
- Compression: Maximum
- Resolution: 72 DPI (web standard)
- Background: Transparent (standard) or Solid (maskable)

**SVG Export:**
- Optimize for web
- Decimal places: 2
- Remove metadata
- Remove unused definitions
- Collapse groups when possible
- ViewBox: 0 0 512 512

---

## Maskable Icon Requirements

### What is Maskable?

Maskable icons allow different platforms to apply their own shape masks (circles, squircles, rounded squares) while maintaining design integrity.

### Safe Zone Calculation

For 512x512 canvas:
- **Full Canvas**: 512px × 512px
- **Safe Zone (80%)**: 409.6px diameter circle
- **Safe Zone Radius**: 204.8px from center
- **Bleed Area**: 51.2px on each side

### Safe Zone Template

Create a guide layer in your design software:

```
Circle:
- Center: 256, 256
- Radius: 204.8px
- Stroke: Red (for visibility)
- Fill: None
- Layer: Guide (non-printing)
```

### Content Placement Rules

1. **Critical Elements**: Must be within 70% (358.4px diameter)
   - Logo/symbol
   - Brand text
   - Important iconography

2. **Secondary Elements**: Can extend to 80% (409.6px diameter)
   - Decorative elements
   - Accent shapes
   - Background patterns

3. **Bleed Area**: 80-100%
   - Background color only
   - No important content
   - Will be cropped on some platforms

### Maskable Design Checklist

- [ ] Background extends to all edges (full bleed)
- [ ] No transparency in background
- [ ] Important content within 80% safe zone
- [ ] Logo/text within 70% critical zone
- [ ] Tested on [Maskable.app](https://maskable.app/editor)
- [ ] Previewed with circle, squircle, and rounded square masks
- [ ] Icon recognizable in all mask shapes

---

## Design Guidelines

### Shape and Composition

**DO:**
- Center main elements
- Use simple, bold shapes
- Maintain clear visual hierarchy
- Leave adequate negative space
- Use geometric shapes
- Keep designs symmetrical (when appropriate)

**DON'T:**
- Use fine details or thin lines
- Include small text (unless at large sizes)
- Create overly complex compositions
- Use gradients excessively
- Include photorealistic images
- Add drop shadows (use flat design)

### Typography (if applicable)

**If including text:**
- Font: Sans-serif, bold weight
- Size: Minimum 48px at 512x512 canvas
- Stroke: None or very thick
- Position: Centered or bottom-aligned
- Characters: Maximum 4-5 characters
- Case: ALL CAPS for readability

### Scalability Test

Your icon should be recognizable at these sizes:

1. **16x16**: Favicon in browser tab
   - Simplest version
   - High contrast
   - Minimal details

2. **48x48**: Desktop shortcuts
   - Clear main shape
   - Recognizable symbol

3. **192x192**: Mobile home screen
   - Full details visible
   - Brand colors clear

4. **512x512**: Splash screens
   - Maximum detail
   - Crisp edges
   - Professional appearance

---

## Technical Specifications

### SVG Structure

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 512 512"
     width="512"
     height="512">

  <!-- Background (for maskable) -->
  <circle cx="256" cy="256" r="256" fill="#4caf50"/>

  <!-- Icon content (within safe zone) -->
  <g transform="translate(256, 256)">
    <!-- Your icon paths here -->
  </g>
</svg>
```

### Path Optimization

- Use relative commands (lowercase)
- Simplify paths (reduce anchor points)
- Merge overlapping shapes
- Convert strokes to fills
- Round coordinates to 2 decimal places

### File Size Targets

```
SVG:      < 5 KB   (optimized)
16x16:    < 1 KB
32x32:    < 2 KB
192x192:  < 10 KB
512x512:  < 50 KB
```

---

## Design Process

### 1. Concept Phase

- [ ] Research grocery/shopping iconography
- [ ] Sketch 3-5 concepts
- [ ] Review with stakeholders
- [ ] Select primary concept

### 2. Design Phase

- [ ] Create in vector software (Illustrator, Figma, Inkscape)
- [ ] Set canvas to 512x512px
- [ ] Add safe zone guide (409.6px circle)
- [ ] Design within safe zone
- [ ] Use brand colors
- [ ] Keep design simple and bold

### 3. Refinement Phase

- [ ] Test at 16x16, 48x48, 192x192 sizes
- [ ] Ensure recognition at all sizes
- [ ] Adjust details as needed
- [ ] Optimize paths and shapes
- [ ] Remove unnecessary elements

### 4. Export Phase

- [ ] Export as optimized SVG
- [ ] Generate PNG assets (all sizes)
- [ ] Create maskable versions
- [ ] Generate favicon.ico
- [ ] Verify file sizes

### 5. Testing Phase

- [ ] Preview in browser
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Test maskable on Maskable.app
- [ ] Test in PWA installation flow

---

## Software Recommendations

### Vector Design Tools

**Professional:**
- Adobe Illustrator (industry standard)
- Figma (collaborative, web-based)
- Sketch (macOS only)
- Affinity Designer (affordable alternative)

**Free/Open Source:**
- Inkscape (full-featured, cross-platform)
- Vectr (simple, web-based)
- Gravit Designer (cross-platform)

### Export/Optimization Tools

**SVG Optimization:**
- SVGO (command line)
- SVGOMG (web-based GUI for SVGO)
- Figma (built-in optimization)

**PNG Generation:**
- Sharp (Node.js library) - **Recommended**
- ImageMagick (command line)
- Inkscape (command line)
- Photoshop (batch actions)

**Favicon Generation:**
- RealFaviconGenerator (comprehensive)
- Favicon.io (simple)
- ImageMagick (command line)

---

## Current Icon Analysis

### icon-template.svg Breakdown

**Structure:**
```
- Canvas: 512x512px
- Background: Green circle (#4caf50)
- Main element: Shopping cart (white)
- Secondary element: Checkmark (green on white)
- Accent elements: Category colored dots
```

**Shopping Cart:**
- Position: Centered
- Color: White
- Strokes: 8-10px width
- Style: Line art, simplified

**Checkmark:**
- Position: Inside cart
- Color: Green (#4caf50)
- Stroke: 12px width
- Style: Bold, friendly

**Decorative Dots:**
- Colors: Category accent colors
- Size: 9-12px diameter
- Position: Corners (within safe zone)
- Purpose: Visual interest, brand connection

---

## Alternative Design Concepts

If redesigning, consider these alternative concepts:

### Concept A: Shopping Bag
- Paper bag outline
- Checkmark or items visible inside
- Simple, universally recognized

### Concept B: Checklist
- Clipboard or list icon
- Checkmarks on items
- Direct representation of app function

### Concept C: Cart + Items
- Shopping cart
- Produce items inside (apple, carrot)
- More detailed, colorful

### Concept D: Abstract
- Geometric shapes
- Green primary color
- Modern, minimalist
- Good for brand differentiation

---

## Approval Checklist

Before finalizing icons, verify:

- [ ] Icon is recognizable at 16x16
- [ ] Icon is recognizable at 48x48
- [ ] Icon looks professional at 512x512
- [ ] Colors match brand guidelines
- [ ] Design fits within 80% safe zone
- [ ] Maskable version tested on Maskable.app
- [ ] All required sizes exported
- [ ] File sizes are optimized
- [ ] SVG is clean and optimized
- [ ] Stakeholders have approved design
- [ ] Icons work on light and dark backgrounds
- [ ] Favicon is clearly visible in browser tab

---

## Maintenance and Updates

### When to Update Icons

- App rebrand or major version change
- User feedback indicates poor recognition
- Platform guidelines change
- Competitor analysis suggests improvement needed
- A/B testing shows better alternative

### Version Control

- Save master SVG in version control
- Tag releases with version numbers
- Document design changes in commit messages
- Keep old versions for reference

### Testing After Updates

- Clear browser cache
- Test PWA installation
- Verify on multiple devices
- Check in light/dark modes
- Validate maskable appearance

---

## Contact and Resources

**For Questions:**
- Review: `/docs/PWA_ICONS.md`
- GitHub Issues: Report problems or suggestions
- Design System: See `/src/App.css` for colors

**Helpful Resources:**
- [Web.dev PWA Icons Guide](https://web.dev/add-manifest/#icons)
- [Maskable.app Editor](https://maskable.app/editor)
- [Material Design Icons](https://material.io/design/iconography)
- [PWA Builder](https://www.pwabuilder.com/)

---

## Quick Start for Designers

1. **Get the template**: `/public/icons/icon-template.svg`
2. **Open in vector software**: Illustrator, Figma, Inkscape
3. **Enable safe zone guide**: 409.6px diameter circle
4. **Make changes**: Keep within safe zone
5. **Export SVG**: Optimized, viewBox="0 0 512 512"
6. **Generate PNGs**: Run `node scripts/generate-icons.js`
7. **Test**: Preview in browser and on devices

---

Last Updated: 2025-10-26
Version: 1.0
