export function averageCalculator(totalPurchases: number, amountSpent: number) {
  const average = totalPurchases === 0 ? 0 : amountSpent / totalPurchases;
  return average;
}
