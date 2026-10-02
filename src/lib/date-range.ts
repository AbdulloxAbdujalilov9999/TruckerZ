export type DateRange = { from: Date; to: Date } | null;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day + 6) % 7; // Monday as start of week
  x.setDate(x.getDate() - diff);
  return x;
}

export function resolveDateRange(params: {
  range?: string;
  from?: string;
  to?: string;
}): DateRange {
  const now = new Date();

  if (params.from || params.to) {
    return {
      from: params.from ? startOfDay(new Date(params.from)) : new Date(0),
      to: params.to ? endOfDay(new Date(params.to)) : endOfDay(now),
    };
  }

  switch (params.range) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week":
      return { from: startOfWeek(now), to: endOfDay(now) };
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
    case "q1":
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(new Date(now.getFullYear(), 2, 31)) };
    case "q2":
      return { from: new Date(now.getFullYear(), 3, 1), to: endOfDay(new Date(now.getFullYear(), 5, 30)) };
    case "q3":
      return { from: new Date(now.getFullYear(), 6, 1), to: endOfDay(new Date(now.getFullYear(), 8, 30)) };
    case "q4":
      return { from: new Date(now.getFullYear(), 9, 1), to: endOfDay(new Date(now.getFullYear(), 11, 31)) };
    default:
      return null; // no filter — all time
  }
}
