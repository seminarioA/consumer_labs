// ConsumerCreator.jsx — modal to create a synthetic consumer from documents
import { useState, useRef } from "react";
import { extractTextFromFile } from "./documentParser.js";
import { buildConsumerFromDocument } from "./consumers.js";

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv";

export default function ConsumerCreator({ ollamaUrl, onCreated, onClose }) {
  const [files,   setFiles]   = useState([]);
  const [status,  setStatus]  = useState("idle"); // idle | extracting | generating | done | error
  const [message, setMessage] = useState("");
  const fileRef = useRef();

  const handleFiles = e => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setStatus("idle");
    setMessage("");
  };

  const handleDrop = e => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files || []).filter(f =>
      /\.(pdf|docx?|xlsx?|csv)$/i.test(f.name)
    );
    setFiles(list);
    setStatus("idle");
    setMessage("");
  };

  const process = async () => {
    if (!files.length) return;
    try {
      setStatus("extracting");
      setMessage("Extrayendo texto de los archivos…");

      const texts = await Promise.all(files.map(f => extractTextFromFile(f)));
      const combined = texts.join("\n\n---\n\n").slice(0, 6000);

      setStatus("generating");
      setMessage("Analizando perfil con Phi-3 Mini…");

      const consumer = await buildConsumerFromDocument(combined, ollamaUrl);

      setStatus("done");
      setMessage(`¡Perfil creado: ${consumer.name}!`);
      setTimeout(() => { onCreated(consumer); onClose(); }, 1200);
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Error desconocido");
    }
  };

  const busy = status === "extracting" || status === "generating";

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
        borderRadius: 24,
        padding: "32px 28px",
        width: "100%", maxWidth: 480,
        color: "#e8e8f0",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "#1e0a38",
            border: "1px solid #a78bfa44",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>🧬</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Nuevo Consumidor Sintético</div>
            <div style={{ fontSize: 11, color: "#7a7a9a" }}>Carga entrevistas o encuestas para generar un perfil</div>
          </div>
          <button onClick={onClose} style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "#7a7a9a", cursor: "pointer", fontSize: 20, lineHeight: 1,
          }}>×</button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${files.length ? "#a78bfa66" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 16,
            padding: "28px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: files.length ? "#a78bfa0a" : "transparent",
            transition: "all 0.2s",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {files.length ? "📄" : "📂"}
          </div>
          {files.length ? (
            <div>
              {files.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, marginBottom: 2 }}>
                  {f.name}
                </div>
              ))}
              <div style={{ fontSize: 11, color: "#7a7a9a", marginTop: 6 }}>
                Haz clic para cambiar archivos
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                Arrastra archivos aquí
              </div>
              <div style={{ fontSize: 12, color: "#7a7a9a" }}>
                PDF, Word (.docx), Excel (.xlsx) — entrevistas, encuestas, transcripciones
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            style={{ display: "none" }}
            onChange={handleFiles}
          />
        </div>

        {/* Status message */}
        {message && (
          <div style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: status === "error"  ? "#3a0a0a" :
                        status === "done"   ? "#0a2a1a" : "#0a0a1e",
            border: `1px solid ${
              status === "error" ? "#f8717144" :
              status === "done"  ? "#34d39944" : "#a78bfa33"
            }`,
            fontSize: 12,
            color: status === "error" ? "#f87171" :
                   status === "done"  ? "#34d399"  : "#a78bfa",
            marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {busy && (
              <span style={{
                width: 14, height: 14, borderRadius: "50%",
                border: "2px solid #a78bfa44",
                borderTopColor: "#a78bfa",
                display: "inline-block",
                animation: "spin 0.8s linear infinite",
                flexShrink: 0,
              }} />
            )}
            {message}
          </div>
        )}

        {/* Ollama notice */}
        <div style={{
          padding: "8px 12px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          fontSize: 11, color: "#7a7a9a", marginBottom: 20,
        }}>
          Requiere <strong style={{ color: "#60a5fa" }}>Ollama + phi3:mini</strong> corriendo en <code style={{ color: "#a78bfa" }}>{ollamaUrl}</code>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            className="btn-wii"
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              color: "#7a7a9a", fontSize: 14,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={process}
            disabled={!files.length || busy}
            className="btn-wii"
            style={{
              flex: 2, padding: "11px 0", borderRadius: 12,
              background: files.length && !busy ? "#a78bfa" : "rgba(255,255,255,0.08)",
              color: files.length && !busy ? "#fff" : "#7a7a9a",
              fontSize: 14, fontWeight: 700,
            }}
          >
            {busy ? "Procesando…" : "Generar Perfil"}
          </button>
        </div>
      </div>
    </div>
  );
}
