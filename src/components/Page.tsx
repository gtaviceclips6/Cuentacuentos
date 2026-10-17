import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Tale } from "../data/tales";
import { fillText, type CastConfig } from "../state/cast";
import { color, font } from "../theme";
import { Scene } from "./Scene";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Una hoja del libro: dibujo a página completa y la letra grande arriba sobre una franja de papel. */
export function Page({
  tale, index, cfg, highlight = -1, textHidden = false,
}: { tale: Tale; index: number; cfg: CastConfig; highlight?: number; textHidden?: boolean }) {
  if (index >= tale.pages.length) return <EndPage tale={tale} />;
  const words = fillText(tale.pages[index].t, tale.cast, cfg).split(/\s+/).filter(Boolean);
  return (
    <View style={styles.sheet}>
      <Scene tale={tale} index={index} cfg={cfg} />
      {!textHidden && (
        <LinearGradient colors={["rgba(255,253,248,0.97)", "rgba(255,253,248,0.93)", "rgba(255,253,248,0)"]} locations={[0, 0.7, 1]} style={styles.band}>
          <Text style={styles.text} accessibilityRole="text">
            {words.map((w, i) => (
              <Text key={i} style={i === highlight ? styles.on : undefined}>{w}{i < words.length - 1 ? " " : ""}</Text>
            ))}
          </Text>
        </LinearGradient>
      )}
      <Text style={styles.folio}>{index + 1}</Text>
    </View>
  );
}

export function EndPage({ tale, onAgain, onOther }: { tale: Tale; onAgain?: () => void; onOther?: () => void }) {
  return (
    <View style={[styles.sheet, styles.end]}>
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
  folio: { position: "absolute", right: 16, bottom: 10, fontFamily: font.read, fontSize: 13, color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 3 },
  end: { alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  endEyebrow: { fontFamily: font.readBold, letterSpacing: 2, color: color.muted },
  endTitle: { fontFamily: font.display, fontSize: 34, textAlign: "center", color: color.ink },
  endMoral: { fontFamily: font.read, fontSize: 22, textAlign: "center", color: color.ink, maxWidth: 320 },
  endBtn: { backgroundColor: color.accent, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 22, minWidth: 200, alignItems: "center" },
  endBtnSoft: { backgroundColor: color.soft },
  endBtnText: { fontFamily: font.display, fontSize: 18, color: color.accentInk },
});
