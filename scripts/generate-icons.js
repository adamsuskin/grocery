/**
 * Icon Generation Script
 *
 * Generates PNG icons from the SVG template for PWA installation
 *
 * Requirements:
 *   npm install --save-dev sharp
 *
 * Usage:
 *   node scripts/generate-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes to generate
const standardSizes = [16, 32, 48, 72, 96, 120, 144, 152, 180, 192, 512];
const maskableSizes = [192, 512];

// Paths
const svgPath = path.join(__dirname, '../public/icons/icon-template.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('Created icons directory');
}

// Verify SVG exists
if (!fs.existsSync(svgPath)) {
  console.error(`Error: SVG template not found at ${svgPath}`);
  console.error('Please ensure icon-template.svg exists in public/icons/');
  process.exit(1);
}

/**
 * Generate icons from SVG
 */
async function generateIcons() {
  console.log('Starting icon generation...\n');

  try {
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate standard icons
    console.log('Generating standard icons:');
    for (const size of standardSizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({
          compressionLevel: 9,
          quality: 100
        })
        .toFile(outputPath);

      console.log(`  ✓ Generated icon-${size}x${size}.png`);
    }

    // Generate maskable icons (full bleed, no transparency)
    console.log('\nGenerating maskable icons:');
    for (const size of maskableSizes) {
      const outputPath = path.join(outputDir, `icon-maskable-${size}x${size}.png`);

      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 76, g: 175, b: 80, alpha: 1 } // #4caf50
        })
        .png({
          compressionLevel: 9,
          quality: 100
        })
        .toFile(outputPath);

      console.log(`  ✓ Generated icon-maskable-${size}x${size}.png`);
    }

    // Generate favicon from 32x32
    console.log('\nGenerating favicon:');
    const faviconPath = path.join(__dirname, '../public/favicon.ico');

    // Sharp doesn't support ICO directly, so we create a 32x32 PNG as favicon
    // For actual .ico files, use imagemagick or online tool
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(outputDir, 'favicon-32x32.png'));

    console.log('  ✓ Generated favicon-32x32.png');
    console.log('  ⚠ Note: For .ico file, use ImageMagick or online converter');
    console.log('    Command: convert public/icons/icon-template.svg -define icon:auto-resize=16,32,48 public/favicon.ico');

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('Icon generation complete!');
    console.log('='.repeat(60));
    console.log(`\nGenerated ${standardSizes.length} standard icons`);
    console.log(`Generated ${maskableSizes.length} maskable icons`);
    console.log('\nNext steps:');
    console.log('1. Review generated icons in public/icons/');
    console.log('2. Test icons using: npm run dev and visit /icon-test.html');
    console.log('3. Create manifest.json (see docs/PWA_ICONS.md)');
    console.log('4. Update index.html with icon references');
    console.log('5. Generate favicon.ico using ImageMagick or online tool');
    console.log('\nSee docs/PWA_ICONS.md for detailed documentation');

  } catch (error) {
    console.error('\n❌ Error generating icons:', error.message);
    console.error('\nMake sure sharp is installed: npm install --save-dev sharp');
    process.exit(1);
  }
}

// Run the generation
generateIcons().catch(console.error);
