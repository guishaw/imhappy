import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { HUES, HUE_DRIFT_MS, nextHue } from './src/theme';
import { addDays, diaryDate } from './src/diary';
import {
  defaultModels, getApiKey, hashPin, loadDiaries, loadProfile, newId, saveDiaries, saveProfile, setApiKey, wipeAll,
  type Diary, type Msg, type Profile,
} from './src/store';
import {
  FIRST_GREETING, RISK, demoReply, happyGreeting, happyReply, happySummary, ruleGreeting, ruleSummary, type AIConfig,
} from './src/ai/happy';
import { AIError, type ProviderId } from './src/ai/providers';
import { ensurePermission, scheduleMornings } from './src/notifications';
import { Signup, type SignupResult } from './src/screens/Signup';
import { Home } from './src/screens/Home';
import { Calendar } from './src/screens/Calendar';
import { Settings } from './src/screens/Settings';
import { LockScreen, SafetyScreen } from './src/screens/Overlays';

type View_ = 'home' | 'cal' | 'set';

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_700Bold: require('@expo-google-fonts/montserrat/700Bold/Montserrat_700Bold.ttf'),
    Montserrat_800ExtraBold: require('@expo-google-fonts/montserrat/800ExtraBold/Montserrat_800ExtraBold.ttf'),
  });

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [diaries, setDiaries] = useState<Record<string, Diary>>({});
  const [today, setToday] = useState(diaryDate());
  const [hueIx, setHueIx] = useState(() => Math.floor(Math.random() * HUES.length));
  const [view, setView] = useState<View_>('home');
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [safety, setSafety] = useState(false);
  const [apiKey, setKey] = useState('');

  const lastTouch = useRef(Date.now());
  const bgAt = useRef(0);
  const demoN = useRef(0);
  const hue = HUES[hueIx];

  const aiConfig = useCallback((): AIConfig | null => {
    if (!profile || !apiKey) return null;
    return { provider: profile.ai, apiKey, model: profile.models[profile.ai] };
  }, [profile, apiKey]);

  /* ---------- 일기 날짜가 바뀌면 지난 일기를 마감하고 오늘 일기를 연다 ---------- */
  const ensureToday = useCallback((src: Record<string, Diary>, ai: AIConfig | null): Record<string, Diary> => {
    const day = diaryDate();
    setToday(day);
    if (src[day]) return src;
    const next = { ...src };
    const toSummarize: string[] = [];
    for (const d of Object.values(next)) {
      if (d.status === 'open' && d.date < day) {
        next[d.date] = { ...d, status: 'closed', summary: ruleSummary(d) };
        if (!d.safety && d.messages.some((m) => m.role === 'me')) toSummarize.push(d.date);
      }
    }
    const yesterday = next[addDays(day, -1)];
    const first = Object.keys(src).length === 0;
    next[day] = {
      date: day, status: 'open',
      messages: [{ id: newId(), role: 'happy', greet: true, at: Date.now(), text: first ? FIRST_GREETING : ruleGreeting(yesterday) }],
    };

    if (ai) {
      // 지난 일기 요약 (AI)
      for (const date of toSummarize) {
        happySummary(ai, next[date]).then((r) => {
          if (r) setDiaries((cur) => ({ ...cur, [date]: { ...cur[date], summary: r.summary, mood: r.mood } }));
        }).catch(() => {});
      }
      // 어제에 이어지는 안부 (AI). 사용자가 아직 답하지 않았을 때만 바꾼다
      if (yesterday && !yesterday.safety && yesterday.messages.some((m) => m.role === 'me')) {
        happyGreeting(ai, yesterday).then((g) => {
          if (!g) return;
          setDiaries((cur) => {
            const t = cur[day];
            if (!t || t.messages.some((m) => m.role === 'me')) return cur;
            return { ...cur, [day]: { ...t, messages: [{ ...t.messages[0], text: g }, ...t.messages.slice(1)] } };
          });
        }).catch(() => {});
      }
    }
    return next;
  }, []);

  /* ---------- 처음 불러오기 ---------- */
  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      const d = await loadDiaries();
      setProfile(p);
      if (p) {
        const k = await getApiKey(p.ai);
        setKey(k);
        setDiaries(ensureToday(d, k ? { provider: p.ai, apiKey: k, model: p.models[p.ai] } : null));
      }
      setReady(true);
    })();
  }, [ensureToday]);

  useEffect(() => { if (ready && profile) saveDiaries(diaries); }, [diaries, ready, profile]);
  useEffect(() => { if (profile) getApiKey(profile.ai).then(setKey); }, [profile?.ai]);

  /* ---------- 자리비움 잠금 · 날짜 넘김 · 컬러 ---------- */
  useEffect(() => {
    if (!profile) return;
    const t = setInterval(() => {
      if (!locked && Date.now() - lastTouch.current > profile.idleSec * 1000) setLocked(true);
      if (diaryDate() !== today) setDiaries((cur) => ensureToday(cur, aiConfig()));
    }, 1000);
    return () => clearInterval(t);
  }, [profile, locked, today, ensureToday, aiConfig]);

  useEffect(() => {
    const t = setInterval(() => setHueIx((i) => nextHue(i)), HUE_DRIFT_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (!profile) return;
      if (st === 'background') {
        bgAt.current = Date.now();
        const t = diaries[diaryDate()];
        scheduleMornings(ruleGreeting(t));   // 내일 아침 안부 예약 (오늘 대화 반영)
      } else if (st === 'active') {
        if (bgAt.current && Date.now() - bgAt.current > profile.idleSec * 1000) setLocked(true);
        lastTouch.current = Date.now();
        setHueIx((i) => nextHue(i));          // 다시 접속할 때마다 컬러가 바뀐다
        setDiaries((cur) => ensureToday(cur, aiConfig()));
      }
    });
    return () => sub.remove();
  }, [profile, diaries, ensureToday, aiConfig]);

  /* ---------- 대화 ---------- */
  const addMsg = (day: string, m: Msg, patch: Partial<Diary> = {}) =>
    setDiaries((cur) => ({ ...cur, [day]: { ...cur[day], ...patch, messages: [...cur[day].messages, m] } }));

  const onSend = async (text: string) => {
    const day = diaryDate();
    let src = diaries;
    if (!src[day]) { src = ensureToday(src, aiConfig()); setDiaries(src); }
    const me: Msg = { id: newId(), role: 'me', text, at: Date.now() };

    if (RISK.test(text)) { addMsg(day, me, { safety: true }); setSafety(true); return; }   // AI 부르기 전에 차단
    addMsg(day, me);

    const ai = aiConfig();
    setBusy(true);
    if (!ai) {
      setTimeout(() => { addMsg(day, { id: newId(), role: 'happy', at: Date.now(), text: demoReply(demoN.current++) }); setBusy(false); }, 700);
      return;
    }
    try {
      const todayDiary = { ...src[day], messages: [...src[day].messages, me] };
      const r = await happyReply(ai, todayDiary, src[addDays(day, -1)]);
      if (r === 'SAFETY') { setDiaries((cur) => ({ ...cur, [day]: { ...cur[day], safety: true } })); setSafety(true); }
      else addMsg(day, { id: newId(), role: 'happy', at: Date.now(), text: r });
    } catch (e) {
      const why = e instanceof AIError
        ? (e.status === 401 || e.status === 403 ? 'API 키를 확인해 주세요.' : e.status === 404 ? '모델 이름을 확인해 주세요.' : e.status === 429 ? '사용량 한도에 걸렸어요. 잠시 뒤 다시 써 주세요.' : `오류 ${e.status}`)
        : '인터넷 연결을 확인해 주세요.';
      addMsg(day, { id: newId(), role: 'happy', at: Date.now(), text: `지금은 답을 가져오지 못했어요. ${why}` });
    } finally {
      setBusy(false);
    }
  };

  /* ---------- 가입 ---------- */
  const onSignup = async (r: SignupResult) => {
    const p: Profile = { ai: r.ai, models: defaultModels(), idleSec: 300, pinHash: await hashPin(r.pin), createdAt: Date.now() };
    await setApiKey(r.ai, r.apiKey);
    await saveProfile(p);
    setKey(r.apiKey);
    setProfile(p);
    const d = ensureToday({}, null);
    setDiaries(d);
    await saveDiaries(d);
    if (r.notify) scheduleMornings('좋은 아침이에요. 오늘 하루는 어떻게 시작하고 있어요?');
    lastTouch.current = Date.now();
  };

  const updateProfile = (p: Profile) => { setProfile(p); saveProfile(p); };

  if (!fontsLoaded || !ready) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}><ActivityIndicator color={hue.ink} /></View>;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} onTouchStart={() => { lastTouch.current = Date.now(); }}>
        {!profile ? (
          <Signup hue={hue} onDone={onSignup} askNotify={ensurePermission} />
        ) : (
          <>
            {view === 'home' && diaries[today] && (
              <Home hue={hue} diary={diaries[today]} busy={busy} demo={!apiKey}
                onSend={onSend} onCalendar={() => setView('cal')} onSettings={() => setView('set')} />
            )}
            {view === 'cal' && <Calendar hue={hue} diaries={diaries} today={today} onBack={() => setView('home')} />}
            {view === 'set' && (
              <Settings hue={hue} profile={profile} onBack={() => setView('home')} onProfile={updateProfile}
                onKey={async (prov: ProviderId, k: string) => { await setApiKey(prov, k); if (prov === profile.ai) setKey(k.trim()); }}
                onPin={async (pin) => updateProfile({ ...profile, pinHash: await hashPin(pin) })}
                onWipe={async () => { await wipeAll(); setProfile(null); setDiaries({}); setKey(''); setView('home'); }} />
            )}
            {safety && <SafetyScreen onClose={() => setSafety(false)} />}
            {locked && (
              <LockScreen hue={hue} onCheck={async (pin) => {
                const ok = (await hashPin(pin)) === profile.pinHash;
                if (ok) { setLocked(false); lastTouch.current = Date.now(); setHueIx((i) => nextHue(i)); }
                return ok;
              }} />
            )}
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
