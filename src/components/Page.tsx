import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { activityFor } from "../data/activities";
import type { Tale } from "../data/tales";
import { silabas as split } from "../lib/silabas";
import { fillText, type CastConfig } from "../state/cast";
import { color, font } from "../theme";
import { Scene } from "./Scene";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Colores de las sílabas, como en las cartillas del cole: se alternan dentro de cada palabra.
const SYLLABLE = ["#1F2238", "#C2410C"];

/**
 * Una hoja del libro: dibujo a página completa y la letra grande arriba sobre una franja de papel.
 * Cada palabra se puede tocar para oírla (onWord). Con «silabas», cada palabra va en sílabas de dos colores.
 */
export function Page({
  tale, index, cfg, highlight = -1, textHidden = false, silabas = false, onWord,
}: {
  tale: Tale; index: number; cfg: CastConfig; highlight?: number; textHidden?: boolean;
  silabas?: boolean; onWord?: (i: number, word: string) => void;
}) {
  if (index >= tale.pages.length) return <EndPage tale={tale} />;
  const words = fillText(tale.pages[index].t, tale.cast, cfg).split(/\s+/).filter(Boolean);
  return (
    <View style={styles.sheet}>
      <Scene tale={tale} index={index} cfg={cfg} />
      {!textHidden && (
        <LinearGradient colors={["rgba(255,253,248,0.97)", "rgba(255,253,248,0.93)", "rgba(255,253,248,0)"]} locations={[0, 0.7, 1]} style={styles.band}>
          <Text style={styles.text} accessibilityRole="text">
            {words.map((w, i) => (
              <Text key={i}>
                <Text
                  style={i === highlight ? styles.on : undefined}
                  onPress={onWord ? () => onWord(i, w) : undefined}
                  suppressHighlighting
                >
                  {silabas ? split(w).map((sy, k) => <Text key={k} style={{ color: SYLLABLE[k % 2] }}>{sy}</Text>) : w}
                </Text>
                {i < words.length - 1 ? " " : ""}
              </Text>
            ))}
          </Text>
        </LinearGradient>
      )}
      {!textHidden && activityFor(tale.slug, index) && (
        <View style={styles.game} pointerEvents="none">
          <Text style={styles.gameText}>★ Al acabar de leer, ¡juego!</Text>
        </View>
      )}
      <Text style={styles.folio}>{index + 1}</Text>
    </View>
  );
}

export function EndPage({ tale, onAgain, onOther, stars = 0 }: { tale: Tale; onAgain?: () => void; onOther?: () => void; stars?: number }) {
  return (
    <View style={[styles.sheet, styles.end]}>
      {stars > 0 && (
        <View style={styles.prize}>
          <Text style={styles.prizeStar}>★</Text>
          <Text style={styles.prizeText}>¡Estrella ganada!</Text>
          <Text style={styles.prizeCount}>{stars === 1 ? "Tu primera estrella en este cuento" : `Ya tienes ${stars} estrellas en este cuento`}</Text>
        </View>
      )}
      <Text style={styles.endEyebrow}>FIN</Text>
      <Text style={styles.endTitle}>{tale.title}</Text>
      <Text style={styles.endMoral}>{cap(tale.moral)}.</Text>
      {onAgain && (
        <Pressable onPress={onAgain} style={styles.endBtn} accessibilityRole="button"><Text style={styles.endBtnText}>Leer otra vez</Text></Pressable>
      )}
      {onOther && (
        <Pressable onPress={onOther} style={[styles.endBtn, styles.endBtnSoft]} accessibilityRole="button"><Text style={[styles.endBtnText, { color: color.ink }]}>Otro cuento</Text></Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: color.paper, borderTopRightRadius: 16, borderBottomRightRadius: 16, overflow: "hidden" },
  band: { position: "absolute", left: 0, right: 0, top: 0, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 48 },
  text: { fontFamily: font.read, fontSize: 34, lineHeight: 44, color: "#1F2238" },
  on: { backgroundColor: color.highlight },
  game: { position: "absolute", right: 12, bottom: 34, backgroundColor: color.accent, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  gameText: { fontFamily: font.readBold, fontSize: 14, color: color.accentInk },
  folio: { position: "absolute", right: 16, bottom: 10, fontFamily: font.read, fontSize: 13, color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 3 },
  prize: { alignItems: "center", gap: 2, marginBottom: 6 },
  prizeStar: { fontSize: 72, lineHeight: 80, color: "#F2B705", textShadowColor: "rgba(0,0,0,0.15)", textShadowRadius: 6 },
  prizeText: { fontFamily: font.display, fontSize: 24, color: color.accent },
  prizeCount: { fontFamily: font.read, fontSize: 15, color: color.muted },
  end: { alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  endEyebrow: { fontFamily: font.readBold, letterSpacing: 2, color: color.muted },
  endTitle: { fontFamily: font.display, fontSize: 34, textAlign: "center", color: color.ink },
  endMoral: { fontFamily: font.read, fontSize: 22, textAlign: "center", color: color.ink, maxWidth: 320 },
  endBtn: { backgroundColor: color.accent, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 22, minWidth: 200, alignItems: "center" },
  endBtnSoft: { backgroundColor: color.soft },
  endBtnText: { fontFamily: font.display, fontSize: 18, color: color.accentInk },
});
