#!/usr/bin/env bash
# Dibuja las páginas de tools/prompts-dibujos.json con Z-Image-Turbo (gratis, Apache 2.0) en CPU,
# usando stable-diffusion.cpp. Pensado para el sandbox de Expo (Linux, 4 núcleos, 15 GB).
# Uso: bash tools/dibujar-gratis.sh [cuento,cuento:N,...]   (sin argumento: todas las páginas)
# También lo lanza el flujo .eas/workflows/dibujar.yml (tareas de 3 páginas que guardan los PNG como artefactos).
# Deja cada dibujo en "$OUTDIR"/<cuento>/NN.png y salta los que ya existen.
set -u
ZI=~/zi
OUTDIR="${OUTDIR:-$PWD/dibujos}"
PROMPTS="$(cd "$(dirname "$0")" && pwd)/prompts-dibujos.json"
mkdir -p "$ZI" "$OUTDIR"
cd "$ZI"
if [ ! -x sd/sd-cli ]; then
  curl -sSL -o sd.zip https://github.com/leejet/stable-diffusion.cpp/releases/download/master-973-f0aac52/sd-master-f0aac52-bin-Linux-Ubuntu-24.04-x86_64.zip
  unzip -oq sd.zip -d sd
fi
[ -s zimage.gguf ] || curl -sSL -o zimage.gguf https://huggingface.co/leejet/Z-Image-Turbo-GGUF/resolve/main/z_image_turbo-Q4_K.gguf
[ -s qwen.gguf ] || curl -sSL -o qwen.gguf https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf
[ "$(stat -c %s ae.safetensors 2>/dev/null || echo 0)" -gt 1000000 ] || curl -sSL -o ae.safetensors https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors

ONLY="${1:-}"
python3 - "$ONLY" "$PROMPTS" <<'EOF' > "$OUTDIR/cola.tsv"
import json, sys
# Filtro: «cuento» (todas sus páginas) o «cuento:N» (una página); separados por comas.
only = [s for s in sys.argv[1].split(",") if s]
for p in json.load(open(sys.argv[2])):
    if only and p["slug"] not in only and f'{p["slug"]}:{p["n"]}' not in only: continue
    print(f'{p["slug"]}\t{p["n"]:02d}\t{p["prompt"]}')
EOF

while IFS=$'\t' read -r slug n prompt; do
  out="$OUTDIR/$slug/$n.png"
  [ -s "$out" ] && continue
  mkdir -p "$OUTDIR"/$slug
  echo "$(date +%H:%M) empieza $slug $n" >> "$OUTDIR"/progreso.log
  LD_LIBRARY_PATH=./sd ./sd/sd-cli --diffusion-model zimage.gguf --vae ae.safetensors --llm qwen.gguf \
    --cfg-scale 1.0 --steps 8 -H 768 -W 512 -t 4 --seed $((10#$n * 7 + ${#slug})) -p "$prompt" -o "$out.tmp.png" > "$OUTDIR"/ultimo.log 2>&1 \
    && mv "$out.tmp.png" "$out"
  echo "$(date +%H:%M) hecho $slug $n" >> "$OUTDIR"/progreso.log
done < "$OUTDIR"/cola.tsv
echo "$(date +%H:%M) FIN" >> "$OUTDIR"/progreso.log
