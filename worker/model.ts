export interface Cup { name: string; prize: string; startDate: string; endDate: string; minMinutes: number }
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function fail(status: number, message: string): never { throw new ApiError(status, message); }

export function text(value: unknown, field: string, min = 1, max = 100): string {
  if (typeof value !== 'string') fail(400, `${field} must be text.`);
  const result = value.trim();
  if (result.length < min || result.length > max || /[\u0000-\u001f\u007f]/.test(result)) fail(400, `${field} must contain ${min}–${max} characters.`);
  return result;
}
export function id(value: unknown): string {
  const result = text(value, 'ID', 36, 36);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(result)) fail(400, 'Invalid ID.');
  return result;
}
export function email(value: unknown): string {
  const result = text(value, 'Email', 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(400, 'Enter a valid email address.');
  return result;
}
export function domain(value: unknown): string {
  if (value === '' || value === undefined || value === null) return '';
  const result = text(value, 'Domain', 3, 253).toLowerCase().replace(/^@/, '');
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(result)) fail(400, 'Enter an email domain such as school.edu.');
  return result;
}
function date(value: unknown): string {
  const result = text(value, 'Date', 10, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(Date.parse(result)) || new Date(result).toISOString().slice(0, 10) !== result) fail(400, 'Use a valid YYYY-MM-DD date.');
  return result;
}
export function cup(value: unknown): Cup {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'Invalid cup configuration.');
  const c = { ...(value as Record<string, unknown>) };
  if (c.minMinutes === undefined) c.minMinutes = c.minimumMinutes;
  const startDate = date(c.startDate), endDate = date(c.endDate);
  if (startDate > endDate || Date.parse(endDate) - Date.parse(startDate) > 366 * 86400000) fail(400, 'Cup dates must be ordered and span at most one year.');
  if (typeof c.minMinutes !== 'number' || !Number.isInteger(c.minMinutes) || c.minMinutes < 1 || c.minMinutes > 600) fail(400, 'Minimum minutes must be between 1 and 600.');
  return { name: text(c.name, 'Cup name', 1, 80), prize: text(c.prize, 'Prize', 1, 180), startDate, endDate, minMinutes: c.minMinutes };
}
export function defaultCup(now: Date): Cup {
  return { name: 'Forest Cup', prize: 'Choose our next class activity', startDate: now.toISOString().slice(0, 10), endDate: new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10), minMinutes: 5 };
}
export function scoreLesson(input: Record<string, unknown>, startedAt: Date, now: Date) {
  const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
  if (elapsed < 1 || elapsed > 4 * 3600) fail(400, 'This lesson cannot be finished yet or has expired.');
  const counters = ['quietSeconds', 'measuredSeconds', 'bestStreak'] as const;
  for (const key of counters) if (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || (input[key] as number) < 0) fail(400, `${key} must be a finite positive number or zero.`);
  const quietSeconds = Math.floor(input.quietSeconds as number), measuredSeconds = Math.floor(input.measuredSeconds as number), bestStreak = Math.floor(input.bestStreak as number);
  if (measuredSeconds > Math.min(elapsed, 7200) || quietSeconds > measuredSeconds || bestStreak > quietSeconds) fail(400, 'Lesson counters exceed measured or server elapsed time.');
  return { quietSeconds, measuredSeconds, bestStreak, xp: Math.floor(quietSeconds / 5) + Math.floor(bestStreak / 30) * 2 };
}

export interface Reward { xp: number; label: string }
export function rewards(value: unknown): Reward[] {
  if (!Array.isArray(value) || value.length > 12) fail(400, 'Use at most twelve rewards.');
  const result = value.map(item => {
    if (!item || typeof item !== 'object' || !Number.isInteger(item.xp) || item.xp < 1 || item.xp > 1000000) fail(400, 'Reward XP must be an integer between 1 and 1000000.');
    return { xp: item.xp as number, label: text(item.label, 'Reward', 1, 120) };
  }).sort((a,b) => a.xp-b.xp);
  if (new Set(result.map(r => r.xp)).size !== result.length) fail(400, 'Reward thresholds must be unique.');
  return result;
}
