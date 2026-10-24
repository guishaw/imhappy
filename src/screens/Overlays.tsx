import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Wordmark } from '../components/Wordmark';
import { PinPad } from '../components/PinPad';
import { C, type Hue } from '../theme';

/** 자리비움 잠금: 메인과 같은 흰 바탕 + 같은 컬러 톤 */
export function LockScreen({ hue, onCheck }: { hue: Hue; onCheck: (pin: string) => Promise<boolean> }) {
  return (
    <View style={[StyleSheet.absoluteFill, s.lock]}>
      <Wordmark hue={hue} size={36} width={270} height={110} />
      <Text style={[s.lt, { color: hue.ink }]}>잠시 자리를 비우셨네요</Text>
      <Text style={s.ls}>일기를 지키려고 잠가뒀어요</Text>
      <View style={{ marginTop: 'auto', marginBottom: 20 }}><PinPad hue={hue} onDone={onCheck} /></View>
    </View>
  );
}

/** 안전 모드: 일반 대화와 분리된 화면. 해피는 진단하지 않고 사람의 도움으로 연결한다 */
export function SafetyScreen({ onClose }: { onClose: () => void }) {
  return (
    <ScrollView style={[StyleSheet.absoluteFill, { backgroundColor: '#fff' }]} contentContainerStyle={s.safe}>
      <Text style={s.sb}>안전 모드 · 일반 대화와 분리됨</Text>
      <Text style={s.sh}>이야기해줘서 고마워요.{'\n'}지금 혼자 두고 싶지 않아요.</Text>
      <Text style={s.sp}>지금 느끼는 게 많이 무겁게 들려요. 이건 저 혼자 감당하기엔 너무 중요한 이야기라, 먼저 지금 안전한지 확인하고 싶어요. 가까운 사람이나 전문 상담에 지금 바로 이야기해 주세요.</Text>
      <View style={s.help}>
        <Text style={s.hl}>자살예방 상담전화 · 24시간</Text>
        <Text selectable style={s.num}>109</Text>
        <Text style={s.hs}>전화가 어렵다면 문자·채팅 상담도 있어요.</Text>
        <Pressable onPress={() => Linking.openURL('tel:109')} style={s.call}><Text style={s.callT}>109에 전화하기</Text></Pressable>
      </View>
      <Text style={[s.hs, { textAlign: 'center' }]}>위급한 상황이면 112 또는 119에 바로 연락하세요.</Text>
      <Text style={[s.hs, { textAlign: 'center' }]}>이 대화는 일기 요약과 다음 날 안부에 쓰이지 않아요.</Text>
      <Pressable onPress={onClose} style={s.back}><Text style={{ fontSize: 15, fontWeight: '600', color: C.text }}>일기로 돌아가기</Text></Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  lock: { backgroundColor: '#fff', alignItems: 'center', paddingTop: 70, paddingHorizontal: 30, zIndex: 50 },
  lt: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  ls: { fontSize: 14, color: C.sub, marginTop: 4 },
  safe: { flexGrow: 1, padding: 24, paddingTop: 56, gap: 16 },
  sb: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '700', color: C.text, borderWidth: 1, borderColor: C.hair, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, overflow: 'hidden' },
  sh: { fontSize: 22, fontWeight: '700', color: C.text, lineHeight: 32 },
  sp: { fontSize: 15, color: C.text, lineHeight: 24 },
  help: { borderWidth: 1.5, borderColor: C.text, borderRadius: 18, padding: 16, gap: 4 },
  hl: { fontSize: 12, fontWeight: '700', color: C.sub },
  num: { fontSize: 30, fontWeight: '700', color: C.text },
  hs: { fontSize: 13, color: C.sub, lineHeight: 20 },
  call: { marginTop: 10, backgroundColor: C.text, borderRadius: 999, paddingVertical: 13, alignItems: 'center' },
  callT: { color: '#fff', fontWeight: '700', fontSize: 15 },
  back: { marginTop: 'auto', borderWidth: 1, borderColor: C.hair, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
});
