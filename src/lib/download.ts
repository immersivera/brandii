import JSZip from 'jszip';
import { BrandKit } from './supabase';

export async function generateBrandKitZip(brandKit: BrandKit, options: { includeLogos: boolean; includeGallery: boolean } = { includeLogos: true, includeGallery: true }): Promise<Blob> {
  const zip = new JSZip();
  const { includeLogos, includeGallery } = options;

  // Add README.md
  zip.file('README.md', generateReadme(brandKit));

  // Add styles folder
  const stylesFolder = zip.folder('styles');
  if (stylesFolder) {
    stylesFolder.file('colors.css', generateColorCSS(brandKit));
    stylesFolder.file('typography.css', generateTypographyCSS(brandKit));
  }

  // Add brand guidelines
  zip.file('guidelines.md', generateGuidelines(brandKit));

  // Add logos if requested and available
  if (includeLogos) {
    const logosFolder = zip.folder('logos');
    if (logosFolder) {
      try {
        // Check if there's an uploaded logo
        const hasUploadedLogo = brandKit.logo.image && brandKit.logo.image.startsWith('http');
        
        // Get all logo assets (both selected and concepts)
        const logoAssets = (brandKit.generated_assets || []).filter(asset => asset.type === 'logo');
        const selectedLogoAsset = brandKit.logo_selected_asset_id 
          ? logoAssets.find(asset => asset.id === brandKit.logo_selected_asset_id)
          : null;

        // Add the main logo (prefer selected logo, then uploaded logo, then first available logo)
        if (selectedLogoAsset?.image_data) {
          // Add selected logo from generated assets
          const base64Data = selectedLogoAsset.image_data.split(',')[1];
          if (base64Data) {
            logosFolder.file('main-logo.png', base64Data, { base64: true });
          }
        } else if (hasUploadedLogo) {
          // Add uploaded logo
          const logoUrl = brandKit.logo.image as string;
          if (logoUrl.startsWith('data:')) {
            // Handle base64 encoded image
            const base64Data = logoUrl.split(',')[1];
            if (base64Data) {
              logosFolder.file('main-logo.png', base64Data, { base64: true });
            }
          } else {
            // Handle URL to image (fetch and add to zip)
            try {
              const response = await fetch(logoUrl);
              const blob = await response.blob();
              logosFolder.file('main-logo.png', blob);
            } catch (error) {
              console.warn('Could not fetch uploaded logo:', error);
            }
          }
        } else if (logoAssets.length > 0 && logoAssets[0].image_data) {
          // Fallback to first available logo
          const base64Data = logoAssets[0].image_data.split(',')[1];
          if (base64Data) {
            logosFolder.file('main-logo.png', base64Data, { base64: true });
          }
        }

        // Add other logo concepts (excluding the main/selected logo)
        logoAssets
          .filter(asset => asset !== selectedLogoAsset)
          .forEach((asset, index) => {
            try {
              const base64Data = asset.image_data?.split(',')[1];
              if (base64Data) {
                logosFolder.file(`concept-${index + 1}.png`, base64Data, { base64: true });
              }
            } catch (error) {
              console.warn(`Could not process logo concept ${index + 1}:`, error);
            }
          });

      } catch (error) {
        console.error('Error processing logos:', error);
      }
    }
  }

  // Add gallery images if requested and available
  if (includeGallery && brandKit.generated_assets?.length) {
    const galleryFolder = zip.folder('gallery');
    if (galleryFolder) {
      const galleryAssets = brandKit.generated_assets.filter(asset => asset.type === 'image');
      galleryAssets.forEach((asset, index) => {
        try {
          const base64Data = asset.image_data?.split(',')[1];
          if (base64Data) {
            galleryFolder.file(`image-${index + 1}.png`, base64Data, { base64: true });
          }
        } catch (error) {
          console.warn(`Could not process gallery image ${index + 1}:`, error);
        }
      });
    }
  }

  // Create the ZIP file
  return await zip.generateAsync({ type: 'blob' });
}

function generateReadme(brandKit: BrandKit): string {
  return `# ${brandKit.name} Brand Kit

${brandKit.description}

## Contents

This brand kit contains:

1. \`styles/colors.css\` - Color variables and utility classes
2. \`styles/typography.css\` - Typography styles and font settings
3. \`guidelines.md\` - Comprehensive brand guidelines
4. \`logo/\` - Logo files in various formats

## Quick Start

1. Include the CSS files in your project:
   \`\`\`html
   <link rel="stylesheet" href="styles/colors.css">
   <link rel="stylesheet" href="styles/typography.css">
   \`\`\`

2. Follow the guidelines in \`guidelines.md\` for consistent brand usage.

## Support

For questions or support, please refer to the documentation or contact your brand administrator.
`;
}

function generateColorCSS(brandKit: BrandKit): string {
  return `:root {
  --brand-primary: ${brandKit.colors.primary};
  --brand-secondary: ${brandKit.colors.secondary};
  --brand-accent: ${brandKit.colors.accent};
  --brand-background: ${brandKit.colors.background};
  --brand-text: ${brandKit.colors.text};
}

/* Color utility classes */
.bg-primary { background-color: var(--brand-primary); }
.bg-secondary { background-color: var(--brand-secondary); }
.bg-accent { background-color: var(--brand-accent); }
.bg-background { background-color: var(--brand-background); }

.text-primary { color: var(--brand-primary); }
.text-secondary { color: var(--brand-secondary); }
.text-accent { color: var(--brand-accent); }
.text-content { color: var(--brand-text); }

/* Hover states */
.hover\\:bg-primary:hover { background-color: var(--brand-primary); }
.hover\\:bg-secondary:hover { background-color: var(--brand-secondary); }
.hover\\:bg-accent:hover { background-color: var(--brand-accent); }

.hover\\:text-primary:hover { color: var(--brand-primary); }
.hover\\:text-secondary:hover { color: var(--brand-secondary); }
.hover\\:text-accent:hover { color: var(--brand-accent); }
`;
}

function generateTypographyCSS(brandKit: BrandKit): string {
  return `/* Font imports */
@import url('https://fonts.googleapis.com/css2?family=${brandKit.typography.headingFont}:wght@400;500;600;700&family=${brandKit.typography.bodyFont}:wght@400;500;600&display=swap');

:root {
  --font-heading: '${brandKit.typography.headingFont}', system-ui, sans-serif;
  --font-body: '${brandKit.typography.bodyFont}', system-ui, sans-serif;
}

/* Base typography */
body {
  font-family: var(--font-body);
  line-height: 1.5;
  color: var(--brand-text);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.2;
}

/* Typography scale */
h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.75rem; }
h4 { font-size: 1.5rem; }
h5 { font-size: 1.25rem; }
h6 { font-size: 1rem; }

/* Utility classes */
.font-heading { font-family: var(--font-heading); }
.font-body { font-family: var(--font-body); }
`;
}

function generateGuidelines(brandKit: BrandKit): string {
  return `# ${brandKit.name} Brand Guidelines

## Brand Overview

${brandKit.description}

## Color Palette

### Primary Color
- Hex: ${brandKit.colors.primary}
- Usage: Main brand color, primary buttons, key highlights

### Secondary Color
- Hex: ${brandKit.colors.secondary}
- Usage: Secondary elements, hover states, gradients

### Accent Color
- Hex: ${brandKit.colors.accent}
- Usage: Call-to-action elements, important highlights

### Background Color
- Hex: ${brandKit.colors.background}
- Usage: Page backgrounds, cards, containers

### Text Color
- Hex: ${brandKit.colors.text}
- Usage: Main text content, headings

## Typography

### Heading Font: ${brandKit.typography.headingFont}
- Used for: All headings (h1-h6)
- Weights: Regular (400), Medium (500), Semi-bold (600), Bold (700)

### Body Font: ${brandKit.typography.bodyFont}
- Used for: Body text, paragraphs, UI elements
- Weights: Regular (400), Medium (500), Semi-bold (600)

## Logo Usage

### Primary Logo
- Type: ${brandKit.logo.type}
- Clear space: Maintain padding of at least 1x logo height around the logo
- Minimum size: Ensure logo remains legible at all sizes

### Color Variations
- Full color: Use on light backgrounds
- White: Use on dark or colored backgrounds
- Black: Use when color printing is not available

## Brand Voice

- Clear and professional
- Consistent with brand personality
- Accessible to target audience

## Implementation

1. Always use the provided color variables
2. Maintain typography hierarchy
3. Follow spacing and layout guidelines
4. Use approved logo variations

## Contact

For questions about brand usage or to request additional assets, please contact the brand team.
`;
}