import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PROVIDERS, type ProviderId } from '../ai/providers';
import { getApiKey, type Profile } from '../store';
import { PinPad } from '../components/PinPad';
import { C, type Hue } from '../theme';

export function BackBar({ title, hue, onBack, right }: { title: string; hue: Hue; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={s.bar}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="뒤로">
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={hue.ink} strokeWidth={2}><Path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></Svg>
      </Pressable>
      <Text style={s.title}>{title}</Text>
      <View style={{ minWidth: 24, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

const IDLE = [{ sec: 60, label: '1분' }, { sec: 300, label: '5분' }, { sec: 600, label: '10분' }];
const TIMES = ['06:00', '07:00', '10:00', '14:00', '20:00'];

export function Settings({ hue, profile, onBack, onProfile, onKey, onPin, onWipe }: {
  hue: Hue; profile: Profile; onBack: () => void;
  onProfile: (p: Profile) => void;
  onKey: (p: ProviderId, key: string) => Promise<void>;
  onPin: (pin: string) => Promise<void>;
  onWipe: () => void;
}) {
  const [keys, setKeys] = useState<Record<ProviderId, string>>({ anthropic: '', openai: '', gemini: '' });
  const [saved, setSaved] = useState('');
  const [pinMode, setPinMode] = useState(false);
  const [wipeAsk, setWipeAsk] = useState(false);
  const [timePick, setTimePick] = useState('07:00');

  useEffect(() => {
    (async () => {
      const k = { anthropic: '', openai: '', gemini: '' } as Record<ProviderId, string>;
      for (const p of Object.keys(PROVIDERS) as ProviderId[]) k[p] = await getApiKey(p);
      setKeys(k);
    })();
  }, []);

  const chip = (label: string, on: boolean, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} style={[s.chip, on && { backgroundColor: hue.ink, borderColor: hue.ink }]}>
      <Text style={[s.chipT, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
  const ai = profile.ai;

  if (pinMode) {
    return (
      <View style={{ flex: 1 }}>
        <BackBar title="잠금 PIN 바꾸기" hue={hue} onBack={() => setPinMode(false)} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <Text style={{ fontSize: 16, color: C.text }}>새 PIN 4자리를 입력해주세요</Text>
          <PinPad hue={hue} onDone={async (p) => { await onPin(p); setPinMode(false); setSaved('PIN을 바꿨어요'); return true; }} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BackBar title="설정" hue={hue} onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Row k="아침 안부" v="매일 08:30" />
        <Row k="일기 마감" v="다음 날 08:30" />

        <View style={s.grp}>
          <Text style={s.k}>대화 AI</Text>
          <Text style={s.d}>해피의 답변을 만드는 AI예요. 바꾸면 다음 메시지부터 적용되고, 지난 일기는 그대로 이어져요. 대화 내용은 선택한 회사로 전송돼요.</Text>
          <View style={s.chips}>{(Object.keys(PROVIDERS) as ProviderId[]).map((p) => chip(PROVIDERS[p].label, ai === p, () => onProfile({ ...profile, ai: p })))}</View>
          <Text style={s.label}>{PROVIDERS[ai].label} API 키 (테스트 빌드 전용, 이 휴대폰에만 저장)</Text>
          <TextInput value={keys[ai]} onChangeText={(v) => setKeys({ ...keys, [ai]: v })} placeholder={PROVIDERS[ai].keyHint}
            secureTextEntry autoCapitalize="none" autoCorrect={false} style={[s.input, { borderColor: hue.glow }]} />
          <Text style={s.label}>모델 이름</Text>
          <TextInput value={profile.models[ai]} onChangeText={(v) => onProfile({ ...profile, models: { ...profile.models, [ai]: v.trim() } })}
            autoCapitalize="none" autoCorrect={false} style={[s.input, { borderColor: hue.glow }]} />
          <Pressable onPress={async () => { await onKey(ai, keys[ai]); setSaved(keys[ai] ? `${PROVIDERS[ai].label} 키를 저장했어요` : '키를 지웠어요. 시연 모드로 답해요'); }}
            style={[s.go, { backgroundColor: hue.ink }]}><Text style={s.goT}>키 저장</Text></Pressable>
          {!!saved && <Text style={[s.d, { color: hue.ink }]}>{saved}</Text>}
        </View>

        <View style={s.grp}>
          <Text style={s.k}>자리비움 잠금</Text>
          <Text style={s.d}>앱을 켜둔 채 휴대폰을 쓰지 않으면, 다른 사람이 일기를 보지 못하게 잠가요.</Text>
          <View style={s.chips}>{IDLE.map((o) => chip(o.label, profile.idleSec === o.sec, () => onProfile({ ...profile, idleSec: o.sec })))}</View>
          <Pressable onPress={() => setPinMode(true)}><Text style={[s.link, { color: hue.ink }]}>잠금 PIN 바꾸기</Text></Pressable>
        </View>

        <View style={s.grp}>
          <Text style={s.k}>아침 안부 시간 변경 · 준비 중</Text>
          {profile.timeRequest
            ? <Text style={[s.d, { color: hue.ink }]}>요청을 받았어요 ({profile.timeRequest}). 기능이 열리면 가장 먼저 알려드릴게요.</Text>
            : <>
                <Text style={s.d}>지금은 모두 08:30에 안부를 받아요. 다른 시간이 필요하면 알려주세요.</Text>
                <View style={s.chips}>{TIMES.map((t) => chip(t, timePick === t, () => setTimePick(t)))}</View>
                <Pressable onPress={() => onProfile({ ...profile, timeRequest: timePick })} style={[s.go, { backgroundColor: hue.ink }]}><Text style={s.goT}>필요해요</Text></Pressable>
              </>}
        </View>

        <View style={s.grp}>
          <Text style={s.k}>모든 기록 지우기</Text>
          <Text style={s.d}>일기, 설정, API 키를 이 휴대폰에서 모두 지워요. 되돌릴 수 없어요.</Text>
          {!wipeAsk
            ? <Pressable onPress={() => setWipeAsk(true)}><Text style={[s.link, { color: '#C8574A' }]}>모두 지우기</Text></Pressable>
            : <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={onWipe} style={[s.go, { backgroundColor: '#C8574A' }]}><Text style={s.goT}>정말 지우기</Text></Pressable>
                <Pressable onPress={() => setWipeAsk(false)} style={[s.go, { backgroundColor: C.hair }]}><Text style={[s.goT, { color: C.text }]}>취소</Text></Pressable>
              </View>}
        </View>

        <Text style={[s.d, { marginTop: 18, textAlign: 'center' }]}>I'm HAPPY 테스트 빌드 0.1.0</Text>
      </ScrollView>
    </View>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <View style={s.row}><Text style={s.k}>{k}</Text><Text style={s.v}>{v}</Text></View>;
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.hair },
  grp: { paddingVertical: 16, gap: 9, borderBottomWidth: 1, borderBottomColor: C.hair },
  k: { fontSize: 15, fontWeight: '600', color: C.text },
  v: { fontSize: 15, color: C.sub },
  d: { fontSize: 13, color: C.sub, lineHeight: 20 },
  label: { fontSize: 12, color: C.sub, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1, borderColor: C.hair, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: '#fff' },
  chipT: { fontSize: 13, fontWeight: '600', color: C.sub },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text },
  go: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  goT: { color: '#fff', fontWeight: '700', fontSize: 14 },
  link: { fontSize: 14, fontWeight: '700' },
});
