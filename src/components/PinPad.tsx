import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Hue } from '../theme';
import { C } from '../theme';

/** 4자리 PIN 입력. 4자리가 차면 onDone 을 부르고, false 가 돌아오면 흔들림 없이 비운다 */
export function PinPad({ hue, onDone }: { hue: Hue; onDone: (pin: string) => Promise<boolean> | boolean }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const press = async (k: string) => {
    if (k === 'del') { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      const ok = await onDone(next);
      if (!ok) { setError(true); setTimeout(() => setPin(''), 250); }
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  return (
    <View style={{ alignItems: 'center', gap: 22 }}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[s.dot, { borderColor: error ? '#D96B5B' : hue.ink, backgroundColor: i < pin.length ? (error ? '#D96B5B' : hue.ink) : 'transparent' }]} />
        ))}
      </View>
      {error && <Text style={{ color: '#D96B5B', fontSize: 13 }}>PIN이 맞지 않아요</Text>}
      <View style={s.grid}>
        {keys.map((k, i) =>
          k === '' ? <View key={i} style={s.key} /> : (
            <Pressable key={i} onPress={() => press(k)} style={({ pressed }) => [s.key, { backgroundColor: k === 'del' ? 'transparent' : pressed ? hue.glow : hue.soft }]}>
              <Text style={{ fontSize: k === 'del' ? 14 : 24, color: k === 'del' ? C.sub : C.text }}>{k === 'del' ? '지우기' : k}</Text>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  grid: { width: 264, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  key: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
