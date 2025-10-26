#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 *
 * This script generates all required PWA icons from source images.
 *
 * Usage:
 *   node scripts/generate-pwa-icons.js <source-icon.png> [maskable-icon.png]
 *
 * Requirements:
 *   npm install sharp
 *
 * Example:
 *   node scripts/generate-pwa-icons.js assets/icon.png assets/icon-maskable.png
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('\n❌ Error: sharp package not found');
  console.error('Please install it with: npm install sharp\n');
  process.exit(1);
}

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');
const STANDARD_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];
const SHORTCUT_SIZES = [96];

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('\n❌ Error: No source icon provided');
  console.error('\nUsage:');
  console.error('  node scripts/generate-pwa-icons.js <source-icon.png> [maskable-icon.png]');
  console.error('\nExample:');
  console.error('  node scripts/generate-pwa-icons.js assets/icon.png assets/icon-maskable.png\n');
  process.exit(1);
}

const sourceIconPath = args[0];
const maskableIconPath = args[1] || sourceIconPath;

// Verify source files exist
if (!fs.existsSync(sourceIconPath)) {
  console.error(`\n❌ Error: Source icon not found: ${sourceIconPath}\n`);
  process.exit(1);
}

if (!fs.existsSync(maskableIconPath)) {
  console.error(`\n❌ Error: Maskable icon not found: ${maskableIconPath}\n`);
  process.exit(1);
}

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ Created directory: ${OUTPUT_DIR}`);
}

// Helper function to generate icon
async function generateIcon(sourcePath, size, outputName, options = {}) {
  const outputPath = path.join(OUTPUT_DIR, outputName);

  try {
    let pipeline = sharp(sourcePath).resize(size, size, {
      fit: 'contain',
      background: options.background || { r: 0, g: 0, b: 0, alpha: 0 }
    });

    if (options.background) {
      pipeline = pipeline.flatten({ background: options.background });
    }

    await pipeline.png().toFile(outputPath);

    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`  ✅ ${outputName} (${fileSizeKB} KB)`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to generate ${outputName}:`, error.message);
    return false;
  }
}

// Main generation function
async function generateAllIcons() {
  console.log('\n🎨 PWA Icon Generator\n');
  console.log('Configuration:');
  console.log(`  Source icon: ${sourceIconPath}`);
  console.log(`  Maskable icon: ${maskableIconPath}`);
  console.log(`  Output directory: ${OUTPUT_DIR}\n`);

  let successCount = 0;
  let failCount = 0;

  // Generate standard icons
  console.log('📱 Generating standard icons...');
  for (const size of STANDARD_SIZES) {
    const result = await generateIcon(
      sourceIconPath,
      size,
      `icon-${size}x${size}.png`
    );
    if (result) successCount++;
    else failCount++;
  }

  // Generate maskable icons
  console.log('\n🎭 Generating maskable icons...');
  for (const size of MASKABLE_SIZES) {
    const result = await generateIcon(
      maskableIconPath,
      size,
      `icon-${size}x${size}-maskable.png`,
      { background: { r: 76, g: 175, b: 80 } } // #4caf50
    );
    if (result) successCount++;
    else failCount++;
  }

  // Generate shortcut icons (using standard icon)
  console.log('\n⚡ Generating shortcut icons...');
  for (const size of SHORTCUT_SIZES) {
    // Add icon
    const addResult = await generateIcon(
      sourceIconPath,
      size,
      `shortcut-add.png`
    );
    if (addResult) successCount++;
    else failCount++;

    // List icon (same as standard for now)
    const listResult = await generateIcon(
      sourceIconPath,
      size,
      `shortcut-list.png`
    );
    if (listResult) successCount++;
    else failCount++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Generation Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successfully generated: ${successCount} icons`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} icons`);
  }
  console.log(`📁 Output location: ${OUTPUT_DIR}`);
  console.log('\n✨ Done! Your PWA icons are ready.\n');

  // Show next steps
  console.log('Next steps:');
  console.log('  1. Review generated icons in public/icons/');
  console.log('  2. Test maskable icons at https://maskable.app/');
  console.log('  3. Run Lighthouse PWA audit');
  console.log('  4. Test installation on mobile device\n');
}

// Run the generator
generateAllIcons().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
