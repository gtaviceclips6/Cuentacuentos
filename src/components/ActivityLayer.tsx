import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import type { Activity, Fx } from "../data/activities";
import { color, font } from "../theme";

// Símbolos de texto (no emojis) para las partículas de cada efecto. ︎ fuerza la versión de texto.
const GLYPH: Record<Fx, string> = { spark: "★", flower: "✿", snow: "❄︎", bubble: "○", heart: "♥︎", zzz: "z", wind: "〜" };
const TINTS = ["#FFD966", "#F28CB1", "#8FD3C1", "#FFFFFF", "#F4975E"];

type Particle = { id: number; x: number; y: number; dx: number; dy: number; tint: string; v: Animated.Value };

/**
 * Momento de la imagen: aparece al terminar de leer una página. El niño toca, mantiene, frota o sopla
 * hasta llenar la barra; al terminar sale «¡Muy bien!» y se llama a onDone.
 */
export function ActivityLayer({ activity, onDone, onSkip }: { activity: Activity; onDone: () => void; onSkip: () => void }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [micOff, setMicOff] = useState(false);
  const [parts, setParts] = useState<Particle[]>([]);
  const prog = useRef(0);
  const taps = useRef(0);
  const holding = useRef(false);
  const lastRub = useRef<{ x: number; y: number } | null>(null);
  const appear = useRef(new Animated.Value(0)).current;
  const pid = useRef(0);
  const recorder = useAudioRecorder({ ...RecordingPresets.LOW_QUALITY, isMeteringEnabled: true });
  const doneRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  // Dónde está el objetivo: en el centro, o en un sitio al azar si hay que «encontrar» algo.
  const target = useMemo(() => {
    if (!size.w) return { x: 0, y: 0 };
    if (activity.find) return { x: size.w * (0.25 + Math.random() * 0.5), y: size.h * (0.45 + Math.random() * 0.3) };
    return { x: size.w / 2, y: size.h * 0.55 };
  }, [size.w, size.h, activity]);
  targetRef.current = target;

  useEffect(() => {
    Animated.spring(appear, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
  }, [appear]);

  function burst(x: number, y: number, n: number) {
    const fresh: Particle[] = Array.from({ length: n }, () => {
      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 110;
      const wind = activity.fx === "wind";
      return {
        id: pid.current++, x, y,
        dx: wind ? 120 + Math.random() * 160 : Math.cos(a) * d,
        dy: wind ? (Math.random() - 0.5) * 40 : activity.fx === "zzz" || activity.fx === "bubble" ? -60 - Math.random() * 80 : activity.fx === "snow" ? 40 + Math.random() * 60 : Math.sin(a) * d,
        tint: TINTS[Math.floor(Math.random() * TINTS.length)],
        v: new Animated.Value(0),
      };
    });
    setParts((p) => [...p.slice(-60), ...fresh]);
    fresh.forEach((p) => Animated.timing(p.v, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      setParts((all) => all.filter((q) => q.id !== p.id));
    }));
  }

  function add(amount: number, x = targetRef.current.x, y = targetRef.current.y, n = 3) {
    if (doneRef.current) return;
    prog.current = Math.min(1, prog.current + amount);
    setProgress(prog.current);
    burst(x, y, n);
    if (prog.current >= 1) finish();
  }

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    holding.current = false;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const { w, h } = sizeRef.current;
    for (let i = 0; i < 5; i++) setTimeout(() => burst(w * (0.2 + 0.15 * i), h * (0.35 + 0.1 * (i % 3)), 8), i * 90);
    setTimeout(onDone, 1300);
  }

  // Mantener el dedo: la barra se llena mientras se aprieta (también sirve si no hay micrófono).
  useEffect(() => {
    const t = setInterval(() => { if (holding.current) add(0.035, undefined, undefined, 1); }, 80);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Soplar: el micrófono mide el volumen; un soplido fuerte llena la barra. No se guarda nada.
  useEffect(() => {
    if (activity.kind !== "blow") return;
    let alive = true;
    let poll: ReturnType<typeof setInterval> | undefined;
    (async () => {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) { setMicOff(true); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (!alive) return;
      recorder.record();
      poll = setInterval(() => {
        const level = recorder.getStatus().metering;
        if (alive && typeof level === "number" && level > -20) {
          add(0.05, Math.random() * sizeRef.current.w * 0.3, sizeRef.current.h * (0.3 + Math.random() * 0.5), 2);
        }
      }, 100);
    })().catch(() => setMicOff(true));
    return () => {
      alive = false;
      if (poll) clearInterval(poll);
      recorder.stop().catch(() => {});
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.kind]);

  // Frotar: cuenta la distancia que recorre el dedo por la pantalla.
  const rub = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => { lastRub.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }; },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        const last = lastRub.current;
        if (last) {
          const d = Math.hypot(x - last.x, y - last.y);
          if (d > 6) { add(d / ((sizeRef.current.w || 360) * 2.6), x, y, 1); lastRub.current = { x, y }; }
        }
      },
      onPanResponderRelease: () => { lastRub.current = null; },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const next = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
    sizeRef.current = next;
    setSize(next);
  };
  const showTarget = activity.kind === "tap" || activity.kind === "hold" || activity.kind === "blow";
  const help = activity.kind === "blow" && micOff ? "Sin micrófono: deja el dedo apretado" : activity.help;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} {...(activity.kind === "rub" ? rub.panHandlers : {})}>
      <Animated.View style={[styles.prompt, { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }] }]}>
        <Text style={styles.promptText}>{activity.text}</Text>
        <Text style={styles.promptHelp}>{help}</Text>
      </Animated.View>

      {showTarget && size.w > 0 && !done && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activity.label ?? activity.text}
          onPressIn={() => {
            if (activity.kind === "tap") {
              Haptics.selectionAsync().catch(() => {});
              taps.current += 1;
              add(1 / (activity.n ?? 3), undefined, undefined, 10);
            } else holding.current = true;
          }}
          onPressOut={() => { holding.current = false; }}
          style={[styles.target, { left: target.x - 70, top: target.y - 70 }]}
        >
          <View style={[styles.ring, { borderColor: color.accent, opacity: 0.35 + progress * 0.65 }]} />
          <View style={styles.targetInner}><Text style={styles.targetText}>{activity.label ?? "¡Aquí!"}</Text></View>
        </Pressable>
      )}

      {parts.map((p) => (
        <Animated.Text
          key={p.id}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              left: p.x - 12, top: p.y - 16, color: activity.fx === "heart" ? "#F06B8B" : p.tint,
              opacity: p.v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.8, 0] }),
              transform: [
                { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
                { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }) },
                { scale: p.v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.2, 0.8] }) },
              ],
            },
          ]}
        >
          {GLYPH[activity.fx]}
        </Animated.Text>
      ))}

      <View style={styles.meter} pointerEvents="none"><View style={[styles.meterFill, { width: `${Math.round(progress * 100)}%` }]} /></View>
      {!done && (
        <Pressable onPress={onSkip} style={styles.skip} accessibilityRole="button"><Text style={styles.skipText}>Saltar</Text></Pressable>
      )}
      {done && (
        <View style={styles.bravoWrap} pointerEvents="none"><Text style={styles.bravo}>¡Muy bien!</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { position: "absolute", top: 14, left: 14, right: 14, alignItems: "center", backgroundColor: "rgba(255,253,248,0.96)", borderRadius: 22, paddingVertical: 10, paddingHorizontal: 16 },
  promptText: { fontFamily: font.display, fontSize: 28, color: "#1F2238", textAlign: "center" },
  promptHelp: { fontFamily: font.readBold, fontSize: 17, color: color.muted, textAlign: "center", marginTop: 2 },
  target: { position: "absolute", width: 140, height: 140, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 140, height: 140, borderRadius: 70, borderWidth: 10 },
  targetInner: { width: 112, height: 112, borderRadius: 56, backgroundColor: "rgba(255,253,248,0.94)", alignItems: "center", justifyContent: "center" },
  targetText: { fontFamily: font.display, fontSize: 19, color: "#1F2238", textAlign: "center" },
  particle: { position: "absolute", fontSize: 30, fontFamily: font.display, textShadowColor: "rgba(0,0,0,0.25)", textShadowRadius: 3 },
  meter: { position: "absolute", left: 24, right: 24, bottom: 22, height: 16, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.65)", overflow: "hidden" },
  meterFill: { height: "100%", backgroundColor: color.accent, borderRadius: 999 },
  skip: { position: "absolute", right: 12, bottom: 48, backgroundColor: "rgba(31,34,56,0.7)", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  skipText: { fontFamily: font.readBold, color: "#FFFFFF", fontSize: 14 },
  bravoWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  bravo: { fontFamily: font.display, fontSize: 52, color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 8 },
});
