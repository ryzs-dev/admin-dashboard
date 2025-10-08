export const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number') return '-';

  return `RM ${amount.toFixed(2)}`;
};
