#!/usr/bin/env python3
"""Genera tools/prompts-dibujos.json: un prompt por página para el modelo gratuito Z-Image-Turbo.

Cada personaje lleva SIEMPRE la misma descripción (ropa fija) para que salga igual en todas las
páginas. Los personajes se describen de izquierda a derecha en el orden de «c» de tales.json,
que es el orden en que la app pega las caras (tools/caras-dibujos.py).
"""
import json, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

STYLE = ("Semi-realistic painted children's storybook illustration, gentle painterly realism with natural "
         "proportions and expressive friendly faces, soft watercolor and gouache texture, muted warm palette, "
         "not saturated, soft natural light. Full-bleed vertical page, no border, no frame. The top third of the "
         "image is calm, plain and empty background (soft wall or pale sky) with nothing in it, space for text.")
RULES = ("Faces of the main characters large, from the front or three-quarters, evenly lit, eyes and mouth clearly "
         "visible, nothing covering the faces, no glasses. Everyone fully clothed. Gentle, cosy, nothing scary, "
         "no blood. Any other people only far away and tiny. No text, no letters, no words.")

C = {
  "la-olla-magica": {
    "nina": "a girl of about seven with light brown hair in a low ponytail, red-and-white checked dress",
    "madre": "a mother in her thirties with brown hair in a low bun, cream blouse with rolled sleeves, blue apron, long cream skirt",
    "anciana": "a kind old woman with grey hair, flowered headscarf tied under the chin showing her whole face, green shawl, brown skirt",
    "alcalde": "a cheerful plump mayor with grey moustache, dark green coat, red sash, short black top hat worn high so the face is visible",
  },
  "cenicienta": {
    "cenicienta": "a kind young woman with chestnut hair in a loose braid, simple brown work dress with a patched cream apron (later in the story: an emerald-green ball gown and small glass slippers)",
    "madrastra": "a stern but not scary stepmother with dark hair in a tall bun, plum-purple dress with a high lace collar",
    "hermana1": "the elder stepsister, tall, with red curly hair, mustard-yellow dress",
    "hermana2": "the younger stepsister, short, with black straight hair and a fringe, pink striped dress",
    "hada": "a cheerful round fairy godmother with white hair in a bun, lilac hooded cape worn down, simple wooden wand",
    "principe": "a friendly young prince with short dark curly hair, dark blue jacket with silver buttons, small simple circlet",
  },
  "la-bella-durmiente": {
    "princesa": "the princess, a girl with long wavy auburn hair, mustard-yellow dress (as a baby: in a cradle with a cream blanket)",
    "rey": "a jolly king with a short brown beard, deep red robe and a small gold crown",
    "reina": "a warm queen with black hair in a low bun, teal gown and a slim gold crown",
    "hada_buena": "a calm good fairy with silver-blond hair, peach-coloured dress, small translucent wings",
    "hada_mala": "a grumpy forgotten fairy, older woman with grey hair, plain grey cape worn back from the face, wooden staff, more grumpy than evil",
    "viajero": "a young explorer with sandy hair, green travel cape, brown backpack",
  },
  "la-ratita-presumida": {
    "ratita": "an anthropomorphic little mouse girl standing upright, grey fur, big round ears, yellow checked apron, turquoise bow on her tail",
    "gallo": "an anthropomorphic proud rooster standing upright, red comb, orange and gold feathers",
    "perro": "an anthropomorphic friendly dog standing upright, long floppy brown ears, red scarf",
    "raton": "an anthropomorphic little mouse boy standing upright, brown fur, green waistcoat",
    "gato": "an anthropomorphic elegant grey cat standing upright, black bow tie, sly but friendly smile, no claws, no teeth",
  },
  "blancanieves": {
    "blancanieves": "a kind girl with short black hair, olive-green dress and brown cape",
    "reina": "a proud queen with dark red hair, deep burgundy dress and a thin silver crown",
    "cazador": "a big gentle hunter with a short brown beard, green-brown leather jerkin, no weapons visible",
    "enano_mayor": "an old dwarf with a long white beard, dark blue tunic and brown pointed cap",
    "enano_pequeno": "a young beardless dwarf with rosy cheeks, mustard-yellow pointed cap and red tunic",
    "enano_cocinero": "a round dwarf with a short ginger beard, white apron over a green tunic",
  },
  "el-mago-de-oz": {
    "dorotea": "a girl of about ten with brown hair in two low pigtails tied with white ribbons, red dress with white polka dots, silver shoes",
    "tia": "a kind farm aunt with grey hair in a bun, faded blue dress and white apron",
    "bruja_buena": "a good witch, smiling woman with white hair, white dress with tiny stars, tall pointed white hat",
    "espantapajaros": "a friendly scarecrow with a painted cloth face, blue hat, patchwork shirt, straw at the cuffs",
    "hojalata": "a rounded silver tin man with a funnel hat and a friendly visible face",
    "leon": "a big shaggy golden lion with a kind shy face",
    "mago": "a short old wizard with a grey moustache, striped waistcoat and green coat",
  },
  "alicia": {
    "alicia": "a curious girl of about eight with straight light-brown hair, mustard-yellow dress, no headband",
    "hermana": "her teenage older sister with dark brown hair in a bun, sage-green dress, reading a book",
    "conejo": "a white rabbit standing upright, red waistcoat, golden pocket watch",
    "gato": "an orange tabby cat with a huge friendly grin, slightly transparent",
    "sombrerero": "an eccentric hatter, thin man with messy red hair, bottle-green top hat, patchwork coat",
    "liebre": "a brown hare standing upright with little flowers tucked over her ears",
    "reina": "a stout loud queen with a red and white dress with small hearts and a small gold crown",
  },
  "el-raton-perez": {
    "bubi": "a small boy king of about seven with blond hair, navy-blue sailor suit, a gap in his smile (when turned into a mouse: a small brown mouse with a tiny gold crown)",
    "reina": "his mother the queen, gentle woman with dark hair, pearl-grey dress",
    "perez": "a little anthropomorphic mouse standing upright, straw hat, red satchel, round glasses NOT allowed so no glasses, big friendly eyes",
    "mama_ratona": "a plump anthropomorphic mother mouse with a white apron",
    "gato": "a striped tabby cat, comical and harmless",
    "gilito": "a poor thin boy of about seven with messy dark hair, simple long-sleeved shirt",
  },
  "la-reina-de-las-nieves": {
    "gerda": "a girl of about nine with long blond hair, navy-blue coat and red mittens",
    "kay": "a boy of about nine with short brown hair, grey coat and red scarf",
    "abuela": "a cosy grandmother with white hair, knitted lavender shawl",
    "reina": "the Snow Queen, a tall calm woman with white-blond hair, white fur coat and white fur hat, serious but not frightening",
    "bandida": "a cheeky robber girl with wild black hair, woollen hat, patched brown coat",
    "reno": "a gentle reindeer with soft brown fur and kind eyes",
  },
  "el-gigante-egoista": {
    "gigante": "a big giant with a round kind face, short grey beard, brown cape over a mustard tunic",
    "pequeno": "a small boy of about five with blond curly hair, red jumper",
    "nina": "a girl of about nine with a long brown braid down her back, blue dress",
  },
  "el-zapatero-y-los-duendes": {
    "zapatero": "an old shoemaker grandfather with a white moustache, leather apron over a cream shirt",
    "nieta": "his granddaughter, a girl of about eight with two brown braids, red dress",
    "duende1": "a tiny elf with round cheeks, patched brown clothes (later: green waistcoat and red cap)",
    "duende2": "a tiny jumpy elf with pointy ears and freckles, patched brown clothes (later: green waistcoat and red cap)",
  },
  "garbancito": {
    "garbancito": "a tiny boy the size of a chickpea, with a red beret and a white shirt, shown small next to everyday objects",
    "madre": "a Spanish village mother with dark hair, flowered headscarf, blue dress",
    "padre": "a Spanish village father with a black moustache, straw hat, white shirt and brown waistcoat",
    "tendero": "an old grocer with glasses NOT allowed so no glasses, bald head, grey shop coat",
    "buey": "a big gentle ox with soft brown fur and long lashes",
  },
  "gulliver-en-liliput": {
    "gulliver": "Gulliver, a tall friendly sailor with tied-back brown hair, blue coat with brass buttons",
    "emperador": "a tiny emperor with a purple cape and small crown",
    "nina": "a tiny Lilliputian girl with a yellow apron and dark curls",
  },
}

tales = json.load(open(os.path.join(ROOT, "src/data/tales.json")))
order = ["la-olla-magica", "cenicienta", "la-bella-durmiente", "blancanieves", "el-mago-de-oz", "alicia",
         "la-reina-de-las-nieves", "el-gigante-egoista", "el-zapatero-y-los-duendes", "garbancito",
         "el-raton-perez", "gulliver-en-liliput", "la-ratita-presumida"]
by = {t["slug"]: t for t in tales}
out = []
for slug in order:
    t = by[slug]
    for i, p in enumerate(t["pages"]):
        n = i + 1
        if slug == "la-olla-magica" and n <= 9:
            continue  # ya dibujadas
        people = [C[slug][c].replace("NOT allowed so no glasses", "") for c in p["c"]]
        who = "; ".join(f"({k+1}) {d}" for k, d in enumerate(people))
        prompt = (f"{STYLE} Scene (described in Spanish): {p['e']} "
                  f"Main characters from left to right: {who}. {RULES}")
        out.append({"slug": slug, "n": n, "prompt": prompt})

json.dump(out, open(os.path.join(ROOT, "tools/prompts-dibujos.json"), "w"), ensure_ascii=False, indent=1)
print(len(out), "páginas")
