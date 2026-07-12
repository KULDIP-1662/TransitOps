const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat('en-IN');

export function formatINR(value: number | null | undefined): string {
  if (value == null) return '—';
  return inr.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return num.format(value);
}

export function formatKg(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${num.format(value)} kg`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
