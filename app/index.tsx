import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TALES } from "../src/data/tales";
import { color, font, hsl, hueOf } from "../src/theme";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Shelf() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <FlatList
        data={TALES}
        keyExtractor={(t) => t.slug}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>CUENTOS PARA APRENDER A LEER</Text>
            <Text style={styles.title}>Cuentacuentos</Text>
            <Text style={styles.sub}>Elige un cuento, reparte los papeles entre la familia y léelo con letra grande.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const h = hueOf(item.slug);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${item.title}`}
              onPress={() => router.push(`/reparto/${item.slug}`)}
              style={({ pressed }) => [styles.coverWrap, pressed && { transform: [{ scale: 0.97 }] }]}
            >
              <LinearGradient colors={[hsl(h, 70, 86), hsl(h + 35, 60, 76)]} style={styles.cover}>
                <View style={[styles.spine, { backgroundColor: hsl(h, 40, 45) }]} />
                <Text style={styles.coverTitle}>{item.title}</Text>
                <Text style={styles.coverMoral} numberOfLines={3}>{cap(item.moral)}</Text>
                <Text style={styles.coverMeta}>{item.pages.length} páginas · {item.cast.length} papeles</Text>
              </LinearGradient>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  row: { gap: 12 },
  header: { paddingTop: 16, paddingBottom: 8, gap: 6 },
  eyebrow: { fontFamily: font.readBold, fontSize: 12, letterSpacing: 1, color: color.muted },
  title: { fontFamily: font.display, fontSize: 36, color: color.ink },
  sub: { fontFamily: font.read, fontSize: 16, color: color.muted, lineHeight: 22 },
  coverWrap: { flex: 1 },
  cover: { minHeight: 180, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, padding: 14, paddingLeft: 22, gap: 6, overflow: "hidden" },
  spine: { position: "absolute", left: 0, top: 0, bottom: 0, width: 8, opacity: 0.5 },
  coverTitle: { fontFamily: font.display, fontSize: 19, lineHeight: 22, color: color.ink },
  coverMoral: { fontFamily: font.read, fontSize: 13, color: color.ink, opacity: 0.8 },
  coverMeta: { fontFamily: font.read, fontSize: 12, color: color.muted, marginTop: "auto" },
});
