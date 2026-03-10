// ttsService.js
// Natural TTS using ElevenLabs API with Web Speech API as fallback.
// ElevenLabs free tier: https://api.elevenlabs.io
// Set your API key in the .env file: VITE_ELEVENLABS_API_KEY=xxx

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// Voice IDs per consumer (ElevenLabs pre-made voices)
// https://api.elevenlabs.io/v1/voices
const VOICE_MAP = {
  // Spanish-speaking female voice — "Valentina"
  val: { voiceId: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", lang: "es-MX" },
  // Spanish-speaking male voice — "Carlos"
  car: { voiceId: "nPczCjzI2devNBz1zQrb", name: "Brian",    lang: "es-MX" },
  // Spanish-speaking female voice — "Sofía"
  sof: { voiceId: "cgSgspJ2msm6clMCkdW9", name: "Jessica",  lang: "es-MX" },
};

// Audio pool to allow aborting
let currentAudio = null;

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  // also stop Web Speech
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

/**
 * Speak text for a given consumer id.
 * Returns a promise that resolves when speaking finishes.
 * onStart: called right before audio begins
 * onEnd:   called when audio ends or errors
 */
export async function speak(text, consumerId, { onStart, onEnd } = {}) {
  stopSpeaking();

  // Allow runtime override from settings panel (window.__elevenKey) or env
  const apiKey = (typeof window !== "undefined" && window.__elevenKey)
    || import.meta.env.VITE_ELEVENLABS_API_KEY;

  if (apiKey && apiKey.length > 10) {
    try {
      await speakElevenLabs(text, consumerId, apiKey, { onStart, onEnd });
      return;
    } catch (err) {
      console.warn("[TTS] ElevenLabs failed, falling back to Web Speech:", err.message);
    }
  }

  // Fallback — Web Speech API with a natural-ish voice selection
  speakWebSpeech(text, consumerId, { onStart, onEnd });
}

// ─── ElevenLabs ──────────────────────────────────────────────────────────────
async function speakElevenLabs(text, consumerId, apiKey, { onStart, onEnd }) {
  const voice = VOICE_MAP[consumerId] || VOICE_MAP.val;
  const cleanText = text.replace(/\*\*/g, "").replace(/\n/g, " ").trim();

  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voice.voiceId}/stream`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: cleanText,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.82,
        style: 0.35,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${errText.slice(0, 120)}`);
  }

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;

  return new Promise((resolve) => {
    audio.addEventListener("play",  () => onStart?.(), { once: true });
    audio.addEventListener("ended", () => { URL.revokeObjectURL(url); onEnd?.(); resolve(); }, { once: true });
    audio.addEventListener("error", () => { URL.revokeObjectURL(url); onEnd?.(); resolve(); }, { once: true });
    audio.play().catch(() => { onEnd?.(); resolve(); });
  });
}

// ─── Web Speech API fallback ──────────────────────────────────────────────────
function speakWebSpeech(text, consumerId, { onStart, onEnd }) {
  if (!window.speechSynthesis) { onEnd?.(); return; }

  const cleanText = text.replace(/\*\*/g, "").replace(/\n/g, " ").trim();
  const utter = new SpeechSynthesisUtterance(cleanText);
  utter.lang = "es-419";
  utter.rate  = 1.0;
  utter.pitch = consumerId === "car" ? 0.85 : 1.08;

  // pick best available voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang.startsWith("es") && (v.name.includes("Google") || v.name.includes("Microsoft"))
  ) || voices.find(v => v.lang.startsWith("es"));
  if (preferred) utter.voice = preferred;

  utter.onstart  = () => onStart?.();
  utter.onend    = () => onEnd?.();
  utter.onerror  = () => onEnd?.();

  window.speechSynthesis.speak(utter);
}
