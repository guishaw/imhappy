import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Wordmark } from '../components/Wordmark';
import { PinPad } from '../components/PinPad';
import { PROVIDERS, type ProviderId } from '../ai/providers';
import { C, type Hue } from '../theme';

export interface SignupResult { ai: ProviderId; apiKey: string; pin: string; notify: boolean }

/** 가입: 대화 AI 선택 → API 키(테스트 빌드) → 잠금 PIN → 알림 동의 */
export function Signup({ hue, onDone, askNotify }: {
  hue: Hue;
  onDone: (r: SignupResult) => void;
  askNotify: () => Promise<boolean>;
}) {
  const [step, setStep] = useState(0);
  const [ai, setAi] = useState<ProviderId>('anthropic');
  const [key, setKey] = useState('');
  const [pin, setPin] = useState('');
  const [pinStage, setPinStage] = useState<'first' | 'confirm'>('first');

  const btn = (label: string, onPress: () => void, ghost = false) => (
    <Pressable onPress={onPress} style={[s.btn, ghost ? { backgroundColor: 'transparent' } : { backgroundColor: hue.ink }]}>
      <Text style={[s.btnText, ghost && { color: C.sub }]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Wordmark hue={hue} size={34} width={260} height={96} />
      <Text style={[s.step, { color: hue.ink }]}>가입 · {step + 1} / 4</Text>

      {step === 0 && (
        <>
          <Text style={s.h}>해피와 대화할 AI를 골라주세요</Text>
          <Text style={s.d}>해피의 답변을 어떤 AI가 만들지 정해요. 언제든 설정에서 바꿀 수 있어요.</Text>
          <View style={{ gap: 10, alignSelf: 'stretch' }}>
            {(Object.keys(PROVIDERS) as ProviderId[]).map((p) => (
              <Pressable key={p} onPress={() => setAi(p)}
                style={[s.card, ai === p && { borderColor: hue.ink, backgroundColor: hue.soft }]}>
                <Text style={[s.cardT, ai === p && { color: hue.ink }]}>{PROVIDERS[p].label}</Text>
                <Text style={s.cardS}>{PROVIDERS[p].company}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={s.small}>대화 내용은 답변을 만들기 위해 {PROVIDERS[ai].company}로 전송돼요.</Text>
          {btn('다음', () => setStep(1))}
        </>
      )}

      {step === 1 && (
        <>
          <Text style={s.h}>{PROVIDERS[ai].label} API 키</Text>
          <Text style={s.d}>테스트 빌드에서는 직접 발급한 API 키로 해피가 답해요. 키는 이 휴대폰의 보안 저장소에만 보관돼요. 비워두면 미리 정해둔 시연 문장으로 답해요.</Text>
          <TextInput value={key} onChangeText={setKey} placeholder={PROVIDERS[ai].keyHint}
            autoCapitalize="none" autoCorrect={false} secureTextEntry
            style={[s.input, { borderColor: hue.glow }]} />
          {btn(key.trim() ? '다음' : '키 없이 시연 모드로', () => setStep(2))}
          {btn('이전', () => setStep(0), true)}
        </>
      )}

      {step === 2 && (
        <>
          <Text style={s.h}>{pinStage === 'first' ? '잠금 PIN 4자리를 정해주세요' : '한 번 더 입력해주세요'}</Text>
          <Text style={s.d}>앱을 켜둔 채 자리를 비우면 일기를 잠가요. 다시 열 때 이 PIN을 써요.</Text>
          <PinPad key={pinStage} hue={hue} onDone={(p) => {
            if (pinStage === 'first') { setPin(p); setPinStage('confirm'); return true; }
            if (p !== pin) { setPinStage('first'); return false; }
            setStep(3); return true;
          }} />
        </>
      )}

      {step === 3 && (
        <>
          <Text style={s.h}>매일 아침 08:30, 해피가 안부를 물어요</Text>
          <Text style={s.d}>안부에 답하면 그날의 일기가 시작돼요. 알림을 허용해 주세요.</Text>
          {btn('알림 허용하고 시작하기', async () => {
            const ok = await askNotify();
            onDone({ ai, apiKey: key.trim(), pin, notify: ok });
          })}
          {btn('알림 없이 시작하기', () => onDone({ ai, apiKey: key.trim(), pin, notify: false }), true)}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 40, paddingBottom: 30, gap: 14, backgroundColor: C.white },
  step: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  h: { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center' },
  d: { fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 21, marginBottom: 6 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, borderRadius: 18, borderWidth: 1.5, borderColor: C.hair, backgroundColor: C.white },
  cardT: { fontSize: 17, fontWeight: '700', color: C.text },
  cardS: { fontSize: 13, color: C.sub },
  small: { fontSize: 12, color: C.sub, textAlign: 'center' },
  input: { alignSelf: 'stretch', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.text },
  btn: { alignSelf: 'stretch', borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
