// Plum is the brand colour; amber pairs with it for first-time vs returning splits
// (same pairing as the repeat-customer card).
export const CHART_COLORS = {
  primary: '#662d91',
  secondary: '#d98b4a',
} as const;

export const chartGrid = {
  stroke: '#ece8ef',
  strokeDasharray: '0',
  vertical: false,
} as const;

export const chartAxis = {
  tick: { fontSize: 12, fill: '#6b7280' },
  axisLine: false,
  tickLine: false,
} as const;

export const chartTooltip = {
  contentStyle: {
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    fontSize: 12,
  },
  cursor: { fill: 'rgba(102,45,145,0.06)', stroke: 'rgba(102,45,145,0.2)' },
} as const;

export const chartLegend = {
  iconType: 'circle',
  iconSize: 8,
  wrapperStyle: { fontSize: 12 },
} as const;
