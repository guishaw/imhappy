import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Wordmark } from '../components/Wordmark';
import type { Diary, Msg } from '../store';
import { hm, isCarried, labelKo } from '../diary';
import { C, type Hue } from '../theme';

/** 메인: 대화 전에는 로고 + 해피의 물음 + 입력창, 대화가 시작되면 그날의 일기 대화 */
export function Home({ hue, diary, busy, demo, onSend, onCalendar, onSettings }: {
  hue: Hue; diary: Diary; busy: boolean; demo: boolean;
  onSend: (text: string) => void; onCalendar: () => void; onSettings: () => void;
}) {
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Msg>>(null);
  const chatting = diary.messages.some((m) => m.role === 'me');
  const question = diary.messages[0]?.text ?? '';

  useEffect(() => { setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60); }, [diary.messages.length, busy]);

  const send = () => { const t = text.trim(); if (!t || busy) return; setText(''); onSend(t); };

  const input = (
    <View style={[s.pill, { borderColor: hue.glow, shadowColor: hue.glow }]}>
      <TextInput value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send"
        placeholder={chatting ? '이어서 이야기하기' : '해피에게 답하기'} placeholderTextColor={C.faint}
        style={s.input} selectionColor={hue.ink} multiline={false} />
      <Pressable onPress={send} disabled={busy || !text.trim()} style={[s.send, { backgroundColor: busy || !text.trim() ? hue.glow : hue.ink }]}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>↑</Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.top}>
        <Pressable onPress={onCalendar} hitSlop={12} accessibilityLabel="일기 캘린더">
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={hue.ink} strokeWidth={1.8}>
            <Rect x={3.5} y={5} width={17} height={15.5} rx={3} /><Path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
          </Svg>
        </Pressable>
        {demo && <Text style={[s.demo, { color: hue.ink, backgroundColor: hue.soft }]}>시연 모드</Text>}
        <Pressable onPress={onSettings} hitSlop={12} accessibilityLabel="설정">
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={hue.ink} strokeWidth={1.8}>
            <Circle cx={12} cy={8} r={3.6} /><Path d="M5 20c1.3-3.6 4-5.4 7-5.4s5.7 1.8 7 5.4" strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>

      {!chatting ? (
        <View style={s.hero}>
          <Wordmark hue={hue} />
          <Text style={[s.q, { color: hue.ink }]}>{question}</Text>
          {input}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: 'center' }}>
            <Wordmark hue={hue} size={26} width={190} height={60} />
            <Text style={s.date}><Text style={{ color: hue.ink, fontWeight: '700' }}>{labelKo(diary.date)}</Text>의 일기</Text>
          </View>
          <FlatList
            ref={listRef}
            data={diary.messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 12, gap: 10 }}
            renderItem={({ item }) => <Bubble m={item} hue={hue} day={diary.date} />}
            ListFooterComponent={busy ? <Text style={s.typing}>해피가 생각하는 중…</Text> : null}
          />
          <View style={{ paddingHorizontal: 18, paddingBottom: 14, paddingTop: 6 }}>{input}</View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function Bubble({ m, hue, day }: { m: Msg; hue: Hue; day: string }) {
  const carried = isCarried(m.at, day) && !m.greet;
  if (m.role === 'me') {
    return (
      <View style={{ alignSelf: 'flex-end', maxWidth: '86%', alignItems: 'flex-end' }}>
        <View style={[s.me, { backgroundColor: hue.soft }]}><Text style={s.meText}>{m.text}</Text></View>
        <Text style={s.meta}>{hm(m.at)}{carried ? ` · 자정 이후 → ${labelKo(day, false)} 일기` : ''}</Text>
      </View>
    );
  }
  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
      <Text style={[s.who, { color: hue.ink }]}>HAPPY</Text>
      <Text style={[s.happy, m.greet && { color: hue.ink, fontWeight: '700' }]}>{m.text}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  demo: { fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26, paddingHorizontal: 26, paddingBottom: 60 },
  q: { fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 27, maxWidth: 300 },
  pill: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 999, borderWidth: 1, paddingLeft: 18, paddingRight: 6, paddingVertical: 5, elevation: 4, shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 8 },
  send: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  date: { fontSize: 12, color: C.sub, marginTop: -4 },
  me: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomRightRadius: 5 },
  meText: { fontSize: 15, color: C.text, lineHeight: 22 },
  meta: { fontSize: 10, color: C.faint, marginTop: 3 },
  who: { fontFamily: 'Montserrat_700Bold', fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  happy: { fontSize: 15, color: C.text, lineHeight: 23 },
  typing: { fontSize: 13, color: C.faint, marginTop: 4 },
});
