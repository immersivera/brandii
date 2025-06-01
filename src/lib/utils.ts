import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUniqueId() {
  return Math.random().toString(36).substring(2, 9);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function hexToRgb(hex: string) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number) {
  return '#' + 
    [r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

export function generateComplementaryColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  
  // Compute complementary color
  const rComp = 255 - r;
  const gComp = 255 - g;
  const bComp = 255 - b;
  
  return rgbToHex(rComp, gComp, bComp);
}

export function generateAnalogousColors(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  
  // Convert RGB to HSL
  let hsl = rgbToHsl(r, g, b);
  
  // Generate colors 30° and 60° on each side of the base color
  const colors = [];
  
  // -60°, -30°, base, +30°, +60°
  for (let angle = -60; angle <= 60; angle += 30) {
    if (angle === 0) continue; // Skip the base color
    
    let newHue = (hsl.h + angle) % 360;
    if (newHue < 0) newHue += 360;
    
    colors.push(hslToHex(newHue, hsl.s, hsl.l));
  }
  
  return colors;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h *= 60;
  }

  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return rgbToHex(
    Math.round(r * 255), 
    Math.round(g * 255), 
    Math.round(b * 255)
  );
}

export function getContrastColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  
  return luminance > 186 ? '#000000' : '#ffffff';
}