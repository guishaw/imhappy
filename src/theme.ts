/** 접속할 때마다, 그리고 켜둔 채 일정 시간이 지나면 바뀌는 파스텔 컬러 */
export interface Hue { name: string; glow: string; ink: string; soft: string }

export const HUES: Hue[] = [
  { name: '옐로우', glow: '#FFE38A', ink: '#B9890C', soft: '#FFF6D6' },
  { name: '핑크',   glow: '#FFBCD4', ink: '#D35E8B', soft: '#FFE9F1' },
  { name: '블루',   glow: '#A9D8F5', ink: '#3A9AD2', soft: '#E3F3FC' },
  { name: '베이지', glow: '#EED9BC', ink: '#A07D52', soft: '#F8F0E5' },
  { name: '퍼플',   glow: '#CFBDF3', ink: '#8466CC', soft: '#F0EAFC' },
  { name: '와인',   glow: '#E6A9BC', ink: '#A0435F', soft: '#F8E6EB' },
  { name: '그린',   glow: '#BBE7C6', ink: '#3F9A60', soft: '#E7F7EB' },
  { name: '오렌지', glow: '#FFC89C', ink: '#D9762E', soft: '#FFEEDF' },
];

export function nextHue(current: number): number {
  let n = current;
  while (n === current) n = Math.floor(Math.random() * HUES.length);
  return n;
}

export const C = {
  white: '#FFFFFF',
  text: '#33404A',
  sub: '#7A8791',
  faint: '#A7B0B7',
  hair: '#E6E9EC',
};

/** 켜둔 채로 색이 바뀌는 간격 */
export const HUE_DRIFT_MS = 10 * 60 * 1000;
