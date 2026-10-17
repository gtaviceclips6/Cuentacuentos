#!/usr/bin/env python3
"""Busca las caras en cada ilustración (assets/tales/<cuento>/NN.jpg) y genera src/data/faceSlots.json.

La app pega ahí la cara de la foto de cada papel. Las caras se ordenan de izquierda a derecha y se
asignan a los personajes de la página en el orden de «c» en tales.json (al dibujar, describe a los
personajes en ese mismo orden, de izquierda a derecha). Usa YuNet (OpenCV, licencia MIT).

Uso: python3 tools/caras-dibujos.py
"""
import glob, json, os
import cv2

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
MODEL = os.path.join(ROOT, "tools", "yunet.onnx")
tales = {t["slug"]: t for t in json.load(open(os.path.join(ROOT, "src/data/tales.json")))}
out, avisos = {}, []

for d in sorted(glob.glob(os.path.join(ROOT, "assets/tales/*"))):
    slug = os.path.basename(d)
    if slug not in tales:
        continue
    for f in sorted(glob.glob(d + "/*.jpg")):
        n = int(os.path.basename(f).split(".")[0])
        img = cv2.imread(f)
        h, w = img.shape[:2]
        det = cv2.FaceDetectorYN.create(MODEL, "", (w, h), 0.6, 0.3, 5000)
        _, faces = det.detect(img)
        found = []
        for fc in faces if faces is not None else []:
            if fc[2] / w < 0.06:
                continue  # caras pequeñas del fondo: no se cambian
            found.append({"x": round(float(fc[0] / w), 4), "y": round(float(fc[1] / h), 4),
                          "w": round(float(fc[2] / w), 4), "h": round(float(fc[3] / h), 4)})
        found.sort(key=lambda r: r["x"])
        cast = tales[slug]["pages"][n - 1]["c"] if n <= len(tales[slug]["pages"]) else []
        if len(found) != len(cast):
            avisos.append(f"{slug} pág {n}: {len(found)} caras en el dibujo, {len(cast)} en la ficha")
        out.setdefault(slug, {})[str(n)] = [dict(id=cid, **box) for cid, box in zip(cast, found)]

json.dump(out, open(os.path.join(ROOT, "src/data/faceSlots.json"), "w"), ensure_ascii=False, indent=1)
print(f"Caras: {sum(len(v) for p in out.values() for v in p.values())} en {sum(len(p) for p in out.values())} páginas.")
for a in avisos:
    print("AVISO:", a)
