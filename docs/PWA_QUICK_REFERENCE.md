# PWA Quick Reference Card

## One-Command Setup

```bash
# Generate all PWA icons from the template
node scripts/generate-pwa-icons.js public/icons/icon-template.svg
```

That's it! Your PWA is ready to test and deploy.

## Key Configuration

| Property | Value | Location |
|----------|-------|----------|
| Manifest | `/manifest.json` | `public/manifest.json` |
| Theme Color | `#4caf50` (green) | manifest.json, index.html |
| Background | `#f5f5f5` (light gray) | manifest.json |
| Display | `standalone` | manifest.json |
| Orientation | `portrait-primary` | manifest.json |
| Icon Template | SVG ready | `public/icons/icon-template.svg` |

## Required Icons (Minimum)

```
public/icons/
├── icon-192x192.png          ← REQUIRED
└── icon-512x512.png          ← REQUIRED
```

**Current Status:** Icon template exists, PNG files need generation

## Testing in 30 Seconds

```bash
# 1. Start dev server
npm run dev

# 2. Open browser
# http://localhost:3000

# 3. Open DevTools (F12)
# Application > Manifest

# 4. Check for errors
# (should show "No errors detected" after icons generated)
```

## Installation Testing

### Android (Chrome)
1. Open app on device
2. Menu → "Install app"
3. Check home screen

### iOS (Safari)
1. Share button
2. "Add to Home Screen"
3. Check home screen

### Desktop (Chrome/Edge)
1. Look for install icon in address bar
2. Click to install
3. Check taskbar/dock

## Common Commands

```bash
# Generate icons
node scripts/generate-pwa-icons.js public/icons/icon-template.svg

# Validate manifest
node -e "console.log(JSON.parse(require('fs').readFileSync('public/manifest.json', 'utf8')).name)"

# Check icon files
ls -lh public/icons/*.png

# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view
```

## Troubleshooting Quick Fixes

### No Install Prompt?
```bash
# Check icons exist
ls public/icons/*.png

# If empty, generate them
node scripts/generate-pwa-icons.js public/icons/icon-template.svg
```

### Manifest Errors?
```bash
# Validate JSON
node -e "JSON.parse(require('fs').readFileSync('public/manifest.json'))"

# Check in browser DevTools
# F12 > Application > Manifest
```

### Icons Not Loading?
```bash
# Verify files
ls -lh public/icons/

# Check paths match manifest.json
grep "icon-" public/manifest.json

# Clear cache and hard refresh
# Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

## Installation Criteria Checklist

**Required for Install Prompt:**
- [x] HTTPS (localhost OK for dev)
- [x] Valid manifest.json
- [x] Manifest linked in HTML
- [ ] Icons: 192x192 and 512x512 PNG
- [ ] Service worker (optional but recommended)

**Current Status:** Ready for icons! Everything else is configured.

## File Locations

```
Created/Modified:
✓ public/manifest.json              (PWA manifest)
✓ public/icons/                     (icon directory)
✓ index.html                        (added meta tags)
✓ docs/PWA_README.md               (full documentation)
✓ docs/PWA_ICON_REQUIREMENTS.md    (icon guide)
✓ docs/PWA_SETUP_GUIDE.md          (setup steps)
✓ docs/PWA_QUICK_REFERENCE.md      (this file)
✓ scripts/generate-pwa-icons.js    (icon generator)

Existing:
✓ public/icons/icon-template.svg   (ready to use)
```

## Next Step

**Generate your icons:**
```bash
node scripts/generate-pwa-icons.js public/icons/icon-template.svg
```

Then test in Chrome at http://localhost:3000

## Resources

- Full docs: `/docs/PWA_README.md`
- Icon guide: `/docs/PWA_ICON_REQUIREMENTS.md`
- Setup steps: `/docs/PWA_SETUP_GUIDE.md`
- Test maskable icons: https://maskable.app/
- PWA audit: Chrome DevTools > Lighthouse

## Support Matrix

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Install | ✓ | ✓* | Limited | ✓ |
| Shortcuts | ✓ | ✗ | ✗ | ✓ |
| Maskable | ✓ | ✗ | ✗ | ✓ |

*Safari uses "Add to Home Screen" instead of install prompt

## Color Scheme

App colors from `src/App.css`:
- Primary: `#4caf50` (green)
- Background: `#f5f5f5` (light gray)
- Card: `#ffffff` (white)
- Text: `#333333` (dark gray)

All PWA colors match this scheme for consistency.

## Quick Links

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
- [Icon Generator](https://www.pwabuilder.com/imageGenerator)
- [Maskable Editor](https://maskable.app/editor)

---

**Status:** Configuration complete. Generate icons to finish PWA setup.
