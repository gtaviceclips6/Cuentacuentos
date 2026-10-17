import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FACE_OVAL, clampSquare, type Prepared, type Square } from "../lib/faceCrop";
import { color, font } from "../theme";

/**
 * Ajustar la cara: el padre mueve la foto con el dedo (y la acerca o aleja) hasta que la cara
 * quede dentro del óvalo. Ese óvalo es justo el trozo que luego se pega en el personaje del dibujo.
 */
export function FaceEditor({
  prepared, title, onDone, onCancel,
}: { prepared: Prepared; title: string; onDone: (s: Square) => Promise<void> | void; onCancel: () => void }) {
  const { width } = useWindowDimensions();
  const V = Math.min(width - 48, 420); // lado del visor
  const { width: W, height: H } = prepared;
  const [sq, setSq] = useState<Square>(prepared.square);
  const [saving, setSaving] = useState(false);
  const cur = useRef(sq);
  cur.current = sq;

  const set = (s: Square) => setSq(clampSquare(s, W, H));
  const zoom = (f: number) => {
    const s = cur.current;
    const side = s.side / f;
    set({ side, x: s.x + (s.side - side) / 2, y: s.y + (s.side - side) / 2 });
  };

  // Un dedo mueve la foto; dos dedos la acercan o alejan.
  const g = useRef<{ start: Square; dist: number | null } | null>(null);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => { g.current = { start: cur.current, dist: null }; },
        onPanResponderMove: (e, gs) => {
          const st = g.current;
          if (!st) return;
          const t = e.nativeEvent.touches;
          const k = V / st.start.side; // píxeles de pantalla por píxel de foto
          if (t.length >= 2) {
            const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
            if (st.dist == null) { st.dist = d; st.start = cur.current; return; }
            const side = st.start.side * (st.dist / d);
            set({ side, x: st.start.x + (st.start.side - side) / 2, y: st.start.y + (st.start.side - side) / 2 });
          } else if (st.dist == null) {
            set({ side: st.start.side, x: st.start.x - gs.dx / k, y: st.start.y - gs.dy / k });
          }
        },
        onPanResponderRelease: () => { g.current = null; },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [V, W, H],
  );

  const k = V / sq.side;
  const ow = V * FACE_OVAL.rx * 2;
  const oh = V * FACE_OVAL.ry * 2;

  return (
    <Modal animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.help}>Mueve la foto con el dedo hasta que la cara quede dentro del óvalo.</Text>

        <View style={[styles.viewer, { width: V, height: V }]} {...pan.panHandlers}>
          <Image
            source={{ uri: prepared.uri }}
            style={{ position: "absolute", width: W * k, height: H * k, left: -sq.x * k, top: -sq.y * k }}
          />
          {/* Óvalo de verdad: un círculo estirado en vertical (borderRadius solo hace cápsulas) */}
          <View
            pointerEvents="none"
            style={[styles.oval, { width: ow, height: ow, borderRadius: ow / 2, left: V * FACE_OVAL.cx - ow / 2, top: V * FACE_OVAL.cy - ow / 2, transform: [{ scaleY: oh / ow }] }]}
          />
        </View>

        <View style={styles.zoomRow}>
          <Pressable onPress={() => zoom(1 / 1.15)} style={styles.zoomBtn} accessibilityLabel="Alejar"><Text style={styles.zoomText}>−</Text></Pressable>
          <Text style={styles.zoomLabel}>Acercar o alejar</Text>
          <Pressable onPress={() => zoom(1.15)} style={styles.zoomBtn} accessibilityLabel="Acercar"><Text style={styles.zoomText}>+</Text></Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={[styles.btn, styles.btnSoft]} disabled={saving}><Text style={[styles.btnText, { color: color.ink }]}>Cancelar</Text></Pressable>
          <Pressable
            onPress={async () => { setSaving(true); try { await onDone(cur.current); } finally { setSaving(false); } }}
            style={styles.btn}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={color.accentInk} /> : <Text style={styles.btnText}>Listo</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg, alignItems: "center", padding: 20, gap: 14 },
  title: { fontFamily: font.display, fontSize: 26, color: color.ink, textAlign: "center" },
  help: { fontFamily: font.read, fontSize: 17, color: color.muted, textAlign: "center", maxWidth: 380 },
  viewer: { overflow: "hidden", borderRadius: 20, backgroundColor: "#222" },
  oval: { position: "absolute", borderWidth: 4, borderColor: "#FFFFFF", borderStyle: "dashed", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 6 },
  zoomRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  zoomBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: color.soft, alignItems: "center", justifyContent: "center" },
  zoomText: { fontFamily: font.display, fontSize: 30, color: color.ink },
  zoomLabel: { fontFamily: font.read, fontSize: 15, color: color.muted },
  actions: { flexDirection: "row", gap: 12, marginTop: 6 },
  btn: { minWidth: 140, height: 54, borderRadius: 999, backgroundColor: color.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  btnSoft: { backgroundColor: color.soft },
  btnText: { fontFamily: font.display, fontSize: 19, color: color.accentInk },
});
