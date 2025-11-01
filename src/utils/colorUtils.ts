/**
 * Converts hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Converts RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Calculates relative luminance of a color (WCAG formula)
 * Returns value between 0 (darkest) and 1 (lightest)
 */
export function calculateLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(value => {
    value = value / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determines if text should be light or dark based on background color
 */
export function isLightBackground(hex: string): boolean {
  return calculateLuminance(hex) > 0.5;
}

/**
 * Gets appropriate text color (white or black) for given background
 */
export function getContrastingTextColor(hex: string): string {
  return isLightBackground(hex) ? '#000000' : '#FFFFFF';
}

/**
 * Generates a complementary color (opposite on color wheel)
 * Preserves the saturation and lightness of the original color
 */
export function generateComplementaryColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#FFFFFF';

  // Convert RGB to HSL
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;

    h /= 6;
  }

  // Shift hue by 180 degrees for complementary color
  h = (h + 0.5) % 1;

  // Convert back to RGB, preserving original saturation and lightness
  const hslToRgb = (h: number, s: number, l: number) => {
    let rOut, gOut, bOut;

    if (s === 0) {
      rOut = gOut = bOut = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      rOut = hueToRgb(p, q, h + 1 / 3);
      gOut = hueToRgb(p, q, h);
      bOut = hueToRgb(p, q, h - 1 / 3);
    }

    return [Math.round(rOut * 255), Math.round(gOut * 255), Math.round(bOut * 255)];
  };

  const [rOut, gOut, bOut] = hslToRgb(h, s, l);
  return rgbToHex(rOut, gOut, bOut);
}

/**
 * Helper function for HSL to RGB conversion
 */
function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

/**
 * Calculates WCAG contrast ratio between two colors
 * AA standard: 4.5:1, AAA standard: 7:1
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = calculateLuminance(hex1);
  const lum2 = calculateLuminance(hex2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Gets WCAG compliance level
 */
export function getContrastLevel(ratio: number): 'AAA' | 'AA' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}

/**
 * Validates if a hex color is valid
 * Accepts colors with or without # prefix
 */
export function isValidHex(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  // Match 6 hex digits, with optional # prefix
  return /^#?[0-9A-F]{6}$/i.test(hex.trim());
}

/**
 * Ensures a hex color has the # prefix
 */
export function normalizeHex(hex: string): string {
  if (!hex) return '';
  const trimmed = hex.trim();
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}
