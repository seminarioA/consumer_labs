// consumers.js — default synthetic consumers + helpers

export const DEFAULT_CONSUMERS = [
  {
    id: "val",
    name: "Valentina Ríos",
    age: 28,
    occupation: "Diseñadora UX",
    type: "Early Adopter",
    segment: "Innovadores",
    emoji: "🚀",
    accentColor: "#a78bfa",
    outfitColor: "#1e0a38",
    outfitDark:  "#130520",
    hairStyle: "long",
    hasEarrings: true,
    palette: {
      skin:     "#fde8cc",
      skinDark: "#d4a878",
      hair:     "#1a0800",
      hairDark: "#0a0300",
      iris:     "#7c3aed",
      blush:    "#f472b6",
      lip:      "#c2456e",
    },
    systemPrompt: `Eres Valentina Ríos, 28 años, Diseñadora UX de Lima. Early Adopter entusiasta y tech-savvy. Te apasionan los productos innovadores y la experiencia de usuario. Hablas en español con energía, usas términos de diseño y tecnología. Responde siempre en primera persona como consumidora real: motivaciones, deseos, frustraciones, opiniones. Máximo 2-3 párrafos cortos y directos.`,
  },
  {
    id: "car",
    name: "Carlos Mendoza",
    age: 42,
    occupation: "Gerente Financiero",
    type: "Pragmático",
    segment: "Mayoría Temprana",
    emoji: "📊",
    accentColor: "#60a5fa",
    outfitColor: "#0c1e38",
    outfitDark:  "#07142a",
    hairStyle: "short",
    hasEarrings: false,
    palette: {
      skin:     "#c8845a",
      skinDark: "#a06038",
      hair:     "#180800",
      hairDark: "#0e0500",
      iris:     "#1d4ed8",
      blush:    "#b07050",
      lip:      "#8a4530",
    },
    systemPrompt: `Eres Carlos Mendoza, 42 años, Gerente Financiero de Lima. Pragmático, analítico y orientado a resultados. Evalúas ROI y valor percibido antes de cualquier compra. Hablas en español con tono profesional y directo. Responde siempre en primera persona como consumidor real: criterios de decisión, lo que te frena, lo que te convence. Máximo 2-3 párrafos cortos.`,
  },
  {
    id: "sof",
    name: "Sofía Paredes",
    age: 35,
    occupation: "Madre & Emprendedora",
    type: "Consciente",
    segment: "Verdes & Sostenibles",
    emoji: "🌿",
    accentColor: "#34d399",
    outfitColor: "#03201a",
    outfitDark:  "#021510",
    hairStyle: "bun",
    hasEarrings: true,
    palette: {
      skin:     "#f0c898",
      skinDark: "#c89860",
      hair:     "#3d1f00",
      hairDark: "#2a1400",
      iris:     "#059669",
      blush:    "#fb7185",
      lip:      "#be4d6e",
    },
    systemPrompt: `Eres Sofía Paredes, 35 años, madre y emprendedora de Lima. Consciente, empática, priorizas sostenibilidad y bienestar familiar. La autenticidad de marca y el impacto ambiental son clave para ti. Hablas en español con calidez y pasión. Responde siempre en primera persona como consumidora real: qué te mueve, qué marcas te inspiran confianza, qué barreras tienes. Máximo 2-3 párrafos cortos.`,
  },
];

// ─── Generate a consumer from document text via Phi-3 Mini ───────────────────
// Called after extracting raw text from a PDF / DOCX / XLSX
export async function buildConsumerFromDocument(rawText, ollamaUrl = "http://localhost:11434") {
  const prompt = `Analiza el siguiente texto de una entrevista o encuesta y extrae un perfil de consumidor sintético.

TEXTO:
${rawText.slice(0, 4000)}

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "name": "nombre completo inventado coherente con el perfil",
  "age": número,
  "occupation": "ocupación",
  "type": "tipo de consumidor (Early Adopter / Pragmático / Conservador / Consciente / etc.)",
  "segment": "segmento de mercado corto",
  "emoji": "un emoji representativo",
  "personality": "descripción de 2 frases de su personalidad como consumidor",
  "painPoints": ["lista", "de", "fricciones"],
  "motivations": ["lista", "de", "motivaciones"],
  "hairStyle": "long | short | bun | spiky",
  "hasEarrings": true o false,
  "gender": "female | male | neutral"
}`;

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "phi3:mini",
      prompt,
      stream: false,
      options: { temperature: 0.7, num_predict: 600 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama error ${res.status}`);
  const data = await res.json();

  // Extract JSON from the model response
  const raw     = data.response || "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("El modelo no devolvió JSON válido");
  const parsed  = JSON.parse(jsonMatch[0]);

  return buildConsumerObject(parsed);
}

// Palette presets keyed by gender / tone combination
const PALETTES = {
  female_light: {
    skin: "#fde8cc", skinDark: "#d4a878",
    hair: "#1a0800", hairDark: "#0a0300",
    iris: "#7c3aed", blush: "#f472b6", lip: "#c2456e",
  },
  female_medium: {
    skin: "#f0c898", skinDark: "#c89860",
    hair: "#3d1f00", hairDark: "#2a1400",
    iris: "#059669", blush: "#fb7185", lip: "#be4d6e",
  },
  female_dark: {
    skin: "#8b5e43", skinDark: "#6b3e28",
    hair: "#0d0400", hairDark: "#060200",
    iris: "#d97706", blush: "#e05850", lip: "#9a3050",
  },
  male_light: {
    skin: "#fcd5b0", skinDark: "#c8905a",
    hair: "#0e0500", hairDark: "#060200",
    iris: "#1d4ed8", blush: "#b87050", lip: "#884030",
  },
  male_medium: {
    skin: "#c8845a", skinDark: "#a06038",
    hair: "#180800", hairDark: "#0e0500",
    iris: "#1d4ed8", blush: "#b07050", lip: "#8a4530",
  },
  male_dark: {
    skin: "#7a4a30", skinDark: "#5a3018",
    hair: "#0a0300", hairDark: "#050100",
    iris: "#059669", blush: "#904040", lip: "#7a3020",
  },
  neutral_light: {
    skin: "#fde0c0", skinDark: "#d0a870",
    hair: "#1a0800", hairDark: "#0a0300",
    iris: "#7c3aed", blush: "#f06080", lip: "#c04060",
  },
};

const ACCENT_COLORS = ["#a78bfa","#60a5fa","#34d399","#f472b6","#fb923c","#facc15","#38bdf8","#c084fc"];
const OUTFIT_COLORS = ["#1e0a38","#0c1e38","#03201a","#1f0a1f","#1a1200","#0a1a28","#200808","#101828"];

function darkenHex(hex, amount) {
  const h = hex.replace("#", "");
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}

function buildConsumerObject(parsed) {
  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  const gender = (parsed.gender || "neutral").toLowerCase().split(" ")[0];
  const tones  = ["light", "medium", "dark"];
  const tone   = tones[Math.floor(Math.random() * tones.length)];
  const palKey = `${gender}_${tone}`;
  const palette = PALETTES[palKey] || PALETTES["neutral_light"];
  const accent  = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
  const outfit  = OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)];

  const painStr  = Array.isArray(parsed.painPoints)  ? parsed.painPoints.join(", ")  : "";
  const motivStr = Array.isArray(parsed.motivations) ? parsed.motivations.join(", ") : "";

  return {
    id,
    name:       parsed.name        || "Consumidor Sintético",
    age:        Number(parsed.age) || 30,
    occupation: parsed.occupation  || "Consumidor",
    type:       parsed.type        || "Pragmático",
    segment:    parsed.segment     || "General",
    emoji:      parsed.emoji       || "👤",
    accentColor: accent,
    outfitColor: outfit,
    outfitDark:  darkenHex(outfit, 20),
    hairStyle:   ["long","short","bun","spiky"].includes(parsed.hairStyle) ? parsed.hairStyle : "short",
    hasEarrings: Boolean(parsed.hasEarrings),
    palette,
    systemPrompt: `Eres ${parsed.name || "un consumidor"}, ${parsed.age || 30} años. ${parsed.personality || ""}
Tipo: ${parsed.type || ""}. Segmento: ${parsed.segment || ""}.
Motivaciones: ${motivStr}.
Fricciones: ${painStr}.
Responde siempre en primera persona como consumidor real, en español. Máximo 2-3 párrafos cortos.`,
    isCustom: true,
  };
}
