import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import type { Hue } from '../theme';

/** 흰 글씨 "I'm HAPPY" 뒤에 파스텔 빛이 은은하게 번지는 로고 */
export function Wordmark({ hue, size = 52, width = 330, height = 150 }: { hue: Hue; size?: number; width?: number; height?: number }) {
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={hue.glow} stopOpacity="1" />
              <Stop offset="0.5" stopColor={hue.glow} stopOpacity="0.75" />
              <Stop offset="1" stopColor={hue.glow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill="url(#halo)" />
        </Svg>
      </Animated.View>
      <Text
        style={{
          fontFamily: 'Montserrat_800ExtraBold',
          fontSize: size,
          color: '#FFFFFF',
          textShadowColor: hue.ink + 'AA',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 10,
          letterSpacing: -0.5,
        }}
      >
        I'm HAPPY
      </Text>
    </View>
  );
}
