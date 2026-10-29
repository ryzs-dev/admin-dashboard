type DailyPoint = { label: string; value: number };

export type PacePoint = {
  day: number;
  daily: number | null;
  current: number | null;
  previous: number | null;
};

export type Pace = {
  points: PacePoint[];
  // Days of the selected month that have happened (the whole month once it is over).
  daysElapsed: number;
  current: number;
  // Last month's revenue over the same number of days, or its whole month.
  previous: number;
  change: number | null;
  // True when the month is still running, so `previous` covers matching days only.
  partial: boolean;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildPace(
  thisMonth: DailyPoint[],
  lastMonth: DailyPoint[],
  isCurrentMonth: boolean,
  today = new Date()
): Pace {
  const daysElapsed = isCurrentMonth
    ? Math.min(today.getDate(), thisMonth.length)
    : thisMonth.length;

  let runningThis = 0;
  let runningLast = 0;
  const points: PacePoint[] = thisMonth.map((point, i) => {
    const day = i + 1;
    const happened = day <= daysElapsed;
    if (happened) runningThis += Number(point.value) || 0;
    if (i < lastMonth.length) runningLast += Number(lastMonth[i].value) || 0;

    return {
      day,
      daily: happened ? Number(point.value) || 0 : null,
      current: happened ? round2(runningThis) : null,
      previous: i < lastMonth.length ? round2(runningLast) : null,
    };
  });

  const previous = round2(
    lastMonth
      .slice(0, isCurrentMonth ? daysElapsed : lastMonth.length)
      .reduce((sum, p) => sum + (Number(p.value) || 0), 0)
  );
  const current = round2(runningThis);

  return {
    points,
    daysElapsed,
    current,
    previous,
    change: previous > 0 ? ((current - previous) / previous) * 100 : null,
    partial: isCurrentMonth && daysElapsed < thisMonth.length,
  };
}

export function percentChange(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}
