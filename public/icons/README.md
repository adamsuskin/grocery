# PWA Icon Assets

This directory contains all icon assets for the Grocery List Progressive Web App.

## Contents

- **icon-template.svg** - Source SVG template (DO NOT DELETE)
- **icon-{size}x{size}.png** - Standard PNG icons at various sizes
- **icon-maskable-{size}x{size}.png** - Maskable icons for adaptive platforms
- **ICON_SPECIFICATIONS.md** - Detailed specifications for designers

## Quick Start

### Generate All Icons

```bash
# Install Sharp (if not already installed)
npm install --save-dev sharp

# Run generation script
node scripts/generate-icons.js
```

### Manual Generation (Inkscape)

```bash
# Generate a specific size
inkscape icon-template.svg \
  --export-type=png \
  --export-filename=icon-192x192.png \
  -w 192 -h 192
```

### Manual Generation (ImageMagick)

```bash
# Generate a specific size
convert -background none -resize 192x192 \
  icon-template.svg icon-192x192.png
```

## Required Sizes

### Minimum Required (PWA)
- 192x192 (standard)
- 512x512 (standard)
- 192x192 (maskable)
- 512x512 (maskable)

### Recommended (All Platforms)
- 16x16, 32x32, 48x48 (Favicon)
- 72x72, 96x96 (Android)
- 120x120, 152x152, 180x180 (iOS)
- 144x144 (Windows)

## Design Guidelines

### Color Scheme
- Primary: #4caf50 (Green)
- Secondary: #ffffff (White)
- Accent: Category colors

### Safe Zone (Maskable Icons)
- Total Canvas: 512x512
- Safe Zone: 80% (409.6px diameter)
- Critical Content: 70% (358.4px diameter)

### Design Concept
- Shopping cart with checkmark
- Minimalist, modern style
- High contrast for visibility
- Recognizable at small sizes

## Testing

### Preview Icons
Visit: `http://localhost:5173/icon-test.html`

### Test Maskable Icons
1. Go to: https://maskable.app/editor
2. Upload: icon-maskable-512x512.png
3. Test with different masks

### Test PWA Installation
1. Deploy app
2. Install on mobile device
3. Verify home screen icon
4. Check splash screen

## Documentation

For complete documentation, see:
- `/docs/PWA_ICONS.md` - Complete guide
- `ICON_SPECIFICATIONS.md` - Designer specs
- `/scripts/generate-icons.js` - Generation script

## Maintenance

### Updating Icons
1. Edit `icon-template.svg`
2. Run `node scripts/generate-icons.js`
3. Test in browser
4. Commit all changes

### Version Control
- Keep icon-template.svg in git
- Commit all generated PNG files
- Tag icon updates with versions

## File Checklist

```
☐ icon-template.svg (source)
☐ icon-16x16.png
☐ icon-32x32.png
☐ icon-48x48.png
☐ icon-72x72.png
☐ icon-96x96.png
☐ icon-120x120.png
☐ icon-144x144.png
☐ icon-152x152.png
☐ icon-180x180.png
☐ icon-192x192.png
☐ icon-512x512.png
☐ icon-maskable-192x192.png
☐ icon-maskable-512x512.png
```

## Troubleshooting

### Icons Not Loading
- Clear browser cache
- Check file paths in manifest.json
- Verify files exist in this directory
- Check browser console for errors

### Icons Look Blurry
- Regenerate from SVG source
- Ensure no CSS scaling
- Use exact size (no browser resizing)

### Maskable Icons Cropped
- Reduce content size
- Keep within 80% safe zone
- Test at Maskable.app

## Support

For questions or issues:
- Review: `/docs/PWA_ICONS.md`
- GitHub Issues: Report problems
- Design System: See `/src/App.css`

---

Last Updated: 2025-10-26
