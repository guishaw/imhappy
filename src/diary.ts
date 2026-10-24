/**
 * 일기 날짜 규칙
 * 하루의 경계는 자정이 아니라 아침 안부 시각(08:30)이다.
 * 일기 날짜 = (지금 − 8시간 30분)의 날짜.  새벽 02:30 메시지는 전날 일기로 들어간다.
 */
export const DAY_START_MIN = 8 * 60 + 30;

const WD = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => (n < 10 ? '0' : '') + n;

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function diaryDate(now: Date = new Date(), dayStartMin = DAY_START_MIN): string {
  return ymd(new Date(now.getTime() - dayStartMin * 60_000));
}

export function addDays(day: string, n: number): string {
  const d = parseYmd(day);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export function labelKo(day: string, withWeekday = true): string {
  const d = parseYmd(day);
  return `${d.getMonth() + 1}월 ${d.getDate()}일` + (withWeekday ? ` ${WD[d.getDay()]}요일` : '');
}

export function hm(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 지금 이후 가장 가까운 아침 안부 시각 */
export function nextMorning(now: Date = new Date(), dayStartMin = DAY_START_MIN): Date {
  const t = new Date(now);
  t.setHours(Math.floor(dayStartMin / 60), dayStartMin % 60, 0, 0);
  if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1);
  return t;
}

/** 이 메시지가 보낸 날짜와 다른 일기에 들어가는지 (새벽 메시지 표시용) */
export function isCarried(ts: number, day: string): boolean {
  return ymd(new Date(ts)) !== day;
}

export const WEEKDAYS = WD;
