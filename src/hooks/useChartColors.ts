/**
 * Returns resolved chart colours that work in both light and dark mode.
 * Recharts SVG elements ignore Tailwind className — we must pass explicit colour strings.
 */
export function useChartColors() {
  // Read the CSS variable set on <html> by index.css
  const grid = typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() || '#E2E8F0'
    : '#E2E8F0'

  return { grid }
}
