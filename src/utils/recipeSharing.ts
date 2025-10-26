/**
 * Recipe Sharing Utilities
 *
 * Provides utility functions for sharing recipes:
 * - Generate shareable links
 * - Copy to clipboard
 * - Web Share API integration
 * - Export recipes in multiple formats
 */

import type { Recipe } from '../types';

/**
 * Generate a shareable URL for a recipe
 * @param recipeId - ID of the recipe to share
 * @param baseUrl - Optional base URL (defaults to current origin)
 * @returns Shareable URL
 */
export function generateRecipeLink(recipeId: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/recipes/${recipeId}`;
}

/**
 * Copy text to clipboard using the Clipboard API
 * @param text - Text to copy
 * @returns Promise that resolves when text is copied
 * @throws Error if clipboard API is not available or copy fails
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    throw new Error('Failed to copy to clipboard');
  }
}

/**
 * Share method for Web Share API
 */
export type ShareMethod = 'link' | 'text' | 'native';

/**
 * Share data structure for Web Share API
 */
interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

/**
 * Check if Web Share API is available
 * @returns true if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Share a recipe using Web Share API or fallback methods
 * @param recipeId - ID of the recipe to share
 * @param method - Sharing method ('link', 'text', or 'native')
 * @param recipe - Optional recipe data for text sharing
 * @returns Promise that resolves when sharing is complete
 * @throws Error if sharing fails
 */
export async function shareRecipe(
  recipeId: string,
  method: ShareMethod = 'native',
  recipe?: Recipe
): Promise<void> {
  const recipeUrl = generateRecipeLink(recipeId);

  // Native Web Share API
  if (method === 'native' && isWebShareSupported()) {
    const shareData: ShareData = {
      title: recipe?.name || 'Check out this recipe!',
      text: recipe?.description || 'I found this great recipe',
      url: recipeUrl,
    };

    try {
      await navigator.share(shareData);
    } catch (err) {
      // User cancelled or sharing failed
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled, don't throw error
        return;
      }
      throw new Error('Failed to share recipe');
    }
  }
  // Copy link to clipboard
  else if (method === 'link') {
    await copyToClipboard(recipeUrl);
  }
  // Copy recipe text to clipboard
  else if (method === 'text' && recipe) {
    const recipeText = formatRecipeAsText(recipe);
    await copyToClipboard(recipeText);
  }
  else {
    throw new Error('Invalid sharing method or missing recipe data');
  }
}

/**
 * Export format for recipes
 */
export type ExportFormat = 'json' | 'text' | 'markdown';

/**
 * Format a recipe as plain text
 * @param recipe - Recipe to format
 * @returns Formatted text
 */
function formatRecipeAsText(recipe: Recipe): string {
  const lines: string[] = [];

  // Title and description
  lines.push(recipe.name);
  lines.push('='.repeat(recipe.name.length));
  lines.push('');

  if (recipe.description) {
    lines.push(recipe.description);
    lines.push('');
  }

  // Metadata
  if (recipe.prepTime || recipe.cookTime || recipe.servings) {
    lines.push('DETAILS:');
    if (recipe.prepTime) lines.push(`Prep Time: ${recipe.prepTime} minutes`);
    if (recipe.cookTime) lines.push(`Cook Time: ${recipe.cookTime} minutes`);
    lines.push(`Servings: ${recipe.servings}`);
    if (recipe.difficulty) lines.push(`Difficulty: ${recipe.difficulty}`);
    if (recipe.cuisineType) lines.push(`Cuisine: ${recipe.cuisineType}`);
    lines.push('');
  }

  // Ingredients
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    lines.push('INGREDIENTS:');
    recipe.ingredients.forEach((ingredient) => {
      const notes = ingredient.notes ? ` (${ingredient.notes})` : '';
      lines.push(`- ${ingredient.quantity} ${ingredient.unit} ${ingredient.name}${notes}`);
    });
    lines.push('');
  }

  // Instructions
  if (recipe.instructions) {
    lines.push('INSTRUCTIONS:');
    const steps = recipe.instructions.split('\n').filter(s => s.trim());
    steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step.trim()}`);
    });
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`Shared from: ${generateRecipeLink(recipe.id)}`);

  return lines.join('\n');
}

/**
 * Format a recipe as Markdown
 * @param recipe - Recipe to format
 * @returns Formatted Markdown
 */
function formatRecipeAsMarkdown(recipe: Recipe): string {
  const lines: string[] = [];

  // Title and description
  lines.push(`# ${recipe.name}`);
  lines.push('');

  if (recipe.description) {
    lines.push(`> ${recipe.description}`);
    lines.push('');
  }

  // Metadata
  if (recipe.prepTime || recipe.cookTime || recipe.servings) {
    lines.push('## Details');
    lines.push('');
    const details: string[] = [];
    if (recipe.prepTime) details.push(`**Prep Time:** ${recipe.prepTime} minutes`);
    if (recipe.cookTime) details.push(`**Cook Time:** ${recipe.cookTime} minutes`);
    details.push(`**Servings:** ${recipe.servings}`);
    if (recipe.difficulty) details.push(`**Difficulty:** ${recipe.difficulty}`);
    if (recipe.cuisineType) details.push(`**Cuisine:** ${recipe.cuisineType}`);
    lines.push(details.join(' | '));
    lines.push('');
  }

  // Ingredients
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    lines.push('## Ingredients');
    lines.push('');
    recipe.ingredients.forEach((ingredient) => {
      const notes = ingredient.notes ? ` *(${ingredient.notes})*` : '';
      lines.push(`- ${ingredient.quantity} ${ingredient.unit} ${ingredient.name}${notes}`);
    });
    lines.push('');
  }

  // Instructions
  if (recipe.instructions) {
    lines.push('## Instructions');
    lines.push('');
    const steps = recipe.instructions.split('\n').filter(s => s.trim());
    steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step.trim()}`);
    });
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`*Shared from: [${generateRecipeLink(recipe.id)}](${generateRecipeLink(recipe.id)})*`);

  return lines.join('\n');
}

/**
 * Export a recipe in the specified format
 * @param recipe - Recipe to export
 * @param format - Export format ('json', 'text', or 'markdown')
 * @returns Formatted recipe string
 */
export function exportRecipe(recipe: Recipe, format: ExportFormat = 'json'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(recipe, null, 2);
    case 'text':
      return formatRecipeAsText(recipe);
    case 'markdown':
      return formatRecipeAsMarkdown(recipe);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Download a recipe as a file
 * @param recipe - Recipe to download
 * @param format - Export format
 * @param filename - Optional custom filename (without extension)
 */
export function downloadRecipe(
  recipe: Recipe,
  format: ExportFormat = 'json',
  filename?: string
): void {
  const content = exportRecipe(recipe, format);
  const extension = format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt';
  const defaultFilename = `${recipe.name.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
  const finalFilename = filename ? `${filename}.${extension}` : defaultFilename;

  // Create blob and download
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a QR code URL for a recipe link
 * Uses a public QR code API
 * @param recipeId - ID of the recipe
 * @param size - QR code size in pixels (default: 200)
 * @returns QR code image URL
 */
export function generateRecipeQRCode(recipeId: string, size: number = 200): string {
  const recipeUrl = generateRecipeLink(recipeId);
  const encodedUrl = encodeURIComponent(recipeUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;
}

/**
 * Parse recipe data from text (basic import)
 * Attempts to extract recipe components from formatted text
 * @param text - Text containing recipe data
 * @returns Partial recipe data
 */
export function parseRecipeFromText(text: string): Partial<Recipe> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  const recipe: Partial<Recipe> = {
    ingredients: [],
    instructions: '',
  };

  let currentSection: 'title' | 'description' | 'ingredients' | 'instructions' | null = null;
  const instructionLines: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Detect sections
    if (lowerLine === 'ingredients:' || lowerLine === 'ingredients') {
      currentSection = 'ingredients';
      continue;
    } else if (lowerLine === 'instructions:' || lowerLine === 'instructions' || lowerLine === 'directions:') {
      currentSection = 'instructions';
      continue;
    }

    // Parse based on current section
    if (currentSection === null && !recipe.name) {
      recipe.name = line;
      currentSection = 'description';
    } else if (currentSection === 'description' && line && !lowerLine.includes('ingredients') && !lowerLine.includes('instructions')) {
      recipe.description = line;
    } else if (currentSection === 'ingredients' && line.startsWith('-')) {
      // Basic ingredient parsing (this is simplified)
      const ingredientText = line.substring(1).trim();
      const parts = ingredientText.split(/\s+/);

      if (parts.length >= 2) {
        const quantity = parseFloat(parts[0]) || 1;
        const unit = parts[1];
        const name = parts.slice(2).join(' ');

        recipe.ingredients?.push({
          id: `temp-${Date.now()}-${Math.random()}`,
          recipeId: '',
          name: name || ingredientText,
          quantity,
          unit: unit as any,
          orderIndex: recipe.ingredients?.length || 0,
          createdAt: Date.now(),
        });
      }
    } else if (currentSection === 'instructions' && line) {
      instructionLines.push(line.replace(/^\d+\.\s*/, ''));
    }
  }

  recipe.instructions = instructionLines.join('\n');

  return recipe;
}

/**
 * Format recipe URL for email sharing
 * @param recipeId - ID of the recipe
 * @param recipeName - Name of the recipe
 * @param message - Optional personal message
 * @returns mailto: URL with pre-filled content
 */
export function generateEmailShareLink(
  recipeId: string,
  recipeName: string,
  message?: string
): string {
  const recipeUrl = generateRecipeLink(recipeId);
  const subject = encodeURIComponent(`Check out this recipe: ${recipeName}`);
  const body = encodeURIComponent(
    `${message ? message + '\n\n' : ''}I wanted to share this recipe with you:\n\n${recipeName}\n${recipeUrl}`
  );

  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Generate social media share URLs
 */
export interface SocialShareUrls {
  facebook: string;
  twitter: string;
  pinterest: string;
  whatsapp: string;
  email: string;
}

/**
 * Generate social media share links for a recipe
 * @param recipeId - ID of the recipe
 * @param recipeName - Name of the recipe
 * @param description - Optional description
 * @param imageUrl - Optional image URL
 * @returns Object with social media share URLs
 */
export function generateSocialShareLinks(
  recipeId: string,
  recipeName: string,
  description?: string,
  imageUrl?: string
): SocialShareUrls {
  const recipeUrl = generateRecipeLink(recipeId);
  const encodedUrl = encodeURIComponent(recipeUrl);
  const encodedName = encodeURIComponent(recipeName);
  const encodedDescription = encodeURIComponent(description || `Check out this recipe: ${recipeName}`);

  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedName}`,
    pinterest: imageUrl
      ? `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(imageUrl)}&description=${encodedDescription}`
      : `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedDescription}`,
    whatsapp: `https://wa.me/?text=${encodedName}%20${encodedUrl}`,
    email: generateEmailShareLink(recipeId, recipeName, description),
  };
}

/**
 * Create a printable version of a recipe
 * Opens a new window with print-friendly recipe layout
 * @param recipe - Recipe to print
 */
export function printRecipe(recipe: Recipe): void {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.');
  }

  const content = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${recipe.name} - Recipe</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          line-height: 1.6;
          color: #333;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: #222;
        }
        .description {
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 1.5rem;
        }
        .metadata {
          display: flex;
          gap: 20px;
          margin-bottom: 2rem;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .metadata-item {
          font-size: 0.95rem;
        }
        .metadata-item strong {
          color: #222;
        }
        h2 {
          font-size: 1.5rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #222;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 0.5rem;
        }
        ul, ol {
          padding-left: 1.5rem;
        }
        li {
          margin-bottom: 0.5rem;
        }
        .instruction {
          margin-bottom: 1rem;
        }
        @media print {
          body {
            padding: 20px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <h1>${recipe.name}</h1>
      ${recipe.description ? `<p class="description">${recipe.description}</p>` : ''}

      <div class="metadata">
        ${recipe.prepTime ? `<div class="metadata-item"><strong>Prep:</strong> ${recipe.prepTime} min</div>` : ''}
        ${recipe.cookTime ? `<div class="metadata-item"><strong>Cook:</strong> ${recipe.cookTime} min</div>` : ''}
        <div class="metadata-item"><strong>Servings:</strong> ${recipe.servings}</div>
        ${recipe.difficulty ? `<div class="metadata-item"><strong>Difficulty:</strong> ${recipe.difficulty}</div>` : ''}
      </div>

      ${recipe.ingredients && recipe.ingredients.length > 0 ? `
        <h2>Ingredients</h2>
        <ul>
          ${recipe.ingredients.map(ing =>
            `<li>${ing.quantity} ${ing.unit} ${ing.name}${ing.notes ? ` (${ing.notes})` : ''}</li>`
          ).join('')}
        </ul>
      ` : ''}

      ${recipe.instructions ? `
        <h2>Instructions</h2>
        <ol>
          ${recipe.instructions.split('\n').filter(s => s.trim()).map(step =>
            `<li class="instruction">${step.trim()}</li>`
          ).join('')}
        </ol>
      ` : ''}

      <div class="no-print" style="margin-top: 3rem; text-align: center;">
        <button onclick="window.print()" style="padding: 12px 24px; font-size: 1rem; cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 4px;">
          Print Recipe
        </button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
}
