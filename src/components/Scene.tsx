import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View, type ImageSourcePropType, type LayoutChangeEvent } from "react-native";
import { IMAGES } from "../data/images";
import FACE_SLOTS from "../data/faceSlots.json";
import type { Tale } from "../data/tales";
import { DEFAULT_FIT, type Fit } from "../lib/faceCrop";
import { nameOf, type CastConfig } from "../state/cast";
import { color, font, hsl, hueOf } from "../theme";
import { Face } from "./Face";

/** Cara del dibujo: recuadro, punto entre los ojos (ex, ey), inclinación (a) y color de la piel pintada. */
type Slot = { id: string; x: number; y: number; w: number; h: number; ex?: number; ey?: number; a?: number; skin?: string };
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
  const src = typeof Image.resolveAssetSource === "function" ? Image.resolveAssetSource(img) : null;
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
        {/* El dibujo se coloca con las mismas cuentas que las caras, para que siempre coincidan. */}
        <Image
          source={img}
          style={k > 0 ? { position: "absolute", left: dx, top: dy, width: iw * k, height: ih * k } : StyleSheet.absoluteFill}
          resizeMode={k > 0 ? "stretch" : "cover"}
        />
        {k > 0 && withFace.map((s) => (
          <FacePatch
            key={s.id}
            uri={cfg[s.id]!.photo!}
            fit={cfg[s.id]!.fit ?? DEFAULT_FIT}
            eyeX={dx + (s.ex ?? s.x + s.w / 2) * iw * k}
            eyeY={dy + (s.ey ?? s.y + s.h * 0.39) * ih * k}
            w={s.w * iw * k}
            h={s.h * ih * k}
            angle={s.a ?? 0}
            skin={s.skin ?? "#efc2a6"}
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

// Cómo se encaja la foto en la cara pintada (ajustado comparando con los dibujos de La olla mágica).
const PHOTO_FACE = 1.9; // en una foto, ancho de la cara ≈ 1,9 × distancia entre los ojos
const MASK = { down: 0.22, rx: 0.47, ry: 0.41 }; // óvalo: algo por debajo de los ojos; de las cejas a la barbilla
const RINGS = 6; // capas del borde difuminado
const EDGE = 0.3; // ancho del difuminado (parte del radio)
const TINT = 0.55; // cuánto toma la foto el color de la piel pintada
// Opacidad de cada capa para que, apiladas, el borde vaya de transparente a opaco suavemente.
const RING_OPACITY = (() => {
  const c = Array.from({ length: RINGS }, (_, i) => {
    const t = (i + 1) / RINGS;
    return t * t * (3 - 2 * t);
  });
  return c.map((ci, i) => (i === 0 ? ci : 1 - (1 - ci) / (1 - c[i - 1])));
})();

/**
 * La cara de la foto metida en la cara del dibujo:
 * - se coloca y se gira por los ojos, y se escala al ancho de la cara pintada;
 * - solo se ve un óvalo de las cejas a la barbilla, con el borde difuminado (el pelo y las orejas son los del dibujo);
 * - toma el color de la piel pintada y unos coloretes, para que parezca pintada en el mismo cuento.
 * (eyeX, eyeY): punto entre los ojos del dibujo en pantalla; w, h: tamaño de la cara pintada.
 */
function FacePatch({ uri, fit, eyeX, eyeY, w, h, angle, skin }: {
  uri: string; fit: Fit; eyeX: number; eyeY: number; w: number; h: number; angle: number; skin: string;
}) {
  const rx = MASK.rx * w;
  const ry = MASK.ry * h;
  const R = rx; // se dibuja un círculo de radio rx y se estira en vertical hasta ry
  // Centro del óvalo: por debajo de los ojos, siguiendo la inclinación de la cara.
  const ocx = eyeX - Math.sin(angle) * MASK.down * h;
  const ocy = eyeY + Math.cos(angle) * MASK.down * h;
  // Dentro del óvalo (ya girado), los ojos están justo encima del centro.
  const fx = R;
  const fy = R - MASK.down * h;
  const P = w / (PHOTO_FACE * fit.d); // lado de la foto en pantalla
  const L = P * 1.5; // marco para girar la foto alrededor de sus ojos

  const content = (
    <View style={[StyleSheet.absoluteFill, { transform: [{ scaleY: rx / ry }] }]}>
      <View style={{ position: "absolute", left: fx - L, top: fy - L, width: 2 * L, height: 2 * L, transform: [{ rotate: `${-fit.a}rad` }] }}>
        <Image source={{ uri }} style={{ position: "absolute", width: P, height: P, left: L - fit.ex * P, top: L - fit.ey * P }} />
      </View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: skin, opacity: TINT, mixBlendMode: "color" }]} />
      {[-1, 1].map((side) => (
        <View key={side} style={{ position: "absolute", left: fx + side * 0.26 * w, top: fy + 0.22 * h }}>
          {[0.2, 0.14, 0.08].map((r) => (
            <View key={r} style={{ position: "absolute", left: -r * w, top: -r * w, width: 2 * r * w, height: 2 * r * w, borderRadius: r * w, backgroundColor: "#e6787a", opacity: 0.1 }} />
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute", left: ocx - R, top: ocy - R, width: 2 * R, height: 2 * R,
        transform: [{ rotate: `${angle}rad` }, { scaleY: ry / rx }],
        filter: "contrast(1.15) saturate(0.9) brightness(1.04)",
      }}
    >
      {RING_OPACITY.map((o, i) => {
        const r = R * (1 - (EDGE * i) / (RINGS - 1));
        return (
          <View key={i} style={{ position: "absolute", left: R - r, top: R - r, width: 2 * r, height: 2 * r, borderRadius: r, overflow: "hidden", opacity: o, isolation: "isolate" }}>
            <View style={{ position: "absolute", left: r - R, top: r - R, width: 2 * R, height: 2 * R }}>{content}</View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  faces: { position: "absolute", left: 0, right: 0, bottom: "16%", flexDirection: "row", justifyContent: "center", gap: 18 },
  face: { alignItems: "center", gap: 6, maxWidth: 110 },
  medals: { position: "absolute", left: 12, bottom: 30, flexDirection: "row", gap: 10 },
  label: { fontFamily: font.readBold, fontSize: 14, color: color.ink, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
  pending: { position: "absolute", left: 16, bottom: 14, fontFamily: font.read, fontSize: 12, color: color.ink, opacity: 0.6 },
});
