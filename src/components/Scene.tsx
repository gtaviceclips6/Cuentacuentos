import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";
import { IMAGES } from "../data/images";
import type { Tale } from "../data/tales";
import { nameOf, type CastConfig } from "../state/cast";
import { color, font, hsl, hueOf } from "../theme";
import { Face } from "./Face";

/**
 * Fondo de una página: la ilustración si ya existe en assets/tales, o un fondo provisional
 * con las caras de los personajes que salen en esa página.
 */
export function Scene({ tale, index, cfg }: { tale: Tale; index: number; cfg: CastConfig }) {
  const img = IMAGES[tale.slug]?.[index + 1];
  const h = hueOf(tale.slug);
  const page = tale.pages[index];
  const members = page.c.map((id) => tale.cast.find((m) => m.id === id)).filter(Boolean) as Tale["cast"];

  if (img) {
    // Hasta que las caras vayan dentro del dibujo, los papeles con foto o nombre salen en medallones abajo.
    const chosen = members.filter((m) => cfg[m.id]?.photo || nameOf(cfg, m.id));
    return (
      <View style={StyleSheet.absoluteFill}>
        <Image source={img} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {chosen.length > 0 && (
          <View style={styles.medals}>
            {chosen.map((m) => (
              <View key={m.id} style={styles.face}>
                <Face member={m} cfg={cfg} hue={h + 40} size={64} />
                <Text style={styles.label} numberOfLines={1}>{nameOf(cfg, m.id) || m.label.replace(/^(el|la|su)\s+/i, "")}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }
  return (
    <LinearGradient colors={[hsl(h, 70, 88), hsl(h + 35, 60, 72)]} style={StyleSheet.absoluteFill}>
      <View style={styles.faces}>
        {members.map((m) => (
          <View key={m.id} style={styles.face}>
            <Face member={m} cfg={cfg} hue={h + 40} size={86} />
            <Text style={styles.label} numberOfLines={1}>{nameOf(cfg, m.id) || m.label.replace(/^(el|la|su)\s+/i, "")}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.pending}>Ilustración pendiente</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  faces: { position: "absolute", left: 0, right: 0, bottom: "16%", flexDirection: "row", justifyContent: "center", gap: 18 },
  face: { alignItems: "center", gap: 6, maxWidth: 110 },
  medals: { position: "absolute", left: 12, bottom: 30, flexDirection: "row", gap: 10 },
  label: { fontFamily: font.readBold, fontSize: 14, color: color.ink, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
  pending: { position: "absolute", left: 16, bottom: 14, fontFamily: font.read, fontSize: 12, color: color.ink, opacity: 0.6 },
});
