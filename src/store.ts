import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import type { ProviderId } from './ai/providers';
import { PROVIDERS } from './ai/providers';

export interface Msg {
  id: string;
  role: 'me' | 'happy';
  text: string;
  at: number;          // 보낸 시각 (ms)
  greet?: boolean;     // 아침 안부
}

export interface Diary {
  date: string;        // 일기 날짜 YYYY-MM-DD (08:30 경계)
  status: 'open' | 'closed';
  messages: Msg[];
  summary?: string[];
  mood?: 'good' | 'mid' | 'low';
  safety?: boolean;    // 이 날 안전 모드가 열렸는지 (요약·안부에 쓰지 않음)
}

export interface Profile {
  ai: ProviderId;
  models: Record<ProviderId, string>;
  idleSec: number;
  pinHash: string;
  createdAt: number;
  timeRequest?: string;   // 안부 시간 변경 요청 (준비 중 기능)
}

const K_PROFILE = 'imhappy.profile';
const K_DIARIES = 'imhappy.diaries';
const keyName = (p: ProviderId) => `imhappy_key_${p}`;

export const defaultModels = (): Record<ProviderId, string> => ({
  anthropic: PROVIDERS.anthropic.defaultModel,
  openai: PROVIDERS.openai.defaultModel,
  gemini: PROVIDERS.gemini.defaultModel,
});

export async function loadProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(K_PROFILE);
  return raw ? (JSON.parse(raw) as Profile) : null;
}
export async function saveProfile(p: Profile) {
  await AsyncStorage.setItem(K_PROFILE, JSON.stringify(p));
}

export async function loadDiaries(): Promise<Record<string, Diary>> {
  const raw = await AsyncStorage.getItem(K_DIARIES);
  return raw ? (JSON.parse(raw) as Record<string, Diary>) : {};
}
export async function saveDiaries(d: Record<string, Diary>) {
  await AsyncStorage.setItem(K_DIARIES, JSON.stringify(d));
}

/** API 키는 기기의 보안 저장소에만 둔다 */
export async function getApiKey(p: ProviderId): Promise<string> {
  return (await SecureStore.getItemAsync(keyName(p))) ?? '';
}
export async function setApiKey(p: ProviderId, key: string) {
  if (key) await SecureStore.setItemAsync(keyName(p), key.trim());
  else await SecureStore.deleteItemAsync(keyName(p));
}

export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'imhappy:' + pin);
}

export async function wipeAll() {
  await AsyncStorage.multiRemove([K_PROFILE, K_DIARIES]);
  for (const p of Object.keys(PROVIDERS) as ProviderId[]) await SecureStore.deleteItemAsync(keyName(p));
}

export const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
