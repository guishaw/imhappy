import { generate, type ChatMessage, type ProviderId } from './providers';
import type { Diary } from '../store';
import { labelKo, hm } from '../diary';

/** 1차 안전 필터: AI를 부르기 전에 걸러낸다 */
export const RISK = /(죽고\s*싶|사라지고\s*싶|없어지고\s*싶|자해|살기\s*싫|자살|끝내고\s*싶|눈\s*안\s*떴으면)/;
export const SAFETY_TOKEN = '[SAFETY]';

export interface AIConfig { provider: ProviderId; apiKey: string; model: string }

export function happyRules(day: string, yesterday?: Diary): string {
  let ysum = '없음 (오늘이 첫 일기)';
  if (yesterday?.safety) ysum = '어제는 힘든 날이었다. 구체적인 내용은 언급하지 않는다.';
  else if (yesterday?.summary?.length) ysum = yesterday.summary.join(' ');
  return [
    '너는 "I\'m HAPPY" 앱의 AI "해피"다. 사용자와 나누는 대화는 그날의 일기가 된다.',
    '앱 철학: 사용자를 판단하지 않고, 스스로를 이해하도록 돕는다. 해피와의 대화는 결국 나 자신과의 대화다.',
    '규칙:',
    '- 진단하지 않는다. 우울증, 불안장애 같은 병명을 붙이지 않는다. 의사나 상담사처럼 굴지 않는다. 약 복용 여부는 판단하지 않고 의사·약사에게 묻도록 안내한다.',
    '- 해요체로, 따뜻하고 차분하게, 2~3문장 이내로 짧게 답한다. 질문은 한 번에 하나만 한다.',
    '- 먼저 감정을 짧게 받아주고, 생각을 정리하도록 돕는 질문을 한다.',
    '- 사용자의 말에 무조건 동의하지 않는다. 감정은 인정하되 단정은 피한다.',
    '- 과한 공감 연출, 이모지, 상담사 말투("그 감정을 충분히 느껴보세요")를 쓰지 않는다.',
    '- 어제의 일기와 연결할 것이 있으면 한 번만 자연스럽게 연결한다. 없으면 억지로 만들지 않는다.',
    '- 사용자가 그만하고 싶어 하면 붙잡지 않고 짧게 마무리한다.',
    `- 자해, 자살, 사라지고 싶다는 마음 같은 위험 신호가 보이면 다른 말 없이 ${SAFETY_TOKEN} 한 단어만 출력한다. "죽겠다", "배고파 죽겠다" 같은 관용 표현은 위험 신호가 아니다.`,
    '- 마크다운 없이 평문으로만 답한다.',
    `상황: 지금은 ${labelKo(day)} 일기를 쓰는 중이고, 현재 시각은 ${hm(Date.now())}이다.`,
    `어제의 일기 요약: ${ysum}`,
  ].join('\n');
}

export function toChat(d: Diary): ChatMessage[] {
  return d.messages.slice(-30).map((m) => ({ role: m.role === 'me' ? 'user' : 'assistant', content: m.text }));
}

/** 실시간 대화. [SAFETY] 가 나오면 'SAFETY' 를 돌려준다 */
export async function happyReply(ai: AIConfig, today: Diary, yesterday?: Diary): Promise<string | 'SAFETY'> {
  const text = await generate(ai.provider, ai.apiKey, ai.model, {
    system: happyRules(today.date, yesterday),
    messages: toChat(today),
  });
  if (text.includes(SAFETY_TOKEN)) return 'SAFETY';
  return text;
}

export async function happyGreeting(ai: AIConfig, yesterday: Diary): Promise<string> {
  const transcript = yesterday.messages.map((m) => (m.role === 'me' ? '나: ' : '해피: ') + m.text).join('\n');
  const out = await generate(ai.provider, ai.apiKey, ai.model, {
    system: '너는 I\'m HAPPY 앱의 AI 해피다. 매일 아침 사용자에게 보낼 안부 물음을 만든다. ' +
      '어제 일기 대화를 읽고, 어제에 이어지는 다정한 물음을 해요체 한두 문장, 60자 이내로 쓴다. ' +
      '병명이나 진단, 이모지, 따옴표 없이 문장만 출력한다. 예: 어제 우울한 일이 있었잖아요. 오늘은 기분이 좀 어때요?',
    messages: [{ role: 'user', content: `${labelKo(yesterday.date)} 대화:\n${transcript}` }],
  });
  return out.replace(/^["“'']+|["”'']+$/g, '').trim();
}

export async function happySummary(ai: AIConfig, d: Diary): Promise<{ summary: string[]; mood: 'good' | 'mid' | 'low' } | null> {
  const transcript = d.messages.map((m) => (m.role === 'me' ? '나: ' : '해피: ') + m.text).join('\n');
  const raw = await generate(ai.provider, ai.apiKey, ai.model, {
    system: '다음은 사용자가 AI 해피와 나눈 하루 대화다. 이 대화를 사용자의 1인칭 일기 문장 2~4줄로 요약하고, ' +
      '그날의 전반적인 기분을 good, mid, low 중 하나로 고른다. 병명이나 진단은 쓰지 않는다. ' +
      'JSON만 출력: {"summary":["...","..."],"mood":"mid"}',
    messages: [{ role: 'user', content: transcript }],
  });
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  try {
    const v = JSON.parse(body);
    if (!Array.isArray(v.summary) || !v.summary.length) return null;
    const mood = ['good', 'mid', 'low'].includes(v.mood) ? v.mood : 'mid';
    return { summary: v.summary.map(String).slice(0, 4), mood };
  } catch {
    return null;
  }
}

/* ---------- AI 없이도 동작하는 기본값 ---------- */

export const FIRST_GREETING = '반가워요 해피';

export function ruleGreeting(yesterday?: Diary): string {
  if (!yesterday) return '좋은 아침이에요. 오늘 하루는 어떻게 시작하고 있어요?';
  if (yesterday.safety) return '어제 많이 힘들었죠. 오늘 아침은 좀 어때요?';
  const mine = yesterday.messages.filter((m) => m.role === 'me').map((m) => m.text).join(' ');
  if (!mine) return '어제는 인사만 나눴죠. 오늘 아침은 어때요?';
  if (/우울|슬프|울적|가라앉/.test(mine)) return '어제 우울한 일이 있었잖아요. 오늘은 기분이 좀 어때요?';
  if (/화나|짜증|열받|억울|속상/.test(mine)) return '어제 속상한 일이 있었잖아요. 오늘은 마음이 좀 풀렸어요?';
  if (/피곤|지쳐|힘들|졸려/.test(mine)) return '어제 많이 지쳐 보였어요. 잠은 좀 잤어요?';
  if (/좋았|행복|기뻐|신나|칭찬/.test(mine)) return '어제 좋은 일이 있었죠. 오늘도 그 기분이 남아 있어요?';
  return '어제 이야기해준 일, 오늘은 좀 어때요?';
}

export function ruleSummary(d: Diary): string[] {
  const mine = d.messages.filter((m) => m.role === 'me');
  if (d.safety) return ['많이 힘든 하루였다.'];
  if (!mine.length) return ['해피의 안부만 받고 조용히 지나간 날'];
  const last = mine[mine.length - 1].text;
  return [`해피와 ${mine.length}번 이야기를 나눴다.`, `마지막으로 남긴 말: "${last.length > 30 ? last.slice(0, 30) + '…' : last}"`];
}

const DEMO = [
  '그랬구나, 이야기해줘서 고마워요. 그 일을 떠올리면 지금 어떤 마음이 제일 커요?',
  '그 마음 그대로 오늘 일기에 남겨둘게요. 어젯밤 잠은 좀 잤어요?',
  '몸이 지치면 마음도 같이 무거워지기 쉬워요. 오늘 나를 위해 해줄 수 있는 작은 일이 하나 있다면 뭘까요?',
  '좋아요. 오늘은 여기까지만 해도 충분해요. 언제든 다시 와서 이어 써도 돼요.',
];
export const demoReply = (n: number) => DEMO[n % DEMO.length];
