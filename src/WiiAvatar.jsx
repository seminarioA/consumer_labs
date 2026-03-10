// WiiAvatar.jsx — Mii-inspired flat avatar with dark theme
import { useState, useEffect, useRef } from "react";

// ─── Wii / Mii-style hair primitives ─────────────────────────────────────────
function HairStyle({ style, hair, hairDark }) {
  switch (style) {
    case "long":
      return (
        <>
          {/* back curtains */}
          <ellipse cx="90"  cy="260" rx="22" ry="80" fill={hair} />
          <ellipse cx="280" cy="260" rx="22" ry="80" fill={hair} />
          {/* top cap */}
          <path d="M 95 175 Q 95 68 185 60 Q 275 68 275 175 Q 250 130 185 122 Q 120 130 95 175 Z" fill={hair} />
          <path d="M 97 172 Q 95 90 185 62 Q 275 90 273 172 Q 255 140 185 133 Q 115 140 97 172 Z" fill={hairDark} opacity="0.45" />
          {/* part / highlight */}
          <path d="M 185 64 Q 188 80 185 96" stroke="rgba(255,255,255,0.15)" strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      );
    case "short":
      return (
        <>
          <path d="M 98 178 Q 96 80 185 64 Q 274 80 272 178 Q 255 138 185 128 Q 115 138 98 178 Z" fill={hair} />
          <path d="M 99 175 Q 97 85 185 66 Q 273 85 271 175 Q 255 140 185 133 Q 115 140 99 175 Z" fill={hairDark} opacity="0.4" />
          {/* side pieces */}
          <rect x="88"  y="170" width="18" height="55" rx="9" fill={hair} />
          <rect x="264" y="170" width="18" height="55" rx="9" fill={hair} />
        </>
      );
    case "bun":
      return (
        <>
          <path d="M 98 178 Q 96 80 185 64 Q 274 80 272 178 Q 255 138 185 128 Q 115 138 98 178 Z" fill={hair} />
          <path d="M 99 175 Q 97 85 185 66 Q 273 85 271 175 Q 255 140 185 133 Q 115 140 99 175 Z" fill={hairDark} opacity="0.4" />
          {/* bun */}
          <circle cx="185" cy="58" r="30" fill={hair} />
          <circle cx="185" cy="58" r="20" fill={hairDark} opacity="0.45" />
        </>
      );
    case "spiky":
      return (
        <>
          <path d="M 110 175 Q 100 100 140 72 L 148 95 L 162 60 L 170 90 L 185 50 L 200 90 L 208 60 L 222 95 L 230 72 Q 270 100 260 175 Q 245 135 185 124 Q 125 135 110 175 Z" fill={hair} />
          <path d="M 112 172 Q 102 102 142 74 L 149 94 L 163 62 L 171 90 L 185 52 L 199 90 L 207 62 L 221 94 L 228 74 Q 268 102 258 172 Q 245 137 185 127 Q 125 137 112 172 Z" fill={hairDark} opacity="0.4" />
        </>
      );
    default:
      return (
        <>
          <path d="M 98 178 Q 96 80 185 64 Q 274 80 272 178 Q 255 138 185 128 Q 115 138 98 178 Z" fill={hair} />
        </>
      );
  }
}

// ─── Outfit / body ────────────────────────────────────────────────────────────
function Body({ outfitColor, outfitDark, accentColor }) {
  return (
    <>
      {/* shirt body */}
      <path d="M 40 420 Q 75 340 120 320 L 150 308 Q 185 330 220 308 L 250 320 Q 295 340 330 420 Z" fill={outfitColor} />
      {/* collar shadow */}
      <path d="M 155 310 Q 185 340 215 310" stroke={outfitDark} strokeWidth="3" fill="none" />
      {/* sleeve highlights */}
      <path d="M 85 400 Q 96 360 122 338" stroke="rgba(255,255,255,0.10)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M 285 400 Q 274 360 248 338" stroke="rgba(255,255,255,0.10)" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* logo / accent pip */}
      <circle cx="185" cy="344" r="9" fill={outfitDark} />
      <circle cx="185" cy="344" r="5" fill={accentColor} opacity="0.85" />
    </>
  );
}

// ─── Main avatar component ────────────────────────────────────────────────────
export default function WiiAvatar({ consumer, state = "idle" }) {
  const [blink,      setBlink]      = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);
  const [headY,      setHeadY]      = useState(0);
  const [eyeOff,     setEyeOff]     = useState({ x: 0, y: 0 });

  const blinkT  = useRef();
  const mouthT  = useRef();
  const headT   = useRef();
  const eyeT    = useRef();
  const tVal    = useRef(0);

  // ── blink ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const schedule = () => {
      blinkT.current = setTimeout(() => {
        setBlink(true);
        blinkT.current = setTimeout(() => {
          setBlink(false);
          schedule();
        }, 140);
      }, 2200 + Math.random() * 3000);
    };
    schedule();
    return () => clearTimeout(blinkT.current);
  }, []);

  // ── mouth animation ────────────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(mouthT.current);
    if (state === "talking") {
      const seq = [0, 1, 2, 1, 3, 2, 0, 1, 3, 0, 2, 1];
      let i = 0;
      mouthT.current = setInterval(() => {
        setMouthPhase(seq[i++ % seq.length]);
      }, 95 + Math.random() * 45);
    } else {
      setMouthPhase(0);
    }
    return () => clearInterval(mouthT.current);
  }, [state]);

  // ── subtle head bob ────────────────────────────────────────────────────────
  useEffect(() => {
    const amp   = state === "talking" ? 2.5 : 5;
    const speed = state === "talking" ? 0.16 : 0.024;
    headT.current = setInterval(() => {
      tVal.current += speed;
      setHeadY(Math.sin(tVal.current) * amp);
    }, 40);
    return () => clearInterval(headT.current);
  }, [state]);

  // ── eye drift ─────────────────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(eyeT.current);
    if (state === "thinking") {
      setEyeOff({ x: -5, y: -6 });
      return;
    }
    if (state === "talking") {
      eyeT.current = setInterval(() => {
        setEyeOff({ x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 3 });
      }, 750);
    } else {
      setEyeOff({ x: 0, y: 0 });
      eyeT.current = setInterval(() => {
        if (Math.random() < 0.18)
          setEyeOff({ x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 2.5 });
      }, 2600);
    }
    return () => clearInterval(eyeT.current);
  }, [state]);

  const { skin, skinDark, hair, hairDark, iris, blush, lip } = consumer.palette;

  const eyelidRY  = blink ? 12 : 0;
  const browDY    = state === "thinking" ? -8 : state === "talking" ? -2 : 0;
  const isHappy   = state === "talking" || state === "happy";
  const cheekOp   = isHappy ? 0.48 : 0.22;

  // Mouth shapes
  const mouths = [
    { open: false, d: "M 162 206 Q 185 212 208 206" },
    { open: true,  d: "M 162 205 Q 185 218 208 205 Q 185 213 162 205 Z", teeth: false },
    { open: true,  d: "M 160 203 Q 185 224 210 203 Q 197 215 173 215 Z", teeth: true  },
    { open: true,  d: "M 160 200 Q 185 228 210 200 Q 197 218 173 220 Z", teeth: true  },
  ];
  const mouth = mouths[mouthPhase] || mouths[0];

  const uid = consumer.id;

  return (
    <svg viewBox="0 0 370 420" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        {/* flat skin — no gradient, just a subtle inner ellipse for volume */}
        <filter id={`drop_${uid}`}>
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#00000088" />
        </filter>
        <clipPath id={`el_${uid}`}><ellipse cx="157" cy="176" rx="18" ry="12" /></clipPath>
        <clipPath id={`er_${uid}`}><ellipse cx="213" cy="176" rx="18" ry="12" /></clipPath>
      </defs>

      {/* ── BODY (slight lag behind head) ──────────────────────────────────── */}
      <g style={{ transform: `translateY(${headY * 0.25}px)`, transition: "transform 0.1s" }}>
        <Body outfitColor={consumer.outfitColor} outfitDark={consumer.outfitDark} accentColor={consumer.accentColor} />
      </g>

      {/* ── NECK ──────────────────────────────────────────────────────────── */}
      <rect x="170" y="288" width="30" height="44" rx="10" fill={skinDark}
        style={{ transform: `translateY(${headY * 0.5}px)`, transition: "transform 0.1s" }} />

      {/* ── HEAD GROUP ─────────────────────────────────────────────────────── */}
      <g style={{ transform: `translateY(${headY}px)`, transition: "transform 0.1s" }}
         filter={`url(#drop_${uid})`}>

        {/* hair (back layer) */}
        <HairStyle style={consumer.hairStyle} hair={hair} hairDark={hairDark} />

        {/* ── FACE (flat Mii-style) ──────────────────────────────────────── */}
        {/* face base */}
        <ellipse cx="185" cy="200" rx="100" ry="112" fill={skin} />
        {/* subtle side shadow to give minimal volume */}
        <ellipse cx="150" cy="215" rx="40" ry="60" fill={skinDark} opacity="0.18" />
        <ellipse cx="220" cy="215" rx="40" ry="60" fill={skinDark} opacity="0.18" />
        {/* forehead highlight — very subtle */}
        <ellipse cx="185" cy="148" rx="52" ry="28" fill="rgba(255,255,255,0.06)" />

        {/* ── EARS ──────────────────────────────────────────────────────── */}
        <ellipse cx="86"  cy="198" rx="14" ry="18" fill={skin} />
        <ellipse cx="284" cy="198" rx="14" ry="18" fill={skin} />
        <ellipse cx="86"  cy="198" rx="7"  ry="9"  fill={skinDark} opacity="0.35" />
        <ellipse cx="284" cy="198" rx="7"  ry="9"  fill={skinDark} opacity="0.35" />
        {consumer.hasEarrings && <>
          <circle cx="86"  cy="214" r="5.5" fill={consumer.accentColor} />
          <circle cx="284" cy="214" r="5.5" fill={consumer.accentColor} />
          <circle cx="86"  cy="214" r="2.5" fill="rgba(255,255,255,0.5)" />
          <circle cx="284" cy="214" r="2.5" fill="rgba(255,255,255,0.5)" />
        </>}

        {/* ── EYEBROWS (Mii-style thick arched) ─────────────────────────── */}
        <path d={`M 136 ${162+browDY} Q 157 ${152+browDY} 177 ${158+browDY}`}
          stroke={hairDark} strokeWidth="5" fill="none" strokeLinecap="round"
          style={{ transition: "d 0.35s" }} />
        <path d={`M 193 ${158+browDY} Q 213 ${152+browDY} 234 ${162+browDY}`}
          stroke={hairDark} strokeWidth="5" fill="none" strokeLinecap="round"
          style={{ transition: "d 0.35s" }} />

        {/* ── EYES (large Mii-style) ─────────────────────────────────────── */}
        {/* whites */}
        <ellipse cx="157" cy="176" rx="18" ry="12" fill="white" />
        <ellipse cx="213" cy="176" rx="18" ry="12" fill="white" />

        {/* irises (flat color, Mii look) */}
        {[{ cx: 157, clip: `el_${uid}` }, { cx: 213, clip: `er_${uid}` }].map(({ cx, clip }) => (
          <g key={cx} clipPath={`url(#${clip})`}>
            <circle cx={cx + eyeOff.x} cy={176 + eyeOff.y} r="10"  fill={iris}
              style={{ transition: "cx 0.28s, cy 0.28s" }} />
            <circle cx={cx + eyeOff.x} cy={176 + eyeOff.y} r="5.5" fill="#050518"
              style={{ transition: "cx 0.28s, cy 0.28s" }} />
            {/* shine dot */}
            <circle cx={cx - 4 + eyeOff.x} cy={172 + eyeOff.y} r="2.2" fill="rgba(255,255,255,0.9)"
              style={{ transition: "cx 0.28s, cy 0.28s" }} />
          </g>
        ))}

        {/* eyelids */}
        <ellipse cx="157" cy="176" rx="19.5" ry={eyelidRY} fill={skin}
          style={{ transition: "ry 0.08s" }} />
        <ellipse cx="213" cy="176" rx="19.5" ry={eyelidRY} fill={skin}
          style={{ transition: "ry 0.08s" }} />

        {/* lashes — only when eyes open */}
        {!blink && [
          [141,171,138,163],[149,168,147,160],[157,167,157,159],[165,168,168,160],[173,171,176,163]
        ].map(([x1, y1, x2, y2], i) => (
          <g key={i}>
            <line x1={x1}     y1={y1} x2={x2}     y2={y2} stroke={hairDark} strokeWidth="1.8" strokeLinecap="round" />
            <line x1={370-x1} y1={y1} x2={370-x2} y2={y2} stroke={hairDark} strokeWidth="1.8" strokeLinecap="round" />
          </g>
        ))}

        {/* ── NOSE (simple Mii button) ───────────────────────────────────── */}
        <ellipse cx="185" cy="202" rx="6" ry="4" fill={skinDark} opacity="0.45" />

        {/* ── CHEEKS ────────────────────────────────────────────────────── */}
        <ellipse cx="136" cy="218" rx="22" ry="11" fill={blush} opacity={cheekOp}
          style={{ transition: "opacity 0.5s" }} />
        <ellipse cx="234" cy="218" rx="22" ry="11" fill={blush} opacity={cheekOp}
          style={{ transition: "opacity 0.5s" }} />

        {/* ── MOUTH ─────────────────────────────────────────────────────── */}
        {mouth.open ? (
          <>
            <path d={mouth.d} fill={lip} />
            {mouth.teeth && (
              <path d="M 170 210 Q 185 210 200 210 L 198 218 Q 185 219 172 218 Z"
                fill="rgba(255,255,255,0.90)" />
            )}
          </>
        ) : (
          <path d={mouth.d} fill="none" stroke={lip} strokeWidth="2.8" strokeLinecap="round" />
        )}

        {/* ── THINKING BUBBLES ──────────────────────────────────────────── */}
        {state === "thinking" && [
          { cx: 234, cy: 138, r: 6,   delay: "0s"    },
          { cx: 252, cy: 124, r: 8.5, delay: "0.25s" },
          { cx: 274, cy: 108, r: 11,  delay: "0.5s"  },
        ].map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={consumer.accentColor} opacity="0.9">
            <animate attributeName="opacity" values="0.85;0.2;0.85"
              dur="1.1s" begin={b.delay} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
    </svg>
  );
}
