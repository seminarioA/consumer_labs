// SettingsPanel.jsx — configure Ollama URL and ElevenLabs key
import { useState } from "react";

export default function SettingsPanel({ settings, onSave, onClose }) {
  const [ollamaUrl, setOllamaUrl]     = useState(settings.ollamaUrl  || "http://localhost:11434");
  const [elevenKey, setElevenKey]     = useState(settings.elevenKey  || "");
  const [ttsEnabled, setTtsEnabled]  = useState(settings.ttsEnabled !== false);

  const save = () => {
    onSave({ ollamaUrl: ollamaUrl.trim(), elevenKey: elevenKey.trim(), ttsEnabled });
    onClose();
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px",
    background: "#0a0a14",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    color: "#e8e8f0", fontSize: 13,
    fontFamily: "inherit",
  };
  const labelStyle = { fontSize: 11, color: "#7a7a9a", fontWeight: 600, marginBottom: 5, display: "block" };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.78)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0f0f1a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, padding: "32px 28px",
        width: "100%", maxWidth: 440,
        color: "#e8e8f0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "#0c1e38", border: "1px solid #60a5fa44",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>⚙️</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Configuración</div>
          <button onClick={onClose} style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "#7a7a9a", cursor: "pointer", fontSize: 20,
          }}>×</button>
        </div>

        {/* Ollama */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "#60a5fa" }}>
            🦙 Ollama / Phi-3 Mini
          </div>
          <label style={labelStyle}>URL del servidor Ollama</label>
          <input value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} style={inputStyle}
            placeholder="http://localhost:11434" />
          <div style={{ fontSize: 10, color: "#3a3a5a", marginTop: 5 }}>
            Asegúrate de tener <code style={{color:"#a78bfa"}}>ollama run phi3:mini</code> activo
          </div>
        </div>

        {/* ElevenLabs */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "#a78bfa" }}>
            🎙 ElevenLabs TTS (voces naturales)
          </div>
          <label style={labelStyle}>API Key (opcional — Web Speech como fallback)</label>
          <input value={elevenKey} onChange={e => setElevenKey(e.target.value)} style={inputStyle}
            type="password" placeholder="sk-..." />
          <div style={{ fontSize: 10, color: "#3a3a5a", marginTop: 5 }}>
            Obtén una clave gratis en elevenlabs.io · usa el plan gratuito (10.000 chars/mes)
          </div>
        </div>

        {/* TTS toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <button
            onClick={() => setTtsEnabled(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12,
              background: ttsEnabled ? "#a78bfa" : "rgba(255,255,255,0.1)",
              border: "none", cursor: "pointer", position: "relative",
              transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: 3,
              left: ttsEnabled ? 22 : 2,
              width: 18, height: 18, borderRadius: "50%",
              background: "white", transition: "left 0.2s",
            }} />
          </button>
          <span style={{ fontSize: 13, color: "#e8e8f0" }}>Voz activada</span>
        </div>

        <button onClick={save} className="btn-wii" style={{
          width: "100%", padding: "12px 0", borderRadius: 12,
          background: "#a78bfa", color: "#fff", fontSize: 14, fontWeight: 700,
        }}>
          Guardar
        </button>
      </div>
    </div>
  );
}
