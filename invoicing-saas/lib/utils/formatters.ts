import { InvoiceStatus } from '../types/invoice';

/**
 * Formats a monetary amount in FCFA with spaces as thousand separators.
 * Example: 250000 -> "250 000 FCFA"
 */
export function formatFCFA(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 FCFA';
  }
  
  // Round to nearest integer for standard FCFA display
  const rounded = Math.round(amount);
  
  // Format with space as thousand separator
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return `${formatted} FCFA`;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into French format DD/MM/YYYY.
 * Example: "2026-07-29" -> "29/07/2026"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Returns human-readable label and styling classes for an Invoice status.
 */
export function getStatusConfig(status: InvoiceStatus) {
  switch (status) {
    case 'paid':
      return {
        label: 'Payée',
        bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-1 ring-emerald-500/20',
        dotClass: 'bg-emerald-500',
      };
    case 'sent':
      return {
        label: 'Envoyée',
        bgClass: 'bg-amber-50 text-amber-700 border-amber-200/60 ring-1 ring-amber-500/20',
        dotClass: 'bg-amber-500',
      };
    case 'draft':
      return {
        label: 'Brouillon',
        bgClass: 'bg-slate-100 text-slate-700 border-slate-200/60 ring-1 ring-slate-400/20',
        dotClass: 'bg-slate-400',
      };
    case 'overdue':
      return {
        label: 'En retard',
        bgClass: 'bg-rose-50 text-rose-700 border-rose-200/60 ring-1 ring-rose-500/20',
        dotClass: 'bg-rose-500 animate-pulse',
      };
    default:
      return {
        label: status,
        bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-400',
      };
  }
}
