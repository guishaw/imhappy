/**
 * AI 공급자 연결 (앱 테스트 빌드용)
 *
 * Claude / ChatGPT / Gemini 를 같은 함수로 부른다.
 * React Native 의 fetch 는 스트리밍 본문을 지원하지 않으므로, 답변 전체를 한 번에 받는다.
 *
 * ⚠️ 테스트 빌드에서는 사용자가 설정에 넣은 API 키로 휴대폰에서 바로 호출한다.
 *    출시 버전에서는 키를 서버에 두고 서버가 호출해야 한다 (README 참고).
 */

export type ProviderId = 'anthropic' | 'openai' | 'gemini';
export type Role = 'user' | 'assistant';
export interface ChatMessage { role: Role; content: string }

export interface GenerateInput {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

export const PROVIDERS: Record<ProviderId, { label: string; company: string; defaultModel: string; keyHint: string }> = {
  anthropic: { label: 'Claude',  company: 'Anthropic', defaultModel: 'claude-haiku-5-5',  keyHint: 'sk-ant-...' },
  openai:    { label: 'ChatGPT', company: 'OpenAI',    defaultModel: 'gpt-6-luna',        keyHint: 'sk-...' },
  gemini:    { label: 'Gemini',  company: 'Google',    defaultModel: 'gemini-3.6-flash',  keyHint: 'AIza...' },
};

export class AIError extends Error {
  constructor(public provider: ProviderId, public status: number, message: string) {
    super(`[${provider}] ${status} ${message}`);
  }
}

/** 공급자들이 공통으로 받아들이는 형태로 정리: user로 시작, 같은 역할이 연달아 오면 합친다 */
function normalize(messages: ChatMessage[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (!m.content.trim()) continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += '\n' + m.content;
    else out.push({ ...m });
  }
  if (out.length && out[0].role === 'assistant') out.unshift({ role: 'user', content: '(일기 앱을 열었다)' });
  return out;
}

async function post(provider: ProviderId, url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = '';
    try { msg = await res.text(); } catch { /* ignore */ }
    throw new AIError(provider, res.status, msg.slice(0, 300));
  }
  return res.json();
}

export async function generate(
  provider: ProviderId, apiKey: string, model: string, input: GenerateInput,
): Promise<string> {
  const messages = normalize(input.messages);
  // 생각(추론)하는 모델은 생각에도 토큰을 쓰므로 넉넉하게 준다
  const max = input.maxTokens ?? 1500;

  if (provider === 'anthropic') {
    const data = await post(provider, 'https://api.anthropic.com/v1/messages', {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // 휴대폰에서 직접 부를 때 필요한 헤더 (테스트 빌드 전용)
      'anthropic-dangerous-direct-browser-access': 'true',
    }, { model, max_tokens: max, system: input.system, messages });
    return (data.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text).join('').trim();
  }

  if (provider === 'openai') {
    const data = await post(provider, 'https://api.openai.com/v1/chat/completions', {
      authorization: `Bearer ${apiKey}`,
    }, {
      model,
      max_completion_tokens: max,
      messages: [{ role: 'system', content: input.system }, ...messages],
    });
    return String(data.choices?.[0]?.message?.content ?? '').trim();
  }

  const data = await post(
    provider,
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    { 'x-goog-api-key': apiKey },
    {
      systemInstruction: { parts: [{ text: input.system }] },
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: max },
    },
  );
  return ((data.candidates?.[0]?.content?.parts ?? []) as { text?: string; thought?: boolean }[])
    .filter((p) => !p.thought).map((p) => p.text ?? '').join('').trim();
}
