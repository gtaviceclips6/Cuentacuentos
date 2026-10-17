import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View, type ImageSourcePropType, type LayoutChangeEvent } from "react-native";
import { IMAGES } from "../data/images";
import FACE_SLOTS from "../data/faceSlots.json";
import type { Tale } from "../data/tales";
import { FACE_OVAL } from "../lib/faceOval";
import { nameOf, type CastConfig } from "../state/cast";
import { color, font, hsl, hueOf } from "../theme";
import { Face } from "./Face";

type Slot = { id: string; x: number; y: number; w: number; h: number };
const SLOTS = FACE_SLOTS as Record<string, Record<string, Slot[]>>;

/**
 * Fondo de una página: la ilustración con las caras de la familia metidas en los personajes,
 * o un fondo provisional con las caras si la página aún no tiene dibujo.
 */
export function Scene({ tale, index, cfg, still = false }: { tale: Tale; index: number; cfg: CastConfig; still?: boolean }) {
  const img = IMAGES[tale.slug]?.[index + 1];
  const h = hueOf(tale.slug);
  const page = tale.pages[index];
  const members = page.c.map((id) => tale.cast.find((m) => m.id === id)).filter(Boolean) as Tale["cast"];

  if (img) return <Illustrated tale={tale} index={index} cfg={cfg} img={img} still={still} />;

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

function Illustrated({ tale, index, cfg, img, still }: { tale: Tale; index: number; cfg: CastConfig; img: ImageSourcePropType; still: boolean }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const drift = useRef(new Animated.Value(0)).current;

  // Movimiento lento del dibujo (como una cámara que se acerca), para que la página esté viva.
  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, still]);

  // Cómo cae el dibujo en la pantalla con resizeMode «cover».
  const src = Image.resolveAssetSource(img);
  const iw = src?.width || 848;
  const ih = src?.height || 1264;
  const k = box.w ? Math.max(box.w / iw, box.h / ih) : 0;
  const dx = (box.w - iw * k) / 2;
  const dy = (box.h - ih * k) / 2;

  const slots = SLOTS[tale.slug]?.[String(index + 1)] ?? [];
  const withFace = slots.filter((s) => cfg[s.id]?.photo && cfg[s.id]?.mode !== "nombre");
  const pasted = new Set(withFace.map((s) => s.id));
  // Personajes con foto que no tienen sitio en este dibujo: salen en medallón abajo.
  const medals = tale.pages[index].c.filter((id) => !pasted.has(id) && cfg[id]?.photo && cfg[id]?.mode !== "nombre");
  const hue = hueOf(tale.slug);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.09] }) },
              { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
            ],
          },
        ]}
      >
        <Image source={img} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {k > 0 && withFace.map((s) => (
          <FacePatch
            key={s.id}
            uri={cfg[s.id]!.photo!}
            x={dx + s.x * iw * k}
            y={dy + s.y * ih * k}
            w={s.w * iw * k}
            h={s.h * ih * k}
          />
        ))}
      </Animated.View>
      {medals.length > 0 && (
        <View style={styles.medals}>
          {medals.map((id) => {
            const m = tale.cast.find((c) => c.id === id)!;
            return (
              <View key={id} style={styles.face}>
                <Face member={m} cfg={cfg} hue={hue + 40} size={60} />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

/**
 * La cara de la foto, recortada en óvalo y colocada sobre la cara del personaje.
 * (x, y, w, h) es la cara del dibujo en la pantalla; la foto se escala para que su óvalo la cubra.
 */
function FacePatch({ uri, x, y, w, h }: { uri: string; x: number; y: number; w: number; h: number }) {
  const ow = w * 1.06; // óvalo un poco más ancho que la cara del dibujo, para taparla entera
  const oh = h * 1.32;
  const cx = x + w / 2;
  const cy = y + h / 2 - h * 0.06; // un poco hacia arriba: frente incluida
  const S = ow / (FACE_OVAL.rx * 2); // tamaño de la foto para que su óvalo mida lo mismo
  // Círculo estirado en vertical = óvalo; dentro se deshace el estiramiento para no deformar la foto.
  return (
    <View
      pointerEvents="none"
      style={[styles.patch, { left: cx - ow / 2, top: cy - ow / 2, width: ow, height: ow, borderRadius: ow / 2, transform: [{ scaleY: oh / ow }] }]}
    >
      <View style={[StyleSheet.absoluteFill, { transform: [{ scaleY: ow / oh }] }]}>
        <Image
          source={{ uri }}
          style={{ position: "absolute", width: S, height: S, left: ow / 2 - FACE_OVAL.cx * S, top: ow / 2 - FACE_OVAL.cy * S }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  faces: { position: "absolute", left: 0, right: 0, bottom: "16%", flexDirection: "row", justifyContent: "center", gap: 18 },
  face: { alignItems: "center", gap: 6, maxWidth: 110 },
  medals: { position: "absolute", left: 12, bottom: 30, flexDirection: "row", gap: 10 },
  patch: { position: "absolute", overflow: "hidden", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.75)" },
  label: { fontFamily: font.readBold, fontSize: 14, color: color.ink, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
  pending: { position: "absolute", left: 16, bottom: 14, fontFamily: font.read, fontSize: 12, color: color.ink, opacity: 0.6 },
});
