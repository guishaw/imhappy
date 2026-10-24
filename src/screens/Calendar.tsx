import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Diary } from '../store';
import { WEEKDAYS, labelKo, ymd } from '../diary';
import { C, type Hue } from '../theme';
import { BackBar } from './Settings';

const MOOD: Record<string, string> = { good: '괜찮은 날', mid: '보통인 날', low: '힘든 날' };

export function Calendar({ hue, diaries, today, onBack }: { hue: Hue; diaries: Record<string, Diary>; today: string; onBack: () => void }) {
  const t = new Date(today + 'T00:00:00');
  const [month, setMonth] = useState(new Date(t.getFullYear(), t.getMonth(), 1));
  const [sel, setSel] = useState(today);
  const [showT, setShowT] = useState(false);

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= days; d++) cells.push(ymd(new Date(month.getFullYear(), month.getMonth(), d)));
  while (cells.length % 7) cells.push(null);

  const e = diaries[sel];
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <View style={{ flex: 1 }}>
      <BackBar title={`${month.getFullYear()}년 ${month.getMonth() + 1}월`} hue={hue} onBack={onBack}
        right={<View style={{ flexDirection: 'row', gap: 18 }}>
          <Pressable onPress={() => shift(-1)} hitSlop={10}><Text style={{ color: hue.ink, fontSize: 18 }}>‹</Text></Pressable>
          <Pressable onPress={() => shift(1)} hitSlop={10}><Text style={{ color: hue.ink, fontSize: 18 }}>›</Text></Pressable>
        </View>} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={s.grid}>
          {WEEKDAYS.map((w) => <Text key={w} style={s.wd}>{w}</Text>)}
          {cells.map((c, i) => {
            if (!c) return <View key={i} style={s.cell} />;
            const d = diaries[c];
            const isSel = c === sel;
            return (
              <Pressable key={i} disabled={!d} onPress={() => { setSel(c); setShowT(false); }}
                style={[s.cell, isSel && { backgroundColor: hue.soft }]}>
                <Text style={[s.num, !d && { color: C.faint }, isSel && { fontWeight: '700' }]}>{Number(c.slice(8))}</Text>
                <View style={[s.dot,
                  !d ? null
                    : d.status === 'open' ? { backgroundColor: hue.glow }
                    : d.messages.some((m) => m.role === 'me') ? { backgroundColor: hue.ink }
                    : { borderWidth: 1.5, borderColor: hue.glow, borderStyle: 'dashed' }]} />
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
          <Legend color={hue.ink} label="대화한 날" /><Legend color={hue.glow} label="작성 중" /><Legend ring={hue.glow} label="안부만 받은 날" />
        </View>

        {!e ? <Text style={{ color: C.sub, textAlign: 'center', paddingVertical: 20 }}>아직 일기가 없는 날이에요.</Text> : (
          <View style={[s.entry, { backgroundColor: hue.soft, borderColor: hue.glow }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>{labelKo(e.date)}의 일기</Text>
              <Text style={[s.badge, { color: hue.ink }]}>{e.status === 'open' ? '작성 중' : '마감 · 읽기 전용'}</Text>
            </View>
            {e.status === 'open'
              ? <Text style={{ color: C.sub, fontSize: 14 }}>다음 날 08:30에 마감되면 해피가 이날을 일기로 정리해요.</Text>
              : <View style={{ gap: 4 }}>
                  {e.mood && <Text style={{ fontSize: 12, color: hue.ink, fontWeight: '700' }}>{MOOD[e.mood]}</Text>}
                  {(e.summary ?? []).map((line, i) => <Text key={i} style={{ fontSize: 15, color: C.text, lineHeight: 24 }}>· {line}</Text>)}
                </View>}
            <Pressable onPress={() => setShowT(!showT)} style={[s.tbtn, { borderColor: hue.glow }]}>
              <Text style={{ color: hue.ink, fontWeight: '700', fontSize: 13 }}>{showT ? '대화 원문 접기' : `대화 원문 보기 (${e.messages.length})`}</Text>
            </Pressable>
            {showT && e.messages.map((m) => (
              <Text key={m.id} style={{ fontSize: 14, lineHeight: 21, color: m.role === 'me' ? C.text : hue.ink }}>
                {m.role === 'me' ? '나' : '해피'} · {m.text}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Legend({ color, ring, label }: { color?: string; ring?: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[s.dot, color ? { backgroundColor: color } : { borderWidth: 1.5, borderColor: ring, borderStyle: 'dashed' }]} />
      <Text style={{ fontSize: 12, color: C.sub }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  wd: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, color: C.faint, fontWeight: '700', paddingBottom: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, gap: 3 },
  num: { fontSize: 14, color: C.text },
  dot: { width: 7, height: 7, borderRadius: 4 },
  entry: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  badge: { fontSize: 11, fontWeight: '700', backgroundColor: '#fff', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  tbtn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#fff' },
});
