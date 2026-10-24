import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DAY_START_MIN, nextMorning } from './diary';

const CHANNEL = 'morning';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // 안드로이드 13+ 에서는 채널이 있어야 권한 요청 창이 뜬다
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: '아침 안부',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return req.granted;
}

const GENERIC = '좋은 아침이에요. 오늘 하루는 어떻게 시작하고 있어요?';

/**
 * 다음 아침 08:30 알림에는 어제 일기에 이어지는 안부를, 그 뒤 6일은 기본 안부를 예약한다.
 * 앱이 백그라운드로 갈 때마다 다시 예약해서 내용을 최신으로 유지한다.
 * (출시 버전에서는 서버가 08:00에 안부를 만들고 08:30에 푸시를 보낸다.)
 */
export async function scheduleMornings(nextGreeting: string) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const first = nextMorning(new Date(), DAY_START_MIN);
    for (let i = 0; i < 7; i++) {
      const when = new Date(first);
      when.setDate(first.getDate() + i);
      await Notifications.scheduleNotificationAsync({
        content: { title: '해피', body: i === 0 ? nextGreeting : GENERIC, data: { kind: 'morning' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL },
      });
    }
  } catch (e) {
    console.warn('schedule failed', e);
  }
}

export async function cancelMornings() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
