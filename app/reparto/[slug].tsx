import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Face } from "../../src/components/Face";
import { taleBySlug } from "../../src/data/tales";
import { useCast, type Mode } from "../../src/state/cast";
import { color, font, hueOf } from "../../src/theme";

const MODES: [Mode, string][] = [["cara", "Solo cara"], ["ambos", "Cara y nombre"], ["nombre", "Solo nombre"]];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Reparto() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const tale = taleBySlug(String(slug));
  const cast = useCast();
  const [notice, setNotice] = useState("");
  if (!tale) return <Missing />;
  const cfg = cast.get(tale);
  const hue = hueOf(tale.slug);

  async function pickPhoto(id: string) {
    setNotice("");
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setNotice("Para poner una foto, permite el acceso a las fotos en los ajustes del móvil.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!res.canceled && res.assets[0]) cast.set(tale!.slug, id, { photo: res.assets[0].uri });
    } catch {
      setNotice("No se ha podido abrir la galería. Inténtalo otra vez.");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
          <Text style={styles.backText}>← Cuentos</Text>
        </Pressable>
        <View style={{ gap: 4 }}>
          <Text style={styles.eyebrow}>REPARTO</Text>
          <Text style={styles.title}>{tale.title}</Text>
          <Text style={styles.sub}>Para cada papel: solo la cara, cara y nombre, o solo el nombre. Si no pones foto, sale la inicial.</Text>
        </View>

        {tale.cast.map((m) => {
          const r = cfg[m.id];
          const wantsName = r.mode !== "cara";
          const wantsFace = r.mode !== "nombre";
          return (
            <View key={m.id} style={styles.role}>
              <Face member={m} cfg={cfg} hue={hue} />
              <View style={styles.info}>
                <Text style={styles.roleName}>{cap(m.label)}{m.animal ? "  ·  animal" : ""}</Text>
                <View style={styles.modes}>
                  {MODES.map(([mode, label]) => (
                    <Pressable
                      key={mode}
                      accessibilityRole="button"
                      accessibilityState={{ selected: r.mode === mode }}
                      onPress={() => cast.set(tale.slug, m.id, { mode })}
                      style={[styles.chip, r.mode === mode && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, r.mode === mode && styles.chipTextOn]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                {wantsName && (
                  <TextInput
                    value={r.name}
                    onChangeText={(name) => cast.set(tale.slug, m.id, { name })}
                    placeholder="Nombre (p. ej. Lucía)"
                    placeholderTextColor={color.muted}
                    style={styles.input}
                    maxLength={20}
                    autoCapitalize="words"
                    accessibilityLabel={`Nombre para ${m.label}`}
                  />
                )}
                {wantsFace && (
                  <Pressable onPress={() => pickPhoto(m.id)} style={styles.photo} accessibilityRole="button">
                    <Text style={styles.photoText}>{r.photo ? "Cambiar foto" : "Añadir foto"}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <Text style={styles.privacy}>Las fotos se quedan en este móvil.</Text>

        <Pressable onPress={() => router.push(`/leer/${tale.slug}`)} style={styles.cta} accessibilityRole="button">
          <Text style={styles.ctaText}>Abrir el cuento</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Missing() {
  return (
    <SafeAreaView style={[styles.safe, { padding: 24, gap: 12 }]}>
      <Text style={styles.title}>No encuentro ese cuento</Text>
      <Pressable onPress={() => router.replace("/")} style={styles.cta}><Text style={styles.ctaText}>Volver a los cuentos</Text></Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  wrap: { padding: 16, paddingBottom: 40, gap: 14 },
  back: { alignSelf: "flex-start", backgroundColor: color.soft, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  backText: { fontFamily: font.readBold, color: color.ink },
  eyebrow: { fontFamily: font.readBold, fontSize: 12, letterSpacing: 1, color: color.muted },
  title: { fontFamily: font.display, fontSize: 30, color: color.ink },
  sub: { fontFamily: font.read, fontSize: 15, color: color.muted, lineHeight: 21 },
  role: { flexDirection: "row", gap: 12, backgroundColor: color.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: color.line },
  info: { flex: 1, gap: 8 },
  roleName: { fontFamily: font.readBold, fontSize: 17, color: color.ink },
  modes: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: color.line, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 11 },
  chipOn: { backgroundColor: color.ink, borderColor: color.ink },
  chipText: { fontFamily: font.read, fontSize: 14, color: color.ink },
  chipTextOn: { color: color.bg },
  input: { borderWidth: 1, borderColor: color.line, backgroundColor: color.bg, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11, fontFamily: font.read, fontSize: 16, color: color.ink },
  photo: { alignSelf: "flex-start", borderWidth: 1, borderStyle: "dashed", borderColor: color.muted, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  photoText: { fontFamily: font.readBold, color: color.ink },
  notice: { fontFamily: font.read, color: color.accent },
  privacy: { fontFamily: font.read, fontSize: 13, color: color.muted },
  cta: { alignSelf: "flex-start", backgroundColor: color.accent, borderRadius: 999, paddingVertical: 15, paddingHorizontal: 24 },
  ctaText: { fontFamily: font.display, fontSize: 19, color: color.accentInk },
});
