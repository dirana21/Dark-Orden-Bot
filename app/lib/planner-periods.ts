export interface PlannerPeriods {
  daily: string;
  weekly: string;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  const weekday = date.getDay() || 7;
  date.setDate(date.getDate() - weekday + 1);
  return toIsoDate(date);
}

export function getCurrentPlannerPeriods(): PlannerPeriods {
  const daily = toIsoDate(new Date());
  return { daily, weekly: getWeekStart(daily) };
}
