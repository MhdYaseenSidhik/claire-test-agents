import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function fmtInr(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—'
  const abs = Math.abs(v); const sign = v < 0 ? '-' : ''
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`
  return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}
export function fmtNum(v: number | null | undefined, decimals = 0): string {
  if (v == null || isNaN(v)) return '—'
  return v.toLocaleString('en-IN', { maximumFractionDigits: decimals })
}
export function fmtPct(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—'
  // Values are stored as percentages (e.g. 88.7, not 0.887) — do not multiply by 100
  return `${v.toFixed(1)}%`
}
export function fmtMonth(m: string): string {
  if (!m) return ''
  const [y, mo] = m.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(mo) - 1]} ${y}`
}
export function priorityColor(p: string): string {
  if (p === 'HIGH' || p === 'CRITICAL') return 'badge-high'
  if (p === 'MEDIUM') return 'badge-medium'
  return 'badge-low'
}
/** Clean up auto-generated KPI labels from snake_case → Title Case conversion */
export function fmtKpiLabel(label: string): string {
  return label
    .replace(/\binr\b/gi, '(INR)')
    .replace(/\bpct\b/gi, '(%)')
    .replace(/\bpo\b/gi, 'PO')
    .replace(/\bpr\b/gi, 'PR')
    .replace(/\bsku\b/gi, 'SKU')
    // clean up double parentheses or trailing "metric." from definitions
    .replace(/\bmetric\.\s*$/i, '')
    .trim()
}
