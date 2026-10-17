import { Image, StyleSheet, Text, View } from "react-native";
import type { CastMember } from "../data/tales";
import { FACE_OVAL } from "../lib/faceOval";
import { initialOf, type CastConfig } from "../state/cast";
import { color, font, hsl } from "../theme";

/** Círculo de un personaje: su foto, o su inicial si no hay foto. */
export function Face({ member, cfg, hue, size = 56 }: { member: CastMember; cfg: CastConfig; hue: number; size?: number }) {
  const role = cfg[member.id];
  const photo = role && role.mode !== "nombre" ? role.photo : null;
  const ghost = role?.mode === "nombre";
  return (
    <View
      style={[
        styles.face,
        { width: size, height: size, borderRadius: size / 2 },
        ghost ? styles.ghost : { backgroundColor: hsl(hue, 60, 80) },
      ]}
    >
      {photo ? (
        // Se acerca al óvalo de la cara (el recorte guarda algo de margen alrededor).
        <Image
          source={{ uri: photo }}
          style={{ position: "absolute", width: size / (FACE_OVAL.rx * 2), height: size / (FACE_OVAL.rx * 2), left: size / 2 - (FACE_OVAL.cx * size) / (FACE_OVAL.rx * 2), top: size / 2 - (FACE_OVAL.cy * size) / (FACE_OVAL.rx * 2) }}
        />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.42 }, ghost && { color: color.muted }]}>{initialOf(member, cfg)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  face: { overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFFFFF" },
  ghost: { backgroundColor: "transparent", borderStyle: "dashed", borderColor: color.muted, borderWidth: 2 },
  initial: { fontFamily: font.display, color: color.ink },
});
