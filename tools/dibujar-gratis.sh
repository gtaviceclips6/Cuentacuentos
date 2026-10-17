#!/usr/bin/env bash
# Dibuja las páginas de tools/prompts-dibujos.json con Z-Image-Turbo (gratis, Apache 2.0) en CPU,
# usando stable-diffusion.cpp. Pensado para el sandbox de Expo (Linux, 4 núcleos, 15 GB).
# Uso: bash tools/dibujar-gratis.sh [cuento1,cuento2,...]   (sin argumento: todos)
# Deja cada dibujo en ~/dibujos/<cuento>/NN.png y salta los que ya existen.
set -u
ZI=~/zi
mkdir -p "$ZI" ~/dibujos
cd "$ZI"
if [ ! -x sd/sd-cli ]; then
  curl -sSL -o sd.zip https://github.com/leejet/stable-diffusion.cpp/releases/download/master-973-f0aac52/sd-master-f0aac52-bin-Linux-Ubuntu-24.04-x86_64.zip
  unzip -oq sd.zip -d sd
fi
[ -s zimage.gguf ] || curl -sSL -o zimage.gguf https://huggingface.co/leejet/Z-Image-Turbo-GGUF/resolve/main/z_image_turbo-Q4_K.gguf
[ -s qwen.gguf ] || curl -sSL -o qwen.gguf https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf
[ "$(stat -c %s ae.safetensors 2>/dev/null || echo 0)" -gt 1000000 ] || curl -sSL -o ae.safetensors https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors

ONLY="${1:-}"
python3 - "$ONLY" <<'EOF' > ~/dibujos/cola.tsv
import json, os, sys
only = [s for s in sys.argv[1].split(",") if s]
for i, p in enumerate(json.load(open(os.path.expanduser("~/cc/tools/prompts-dibujos.json")))):
    if only and p["slug"] not in only: continue
    print(f'{p["slug"]}\t{p["n"]:02d}\t{p["prompt"]}')
EOF

while IFS=$'\t' read -r slug n prompt; do
  out=~/dibujos/$slug/$n.png
  [ -s "$out" ] && continue
  mkdir -p ~/dibujos/$slug
  echo "$(date +%H:%M) empieza $slug $n" >> ~/dibujos/progreso.log
  LD_LIBRARY_PATH=./sd ./sd/sd-cli --diffusion-model zimage.gguf --vae ae.safetensors --llm qwen.gguf \
    --cfg-scale 1.0 --steps 8 -H 768 -W 512 -t 4 --seed $((10#$n * 7 + ${#slug})) -p "$prompt" -o "$out.tmp.png" > ~/dibujos/ultimo.log 2>&1 \
    && mv "$out.tmp.png" "$out"
  echo "$(date +%H:%M) hecho $slug $n" >> ~/dibujos/progreso.log
done < ~/dibujos/cola.tsv
echo "$(date +%H:%M) FIN" >> ~/dibujos/progreso.log
