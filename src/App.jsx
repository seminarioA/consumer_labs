// App.jsx — Consumer Labs · Phi-3 Mini · ElevenLabs TTS · dark Wii theme
import { useState, useEffect, useRef, useCallback } from "react";
import WiiAvatar        from "./WiiAvatar.jsx";
import ConsumerCreator  from "./ConsumerCreator.jsx";
import SettingsPanel    from "./SettingsPanel.jsx";
import { DEFAULT_CONSUMERS } from "./consumers.js";
import { speak, stopSpeaking } from "./ttsService.js";

// ─── Safe text renderer ────────────────────────────────────────────────────────
function RichText({ text }) {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/).map((s, j) =>
        s.startsWith("**") && s.endsWith("**")
          ? <strong key={j}>{s.slice(2, -2)}</strong>
          : s
      )}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

// ─── Initial greeting per consumer ────────────────────────────────────────────
function greeting(c) {
  if (c.isCustom)
    return `¡Hola! Soy ${c.name} ${c.emoji}. Puedes preguntarme sobre mis hábitos, opiniones y experiencias como consumidor.`;
  const greetings = {
    val: "¡Hola! Soy Valentina 👋 Pregúntame sobre mis hábitos de compra, qué me motiva, qué marcas me encantan o cómo tomo decisiones. ¡Soy toda tuya!",
    car: "Buenos días. Soy Carlos. Si quieres entender cómo evalúo productos, qué me convence y qué no, aquí estoy. Prefiero respuestas directas.",
    sof: "¡Hola! Soy Sofía 🌿 Puedo contarte qué marcas me generan confianza, cómo equilibro el presupuesto familiar con la sostenibilidad y mucho más.",
  };
  return greetings[c.id] || `¡Hola! Soy ${c.name} ${c.emoji}. ¿En qué puedo ayudarte?`;
}

function mkChats(consumers) {
  return Object.fromEntries(consumers.map(c => [c.id, [{ role: "assistant", text: greeting(c) }]]));
}

// ─── Call Ollama / Phi-3 Mini ─────────────────────────────────────────────────
async function callPhi3(systemPrompt, history, ollamaUrl) {
  // Convert simple role/text history into Phi-3 prompt format
  // Phi-3 uses <|user|> / <|assistant|> / <|system|> tokens
  let prompt = `<|system|>\n${systemPrompt}<|end|>\n`;
  for (const m of history) {
    if (m.role === "user")
      prompt += `<|user|>\n${m.text}<|end|>\n`;
    else
      prompt += `<|assistant|>\n${m.text}<|end|>\n`;
  }
  prompt += "<|assistant|>\n";

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "phi3:mini",
      prompt,
      stream: false,
      options: {
        temperature: 0.75,
        top_p: 0.9,
        num_predict: 450,
        stop: ["<|end|>", "<|user|>", "<|system|>"],
      },
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  return (data.response || "No pude generar una respuesta.").trim();
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [consumers,  setConsumers]  = useState(DEFAULT_CONSUMERS);
  const [activeId,   setActiveId]   = useState(DEFAULT_CONSUMERS[0].id);
  const [chats,      setChats]      = useState(() => mkChats(DEFAULT_CONSUMERS));
  const [avStates,   setAvStates]   = useState(() =>
    Object.fromEntries(DEFAULT_CONSUMERS.map(c => [c.id, "idle"]))
  );
  const [input,      setInput]      = useState("");
  const [sidebar,    setSidebar]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [settings,   setSettings]  = useState({
    ollamaUrl:  "http://localhost:11434",
    elevenKey:  import.meta.env.VITE_ELEVENLABS_API_KEY || "",
    ttsEnabled: true,
  });

  const bottomRef = useRef();
  const talkTimer = useRef();

  const consumer = consumers.find(c => c.id === activeId) || consumers[0];
  const msgs     = chats[activeId]      || [];
  const avState  = avStates[activeId]   || "idle";

  // auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, activeId]);

  // stop speaking when switching consumer
  useEffect(() => { stopSpeaking(); }, [activeId]);

  const setAvState = useCallback((id, s) => {
    setAvStates(p => ({ ...p, [id]: s }));
  }, []);

  // ── send message ────────────────────────────────────────────────────────────
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || avState === "thinking") return;
    setInput("");

    const history = [...(chats[activeId] || []), { role: "user", text }];
    setChats(p => ({ ...p, [activeId]: history }));
    setAvState(activeId, "thinking");
    stopSpeaking();

    try {
      const reply = await callPhi3(consumer.systemPrompt, history, settings.ollamaUrl);

      // sanitize: strip Phi-3 stop tokens that may leak
      const clean = reply.replace(/<\|[^|]+\|>/g, "").trim();

      setChats(p => ({ ...p, [activeId]: [...history, { role: "assistant", text: clean }] }));
      setAvState(activeId, "talking");

      // speak
      if (settings.ttsEnabled) {
        await speak(clean, activeId, settings.elevenKey, {
          onStart: () => setAvState(activeId, "talking"),
          onEnd:   () => setAvState(activeId, "idle"),
        });
      } else {
        // just animate the avatar for a reasonable duration then reset
        clearTimeout(talkTimer.current);
        const duration = Math.min(Math.max(clean.length * 30, 2500), 9000);
        talkTimer.current = setTimeout(() => setAvState(activeId, "idle"), duration);
      }
    } catch (err) {
      const errMsg = err.message?.includes("fetch")
        ? "No pude conectarme con Ollama. ¿Está corriendo `ollama run phi3:mini`?"
        : "Tuve un problema al generar la respuesta. ¿Lo intentamos de nuevo?";
      setChats(p => ({ ...p, [activeId]: [...history, { role: "assistant", text: errMsg }] }));
      setAvState(activeId, "idle");
    }
  }, [input, chats, activeId, avState, consumer, settings, setAvState]);

  const onKey = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── add custom consumer ─────────────────────────────────────────────────────
  const addConsumer = useCallback(c => {
    setConsumers(prev => [...prev, c]);
    setChats(prev  => ({ ...prev, [c.id]: [{ role: "assistant", text: greeting(c) }] }));
    setAvStates(prev => ({ ...prev, [c.id]: "idle" }));
    setActiveId(c.id);
  }, []);

  // ── remove custom consumer ──────────────────────────────────────────────────
  const removeConsumer = useCallback(id => {
    setConsumers(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeId === id) setActiveId(next[0]?.id);
      return next;
    });
    setChats(p => { const n = { ...p }; delete n[id]; return n; });
    setAvStates(p => { const n = { ...p }; delete n[id]; return n; });
  }, [activeId]);

  // ── color helpers ───────────────────────────────────────────────────────────
  const stateColors = { idle: "#34d399", thinking: "#f59e0b", talking: consumer.accentColor };
  const stateLabels = { idle: "En espera", thinking: "Pensando…", talking: "Hablando…" };

  return (
    <div style={{
      display: "flex", height: "100vh",
      background: "#0a0a0f",
      fontFamily: "'Inter', sans-serif",
      color: "#e8e8f0",
      overflow: "hidden",
    }}>

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      {sidebar && (
        <aside style={{
          width: 252, flexShrink: 0,
          background: "#0f0f1a",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* brand */}
          <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "#1e0a38",
                border: "1px solid #a78bfa44",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>🧬</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>Consumer Labs</div>
                <div style={{ fontSize: 9, color: "#3a3a5a", letterSpacing: 1 }}>SYNTHETIC PROFILES</div>
              </div>
              <button
                onClick={() => setShowConfig(true)}
                title="Configuración"
                style={{
                  marginLeft: "auto", background: "none", border: "none",
                  color: "#3a3a5a", cursor: "pointer", fontSize: 16,
                }}>⚙️</button>
            </div>
          </div>

          {/* profile list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px 6px" }}>
            <div style={{
              fontSize: 9, fontWeight: 800, color: "#3a3a5a",
              letterSpacing: 2, textTransform: "uppercase",
              padding: "0 8px", marginBottom: 8,
            }}>Perfiles Sintéticos</div>

            {consumers.map(c => {
              const s        = avStates[c.id] || "idle";
              const isActive = activeId === c.id;
              const dotColor = s === "idle" ? "#34d399" : s === "thinking" ? "#f59e0b" : c.accentColor;
              return (
                <div
                  key={c.id}
                  className="citem"
                  onClick={() => setActiveId(c.id)}
                  style={{
                    padding: "10px 10px",
                    borderRadius: 14,
                    marginBottom: 3,
                    background: isActive ? `${c.accentColor}18` : "transparent",
                    border: `1px solid ${isActive ? c.accentColor + "44" : "transparent"}`,
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  {/* mini wii avatar preview */}
                  <div style={{
                    width: 42, height: 42, flexShrink: 0,
                    border: `2px solid ${isActive ? c.accentColor + "88" : "rgba(255,255,255,0.10)"}`,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#0a0a14",
                    position: "relative",
                  }}>
                    <WiiAvatar consumer={c} state={s} key={`mini_${c.id}_${s}`} />
                    <div style={{
                      position: "absolute", bottom: 2, right: 2,
                      width: 9, height: 9, borderRadius: "50%",
                      background: dotColor,
                      border: "2px solid #0f0f1a",
                      transition: "background 0.35s",
                    }} />
                  </div>
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    <div style={{
                      fontWeight: 700, fontSize: 12,
                      color: isActive ? "#fff" : "#7a7a9a",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: isActive ? c.accentColor : "#3a3a5a", fontWeight: 600 }}>
                      {c.emoji} {c.type}
                    </div>
                  </div>
                  {c.isCustom && (
                    <button
                      onClick={e => { e.stopPropagation(); removeConsumer(c.id); }}
                      title="Eliminar"
                      style={{
                        background: "none", border: "none",
                        color: "#3a3a5a", cursor: "pointer",
                        fontSize: 14, lineHeight: 1, flexShrink: 0,
                        padding: 2,
                      }}>×</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* add consumer button */}
          <div style={{ padding: "10px 10px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-wii"
              style={{
                width: "100%", padding: "10px 0", borderRadius: 12,
                background: "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.25)",
                color: "#a78bfa", fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}
            >
              <span style={{ fontSize: 15 }}>+</span> Nuevo Perfil
            </button>
            <div style={{ fontSize: 10, color: "#3a3a5a", textAlign: "center", marginTop: 8 }}>
              Desde PDF · Word · Excel
            </div>
          </div>
        </aside>
      )}

      {/* ── MAIN AREA ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOP BAR */}
        <header style={{
          padding: "10px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 10,
          background: "#0a0a0f",
          flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebar(o => !o)}
            style={{ background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", fontSize: 18 }}
          >☰</button>

          <div style={{
            width: 32, height: 32,
            border: `2px solid ${consumer.accentColor}66`,
            borderRadius: "50%", overflow: "hidden",
            background: "#0a0a14", flexShrink: 0,
          }}>
            <WiiAvatar consumer={consumer} state={avState} key={`bar_${activeId}`} />
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{consumer.name}</div>
            <div style={{ fontSize: 10, color: "#3a3a5a" }}>
              {consumer.age} años · {consumer.occupation} · {consumer.segment}
            </div>
          </div>

          {/* state badge */}
          <div style={{
            marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 6,
            background: `${stateColors[avState]}14`,
            border: `1px solid ${stateColors[avState]}44`,
            padding: "4px 12px", borderRadius: 99,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: stateColors[avState],
              animation: avState === "thinking" ? "pulse 1s infinite" : "none",
            }} />
            <span style={{ fontSize: 11, color: stateColors[avState], fontWeight: 700 }}>
              {stateLabels[avState]}
            </span>
          </div>

          {/* TTS toggle */}
          <button
            onClick={() => setSettings(s => ({ ...s, ttsEnabled: !s.ttsEnabled }))}
            title={settings.ttsEnabled ? "Silenciar voz" : "Activar voz"}
            style={{
              background: settings.ttsEnabled ? `${consumer.accentColor}22` : "rgba(255,255,255,0.05)",
              border: `1px solid ${settings.ttsEnabled ? consumer.accentColor + "55" : "rgba(255,255,255,0.08)"}`,
              color: settings.ttsEnabled ? consumer.accentColor : "#3a3a5a",
              borderRadius: 8, width: 32, height: 32,
              cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >{settings.ttsEnabled ? "🔊" : "🔇"}</button>
        </header>

        {/* CONTENT */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* AVATAR PANEL */}
          <div style={{
            width: 290, flexShrink: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "12px 6px 20px",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            background: "#0a0a0f",
            position: "relative", overflow: "hidden",
          }}>
            {/* ambient ring — flat, no gradient */}
            <div style={{
              position: "absolute", top: "38%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 220, height: 220, borderRadius: "50%",
              border: `1px solid ${consumer.accentColor}22`,
              pointerEvents: "none", transition: "border-color 0.8s",
            }} />
            <div style={{
              position: "absolute", top: "38%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 170, height: 170, borderRadius: "50%",
              border: `1px solid ${consumer.accentColor}14`,
              pointerEvents: "none",
            }} />

            {/* avatar */}
            <div style={{ width: 250, height: 290, position: "relative", zIndex: 1 }}>
              <WiiAvatar consumer={consumer} state={avState} key={`main_${activeId}`} />
            </div>

            {/* name */}
            <div style={{ textAlign: "center", zIndex: 1, marginTop: 4 }}>
              <div style={{ fontWeight: 900, fontSize: 17, color: consumer.accentColor }}>
                {consumer.name}
              </div>
              <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 2 }}>
                {consumer.occupation} · {consumer.segment}
              </div>
            </div>

            {/* state pills */}
            <div style={{ marginTop: 14, display: "flex", gap: 5, zIndex: 1 }}>
              {[
                { s: "idle",     l: "😊 Idle"     },
                { s: "thinking", l: "🤔 Pensando" },
                { s: "talking",  l: "🗣 Hablando"  },
              ].map(e => (
                <div key={e.s} style={{
                  padding: "3px 9px", borderRadius: 99,
                  fontSize: 9, fontWeight: 700,
                  background: avState === e.s
                    ? `${consumer.accentColor}28`
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${avState === e.s
                    ? consumer.accentColor + "55"
                    : "rgba(255,255,255,0.06)"}`,
                  color: avState === e.s ? consumer.accentColor : "#3a3a5a",
                  transition: "all 0.3s",
                }}>{e.l}</div>
              ))}
            </div>

            {/* clear chat */}
            <button
              onClick={() => setChats(p => ({ ...p, [activeId]: [{ role: "assistant", text: greeting(consumer) }] }))}
              style={{
                marginTop: 16, background: "none",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8, padding: "4px 12px",
                color: "#3a3a5a", fontSize: 10, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >Limpiar chat</button>
          </div>

          {/* CHAT */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className="msg"
                  style={{
                    display: "flex", gap: 9,
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                  }}
                >
                  {m.role === "assistant" && (
                    <div style={{
                      width: 28, height: 28, flexShrink: 0,
                      border: `2px solid ${consumer.accentColor}55`,
                      borderRadius: "50%", overflow: "hidden",
                      background: "#0a0a14",
                    }}>
                      <WiiAvatar consumer={consumer} state="idle" key={`cm_${i}`} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: "70%",
                    background: m.role === "user"
                      ? consumer.accentColor + "22"
                      : "rgba(255,255,255,0.05)",
                    border: `1px solid ${m.role === "user"
                      ? consumer.accentColor + "44"
                      : "rgba(255,255,255,0.08)"}`,
                    borderRadius: m.role === "user"
                      ? "18px 18px 5px 18px"
                      : "5px 18px 18px 18px",
                    padding: "10px 14px",
                    fontSize: 13, lineHeight: 1.75,
                    color: "#e2e8f0",
                  }}>
                    <RichText text={m.text} />
                  </div>
                  {m.role === "user" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, flexShrink: 0,
                    }}>👤</div>
                  )}
                </div>
              ))}

              {/* thinking dots */}
              {avState === "thinking" && (
                <div className="msg" style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
                  <div style={{
                    width: 28, height: 28, flexShrink: 0,
                    border: `2px solid ${consumer.accentColor}55`,
                    borderRadius: "50%", overflow: "hidden",
                    background: "#0a0a14",
                  }}>
                    <WiiAvatar consumer={consumer} state="thinking" key="thinking_msg" />
                  </div>
                  <div style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "5px 18px 18px 18px",
                    padding: "14px 18px",
                    display: "flex", gap: 5, alignItems: "center",
                  }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: consumer.accentColor,
                        animation: `blink-dot 1.3s ease ${j * 0.18}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* input */}
            <div style={{
              padding: "10px 18px 14px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              background: "#0a0a0f",
            }}>
              <div style={{
                display: "flex", gap: 9, alignItems: "flex-end",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 14, padding: "9px 10px",
              }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder={`Pregúntale algo a ${consumer.name.split(" ")[0]}…`}
                  rows={1}
                  style={{
                    flex: 1, background: "none", border: "none",
                    color: "#e2e8f0", fontSize: 13, lineHeight: 1.6,
                    maxHeight: 100, overflowY: "auto",
                  }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || avState === "thinking"}
                  className="btn-wii"
                  style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: input.trim() && avState !== "thinking"
                      ? consumer.accentColor
                      : "rgba(255,255,255,0.06)",
                    color: "white", fontSize: 17,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: input.trim() && avState !== "thinking" ? 1 : 0.35,
                    transition: "all 0.18s",
                  }}
                >↑</button>
              </div>
              <div style={{ textAlign: "center", fontSize: 10, color: "#3a3a5a", marginTop: 5 }}>
                Enter para enviar · Shift+Enter nueva línea
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showCreate && (
        <ConsumerCreator
          ollamaUrl={settings.ollamaUrl}
          onCreated={addConsumer}
          onClose={() => setShowCreate(false)}
        />
      )}
      {showConfig && (
        <SettingsPanel
          settings={settings}
          onSave={s => setSettings(prev => ({ ...prev, ...s }))}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}
