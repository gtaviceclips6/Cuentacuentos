import * as Speech from "expo-speech";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityLayer } from "../../src/components/ActivityLayer";
import { EndPage, Page } from "../../src/components/Page";
import { activityFor, type Activity } from "../../src/data/activities";
import { taleBySlug } from "../../src/data/tales";
import { silabas as split } from "../../src/lib/silabas";
import { fillText, useCast } from "../../src/state/cast";
import { useProgress } from "../../src/state/progress";
import { color, font } from "../../src/theme";

type Leaf = { index: number; dir: 1 | -1 } | null;
const FLIP_MS = 850;

export default function Reader() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const tale = taleBySlug(String(slug));
  const cast = useCast();
  const cfg = tale ? cast.get(tale) : {};
  const prog = useProgress();
  const [stars, setStars] = useState(0); // estrellas de este cuento al llegar al final

  const [page, setPage] = useState(0);
  const [leaf, setLeaf] = useState<Leaf>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [width, setWidth] = useState(360);
  const progress = useRef(new Animated.Value(0)).current; // 0 = hoja plana a la derecha, 1 = hoja pasada
  const zoom = useRef(new Animated.Value(0)).current; // 1 = el dibujo pasa al frente
  const busy = useRef(false);
  const voice = useRef<string | undefined>(undefined);
  const st = useRef({ page, leaf, activity, width }); // valores actuales para los gestos
  st.current = { page, leaf, activity, width };

  const total = tale ? tale.pages.length : 0; // la página `total` es la de «Fin»

  // Voz en español de España; si el móvil tiene una voz mejorada, se usa esa.
  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then((vs) => {
        const es = vs.filter((v) => /^es[-_]ES/i.test(v.language));
        voice.current = (es.find((v) => String(v.quality).toLowerCase().includes("enhanced")) ?? es[0])?.identifier;
      })
      .catch(() => {});
    return () => { Speech.stop(); };
  }, []);

  const words = useMemo(() => (tale && page < total ? fillText(tale.pages[page].t, tale.cast, cfg).split(/\s+/).filter(Boolean) : []), [tale, page, total, cfg]);

  function stopVoice() {
    Speech.stop();
    setSpeaking(false);
    setHighlight(-1);
  }

  // Al tocar una palabra, la dice despacio (en modo sílabas, primero sílaba a sílaba: «ca, sa… casa»).
  function sayWord(i: number, w: string) {
    if (st.current.leaf || st.current.activity) return;
    Speech.stop();
    setSpeaking(false);
    setHighlight(i);
    const clean = w.replace(/[^\p{L}-]/gu, "");
    if (!clean) return setHighlight(-1);
    const parts = split(clean);
    const text = prog.silabas && parts.length > 1 ? `${parts.join(", ")}… ${clean}` : clean;
    Speech.speak(text, {
      language: "es-ES",
      voice: voice.current,
      rate: 0.7,
      onDone: () => setHighlight((h) => (h === i ? -1 : h)),
      onStopped: () => setHighlight((h) => (h === i ? -1 : h)),
      onError: () => setHighlight(-1),
    });
  }

  function listen() {
    if (speaking) return stopVoice();
    if (!words.length) return;
    const text = words.join(" ");
    const starts: number[] = [];
    words.reduce((pos, w) => { starts.push(pos); return pos + w.length + 1; }, 0);
    const here = page;
    setSpeaking(true);
    Speech.speak(text.replace(/[«»“”"]/g, ""), {
      language: "es-ES",
      voice: voice.current,
      rate: 0.85,
      onBoundary: (e: { charIndex?: number }) => {
        if (typeof e?.charIndex !== "number") return;
        let k = 0;
        starts.forEach((s, i) => { if (s <= e.charIndex!) k = i; });
        setHighlight(k);
      },
      onDone: () => {
        setSpeaking(false);
        setHighlight(-1);
        setTimeout(() => { if (st.current.page === here) doneReading(); }, 700);
      },
      onStopped: () => { setSpeaking(false); setHighlight(-1); },
      onError: () => { setSpeaking(false); setHighlight(-1); },
    });
  }

  // ---------- Paso de hoja ----------
  function begin(dir: 1 | -1) {
    const p = st.current.page;
    if (busy.current || st.current.leaf || st.current.activity) return false;
    if (dir > 0 && p >= total) return false;
    if (dir < 0 && p <= 0) return false;
    stopVoice();
    progress.setValue(dir > 0 ? 0 : 1);
    setLeaf({ index: dir > 0 ? p : p - 1, dir });
    return true;
  }
  function settle(from: number, to: number, commit: boolean, dir: 1 | -1) {
    busy.current = true;
    Animated.timing(progress, {
      toValue: to,
      duration: FLIP_MS * Math.max(0.3, Math.abs(to - from)),
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (commit) setPage((p) => p + dir);
      setLeaf(null);
      progress.setValue(0);
      busy.current = false;
    });
  }
  function turn(dir: 1 | -1) {
    if (!begin(dir)) return;
    requestAnimationFrame(() => settle(dir > 0 ? 0 : 1, dir > 0 ? 1 : 0, true, dir));
  }

  const drag = useRef<{ dir: 1 | -1; p: number } | null>(null);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2 && !busy.current && !st.current.activity,
      onPanResponderGrant: () => { drag.current = null; },
      onPanResponderMove: (_e, g) => {
        if (!drag.current) {
          const dir: 1 | -1 = g.dx < 0 ? 1 : -1;
          if (!begin(dir)) return;
          drag.current = { dir, p: dir > 0 ? 0 : 1 };
        }
        const w = st.current.width || 360;
        const p = drag.current.dir > 0 ? Math.min(1, Math.max(0, -g.dx / w)) : Math.min(1, Math.max(0, 1 - g.dx / w));
        drag.current.p = p;
        progress.setValue(p);
      },
      onPanResponderRelease: (_e, g) => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        const fast = Math.abs(g.vx) > 0.5;
        const to = d.dir > 0 ? (d.p > 0.35 || (fast && g.vx < 0) ? 1 : 0) : (d.p < 0.65 || (fast && g.vx > 0) ? 0 : 1);
        settle(d.p, to, d.dir > 0 ? to === 1 : to === 0, d.dir);
      },
      onPanResponderTerminate: () => {
        const d = drag.current;
        drag.current = null;
        if (d) settle(d.p, d.dir > 0 ? 0 : 1, false, d.dir);
      },
    }),
  ).current;

  // ---------- Leído y actividad ----------
  function doneReading() {
    if (!tale || busy.current || st.current.leaf || st.current.activity) return;
    stopVoice();
    const a = activityFor(tale.slug, st.current.page);
    if (!a) return turn(1);
    setActivity(a);
    Animated.timing(zoom, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }
  function endActivity() {
    Animated.timing(zoom, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(() => {
      setActivity(null);
      setTimeout(() => turn(1), 250);
    });
  }

  // Una estrella cada vez que se llega al final del cuento.
  const reachedEnd = !!tale && page >= total;
  useEffect(() => {
    if (reachedEnd && tale) setStars(prog.addStar(tale.slug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reachedEnd]);

  if (!tale) {
    return (
      <SafeAreaView style={[styles.safe, { padding: 24 }]}>
        <Text style={styles.count}>No encuentro ese cuento.</Text>
      </SafeAreaView>
    );
  }

  const underIndex = leaf ? (leaf.dir > 0 ? page + 1 : page) : page;
  const front = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-180deg"] });
  const back = progress.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "0deg"] });
  const frontShade = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.35, 0.35] });
  const underShade = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.22, 0] });
  const atEnd = page >= total && !leaf;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.top}>
        <Pressable onPress={() => { stopVoice(); router.back(); }} style={styles.back} accessibilityRole="button">
          <Text style={styles.backText}>← Reparto</Text>
        </Pressable>
        <Pressable
          onPress={() => prog.setSilabas(!prog.silabas)}
          style={[styles.syl, prog.silabas && styles.sylOn]}
          accessibilityRole="switch"
          accessibilityState={{ checked: prog.silabas }}
          accessibilityLabel="Leer por sílabas"
        >
          <Text style={[styles.sylText, prog.silabas && styles.sylTextOn]}>
            <Text style={{ color: prog.silabas ? "#FFFFFF" : "#1F2238" }}>sí</Text>
            <Text style={{ color: prog.silabas ? "#FFE08A" : "#C2410C" }}>la</Text>
            <Text style={{ color: prog.silabas ? "#FFFFFF" : "#1F2238" }}>bas</Text>
          </Text>
        </Pressable>
        <Text style={styles.count}>{page < total ? `${page + 1} / ${total}` : "Fin"}</Text>
      </View>

      <View style={styles.stage} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} {...pan.panHandlers}>
        <View style={styles.spine} />
        <View style={styles.book}>
          {/* Hoja de debajo: la que se ve al pasar */}
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }] }]}>
            {atEnd ? (
              <EndPage tale={tale} stars={stars} onAgain={() => setPage(0)} onOther={() => router.replace("/")} />
            ) : (
              <Page tale={tale} index={underIndex} cfg={cfg} highlight={leaf ? -1 : highlight} textHidden={!!activity} silabas={prog.silabas} onWord={leaf ? undefined : sayWord} />
            )}
          </Animated.View>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shade, { opacity: underShade }]} />

          {/* Hoja que gira sobre el lomo */}
          {leaf && (
            <>
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.leaf, { transform: [{ perspective: 2200 }, { rotateY: front }] }]}>
                <Page tale={tale} index={leaf.index} cfg={cfg} silabas={prog.silabas} />
                <Animated.View style={[StyleSheet.absoluteFill, styles.shade, { opacity: frontShade }]} />
              </Animated.View>
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.leaf, styles.backside, { transform: [{ perspective: 2200 }, { rotateY: back }] }]} />
            </>
          )}

          {activity && <ActivityLayer activity={activity} onDone={endActivity} onSkip={endActivity} />}
        </View>
      </View>

      <View style={styles.bar}>
        <Pressable onPress={() => turn(-1)} disabled={page === 0} style={[styles.nav, page === 0 && styles.off]} accessibilityLabel="Página anterior">
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Pressable onPress={listen} disabled={atEnd || !!activity} style={[styles.listen, (atEnd || !!activity) && styles.off]} accessibilityRole="button">
          <Text style={styles.listenText}>{speaking ? "■ Parar" : "▶ Escuchar"}</Text>
        </Pressable>
        <Pressable onPress={doneReading} disabled={atEnd || !!activity} style={[styles.done, (atEnd || !!activity) && styles.off]} accessibilityRole="button">
          <Text style={styles.doneText}>¡Ya lo he leído!</Text>
        </Pressable>
        <Pressable onPress={() => turn(1)} disabled={atEnd} style={[styles.nav, atEnd && styles.off]} accessibilityLabel="Página siguiente">
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  back: { backgroundColor: color.soft, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  backText: { fontFamily: font.readBold, color: color.ink },
  count: { fontFamily: font.readBold, color: color.muted },
  syl: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: color.soft, borderWidth: 2, borderColor: color.soft },
  sylOn: { backgroundColor: color.accent, borderColor: color.accent },
  sylText: { fontFamily: font.readBold, fontSize: 16 },
  sylTextOn: {},
  stage: { flex: 1, marginHorizontal: 10, marginLeft: 18 },
  spine: { position: "absolute", left: -8, top: 6, bottom: 6, width: 10, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, backgroundColor: color.spine },
  book: { flex: 1, borderTopRightRadius: 16, borderBottomRightRadius: 16, backgroundColor: color.paper, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  leaf: { transformOrigin: "left center", backfaceVisibility: "hidden", borderTopRightRadius: 16, borderBottomRightRadius: 16, overflow: "hidden" },
  backside: { backgroundColor: color.paperEdge },
  shade: { backgroundColor: "#000", borderTopRightRadius: 16, borderBottomRightRadius: 16 },
  bar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6 },
  nav: { width: 50, height: 56, borderRadius: 999, backgroundColor: color.soft, alignItems: "center", justifyContent: "center" },
  navText: { fontFamily: font.display, fontSize: 28, color: color.ink },
  listen: { flex: 1, height: 56, borderRadius: 999, backgroundColor: color.soft, alignItems: "center", justifyContent: "center" },
  listenText: { fontFamily: font.readBold, fontSize: 16, color: color.ink },
  done: { flex: 1.4, height: 56, borderRadius: 999, backgroundColor: color.accent, alignItems: "center", justifyContent: "center" },
  doneText: { fontFamily: font.display, fontSize: 16, color: color.accentInk },
  off: { opacity: 0.4 },
});
