const MYR = new Intl.NumberFormat('en-MY', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '-';

  return `RM ${MYR.format(amount)}`;
};

// Axis ticks: RM 12k, RM 1.5k, RM 800
export const formatCurrencyShort = (amount: number) => {
  if (Math.abs(amount) >= 1000) {
    const k = amount / 1000;
    return `RM ${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `RM ${amount}`;
};
