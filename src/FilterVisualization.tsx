import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";

type FlowDirection = "left-to-right" | "right-to-left";

const STAGES = [
  { label: "Assembled · idle", duration: 2 },
  { label: "Water enters", duration: 3 },
  { label: "Housing fills", duration: 5 },
  { label: "Cartridge motion · illustrative", duration: 5 },
  { label: "Water exits · outlet", duration: 4 },
  { label: "Cartridge access · exploded", duration: 4 },
  { label: "Return to assembled view", duration: 3 },
] as const;
const CYCLE_DURATION = STAGES.reduce((total, stage) => total + stage.duration, 0);

const COMPONENTS: Record<string, { title: string; description: string }> = {
  inlet: { title: "Inlet connection", description: "Carries incoming water into the filter head. The actual inlet side and flow arrow depend on the installed head." },
  head: { title: "Filter head and cap", description: "Connects the plumbing to the housing and holds the replaceable cartridge assembly." },
  housing: { title: "Filter housing", description: "Encloses and supports the cartridge. The proportions are illustrative of a common 10 × 4.5 in cartridge format, not a confirmed model." },
  cartridge: { title: "Replaceable filter cartridge", description: "Provides the filtration medium. Media type and internal flow path are intentionally unspecified because the exact cartridge is unconfirmed." },
  outlet: { title: "Outlet connection", description: "Carries water away from the housing toward a downstream sample point or plumbing." },
  sample: { title: "Water sample", description: "A separate sample is presented to the sensors. The sensors measure selected parameters; they do not control the filter." },
  ph: { title: "pH sensor", description: "Measures a signal used to determine acidity or alkalinity after calibration with appropriate buffer solutions." },
  tds: { title: "TDS sensor", description: "Measures an electrical property used to estimate dissolved-solids concentration after calibration and temperature compensation." },
  turbidity: { title: "Turbidity sensor", description: "Measures an optical signal related to water cloudiness. A sensor-specific calibration is needed for quantitative results." },
  esp32: { title: "ESP32", description: "Reads sensor signals and updates the OLED and Serial Monitor. It is not shown controlling the filter." },
  oled: { title: "128 × 64 I²C OLED", description: "Displays values sent by the ESP32. This project firmware displays raw and estimated voltage values, not calibrated pH, TDS or turbidity." },
  serial: { title: "Serial Monitor", description: "Receives diagnostic text from the ESP32 over USB serial." },
};

function getStage(elapsed: number) {
  let timeInStage = elapsed;
  for (let index = 0; index < STAGES.length; index += 1) {
    if (timeInStage < STAGES[index].duration) return { index, progress: timeInStage / STAGES[index].duration };
    timeInStage -= STAGES[index].duration;
  }
  return { index: 0, progress: 0 };
}

function FilterVisualization() {
  const reduceMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [cutaway, setCutaway] = useState(false);
  const [explodedOverride, setExplodedOverride] = useState<boolean | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [waterFlow, setWaterFlow] = useState(true);
  const [direction, setDirection] = useState<FlowDirection>("left-to-right");
  const [selected, setSelected] = useState("cartridge");
  const stage = getStage(elapsed);
  const isExploded = explodedOverride ?? stage.index === 5;
  const info = COMPONENTS[selected];
  const fillLevel = [
    0.04,
    0.04 + stage.progress * 0.24,
    0.28 + stage.progress * 0.67,
    0.95,
    0.95 - stage.progress * 0.12,
    0.83,
    0.83 + stage.progress * 0.12,
  ][stage.index];
  const waterTop = 422 - fillLevel * 180;
  const incoming = waterFlow && [1, 2, 3].includes(stage.index);
  const outgoing = waterFlow && stage.index === 4;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setElapsed((time) => (time + 0.1 * speed) % CYCLE_DURATION);
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, speed]);

  const reset = () => {
    setPlaying(false);
    setElapsed(0);
    setExplodedOverride(null);
  };
  const selectPart = (part: string) => setSelected(part);
  const keySelectPart = (event: React.KeyboardEvent<SVGGElement>, part: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectPart(part);
    }
  };
  const flowClass = `filter-flow-path ${direction === "right-to-left" ? "reverse" : ""}`;
  const particleClass = `filter-water-dot ${direction === "right-to-left" ? "reverse" : ""}`;

  return (
    <section id="filter" className="max-w-6xl mx-auto px-4 py-14">
      <h2 className="text-2xl md:text-3xl font-semibold text-white">Whole-house filter visualization</h2>
      <p className="text-slate-400 mt-2 max-w-3xl">
        A generic, replaceable-cartridge housing is shown as the physical water-treatment stage. Cartridge media and internal flow path vary by model; the illustration does not claim complete contaminant removal or drinking-water safety.
      </p>

      <div className="mt-6 grid lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.8fr)] gap-4">
        <div className="glass p-3 md:p-4 min-w-0">
          <div className="filter-visual-stage flex items-center justify-between gap-3 px-2 py-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">Filter assembly</p>
              <p className="text-sm text-white font-medium" aria-live="polite">{STAGES[stage.index].label}</p>
            </div>
            <span className="text-xs text-slate-400 tabular-nums">{Math.round(stage.progress * 100)}%</span>
          </div>

          <svg
            className={`filter-assembly w-full ${waterFlow && playing ? "flow-active" : ""} ${cutaway ? "cutaway" : ""} ${isExploded ? "exploded" : ""}`}
            viewBox="0 0 960 500"
            role="group"
            aria-label={`Whole-house cartridge filter housing, ${direction === "left-to-right" ? "left-to-right" : "right-to-left"} conceptual flow, ${cutaway ? "cutaway" : "assembled"} view`}
          >
            <defs>
              <linearGradient id="filterMetal" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#d9e8f4" />
                <stop offset=".18" stopColor="#66839b" />
                <stop offset=".43" stopColor="#243b55" />
                <stop offset=".68" stopColor="#9eb8ca" />
                <stop offset="1" stopColor="#314b63" />
              </linearGradient>
              <linearGradient id="filterShell" x1="0" x2="1">
                <stop offset="0" stopColor="#63d6f5" stopOpacity=".07" />
                <stop offset=".48" stopColor="#9eeeff" stopOpacity=".24" />
                <stop offset="1" stopColor="#21b8e4" stopOpacity=".08" />
              </linearGradient>
              <linearGradient id="filterCartridge" x1="0" x2="1">
                <stop offset="0" stopColor="#d9e6ef" />
                <stop offset=".2" stopColor="#71889b" />
                <stop offset=".5" stopColor="#e9f4f8" />
                <stop offset=".8" stopColor="#6d8497" />
                <stop offset="1" stopColor="#d4e4ed" />
              </linearGradient>
              <linearGradient id="filterWater" x1="0" x2="1">
                <stop offset="0" stopColor="#38bdf8" stopOpacity=".25" />
                <stop offset=".55" stopColor="#22d3ee" stopOpacity=".78" />
                <stop offset="1" stopColor="#67e8f9" stopOpacity=".3" />
              </linearGradient>
              <radialGradient id="filterGlow">
                <stop stopColor="#22d3ee" stopOpacity=".18" />
                <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
              </radialGradient>
              <filter id="filterShadow" x="-.5" y="-.5" width="2" height="2">
                <feGaussianBlur stdDeviation="9" />
              </filter>
              <clipPath id="filterBodyClip">
                <path d="M402 177 Q402 163 416 163 H544 Q558 163 558 177 L554 210 C564 228 566 246 566 265 V387 Q566 411 544 422 Q480 447 416 422 Q394 411 394 387 V265 C394 246 396 228 406 210 Z" />
              </clipPath>
            </defs>

            <ellipse cx="480" cy="454" rx="240" ry="25" fill="#020817" opacity=".8" filter="url(#filterShadow)" />
            <ellipse cx="480" cy="450" rx="205" ry="15" fill="#22d3ee" opacity=".08" />
            <circle cx="480" cy="295" r="205" fill="url(#filterGlow)" />

            <g aria-hidden="true">
              <path d="M66 151 H366" stroke="#101c2b" strokeWidth="31" strokeLinecap="round" />
              <path d="M66 151 H366" stroke="url(#filterMetal)" strokeWidth="23" strokeLinecap="round" />
              <path d="M66 145 H366" stroke="#e5f4ff" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
              <path d="M594 151 H894" stroke="#101c2b" strokeWidth="31" strokeLinecap="round" />
              <path d="M594 151 H894" stroke="url(#filterMetal)" strokeWidth="23" strokeLinecap="round" />
              <path d="M594 145 H894" stroke="#e5f4ff" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" />
              {[80, 865].map((x) => <g key={x}>
                <path d={`M${x} 135 V167`} stroke="#b6c8d6" strokeWidth="2" />
                <path d={`M${x + 7} 135 V167`} stroke="#b6c8d6" strokeWidth="2" />
              </g>)}
            </g>

            {showLabels && (
              <g className="filter-labels" aria-hidden="true">
                <text x="74" y="111" textAnchor="start">{direction === "left-to-right" ? "INLET" : "OUTLET"} · CONFIGURABLE SIDE</text>
                <text x="886" y="111" textAnchor="end">{direction === "left-to-right" ? "OUTLET" : "INLET"} · CONFIGURABLE SIDE</text>
              </g>
            )}

            <g
              className="filter-part filter-inlet"
              role="button"
              tabIndex={0}
              aria-label="Inlet connection information"
              onClick={() => selectPart("inlet")}
              onKeyDown={(event) => keySelectPart(event, "inlet")}
            >
              <rect x="64" y="126" width="300" height="50" fill="transparent" />
              <path d="M350 132 L375 132 L390 141 L390 161 L375 170 L350 170 Z" fill="url(#filterMetal)" stroke="#d4e5ef" strokeWidth="2" />
              <path d="M354 137 H372 M354 145 H372 M354 153 H372 M354 161 H372" stroke="#233d55" strokeWidth="2" />
            </g>

            <g
              className="filter-part filter-outlet"
              role="button"
              tabIndex={0}
              aria-label="Outlet connection information"
              onClick={() => selectPart("outlet")}
              onKeyDown={(event) => keySelectPart(event, "outlet")}
            >
              <rect x="596" y="126" width="300" height="50" fill="transparent" />
              <path d="M610 132 L585 132 L570 141 L570 161 L585 170 L610 170 Z" fill="url(#filterMetal)" stroke="#d4e5ef" strokeWidth="2" />
              <path d="M606 137 H588 M606 145 H588 M606 153 H588 M606 161 H588" stroke="#233d55" strokeWidth="2" />
            </g>

            <motion.g
              className="filter-part filter-housing"
              role="button"
              tabIndex={0}
              aria-label="Filter housing information"
              onClick={() => selectPart("housing")}
              onKeyDown={(event) => keySelectPart(event, "housing")}
              animate={{ y: isExploded ? 35 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.65, ease: "easeInOut" }}
            >
              <path d="M402 177 Q402 163 416 163 H544 Q558 163 558 177 L554 210 C564 228 566 246 566 265 V387 Q566 411 544 422 Q480 447 416 422 Q394 411 394 387 V265 C394 246 396 228 406 210 Z" fill="url(#filterShell)" stroke="#9deaff" strokeOpacity=".65" strokeWidth="3" />
              <path d="M403 215 C396 234 394 251 394 270 V383 Q394 405 415 418" fill="none" stroke="#e0fbff" strokeOpacity=".65" strokeWidth="4" />
              <path d="M557 215 C564 234 566 251 566 270 V383 Q566 405 545 418" fill="none" stroke="#41c9ee" strokeOpacity=".45" strokeWidth="4" />
              <path d="M416 423 Q480 445 544 423" fill="none" stroke="#d4e8f2" strokeOpacity=".65" strokeWidth="2" />
                <g clipPath="url(#filterBodyClip)">
                  <rect
                    x="385"
                    y={waterTop}
                    width="190"
                    height={422 - waterTop}
                    fill="url(#filterWater)"
                    opacity=".62"
                    style={{ transition: reduceMotion ? "none" : "y 160ms linear, height 160ms linear" }}
                  />
                  <path
                    d={`M394 ${waterTop} C425 ${waterTop - 5} 444 ${waterTop + 5} 480 ${waterTop} C516 ${waterTop - 5} 535 ${waterTop + 5} 566 ${waterTop}`}
                    fill="none"
                    stroke="#8cecff"
                    strokeOpacity=".65"
                    strokeWidth="2"
                  />
                  {stage.index === 3 && Array.from({ length: 5 }, (_, dot) => (
                    <circle key={dot} cx={429 + dot * 11} cy={waterTop + 14 + (dot % 2) * 13} r="3" fill="#fbbf24" opacity=".85" />
                  ))}
                </g>
              <path d="M379 179 H581" stroke="#d4ecf7" strokeWidth="5" strokeOpacity=".8" />
              <path d="M391 197 H569" stroke="#1b344c" strokeWidth="3" />
              <path d="M414 425 Q480 448 546 425" fill="none" stroke="#0c1c2d" strokeWidth="10" />
            </motion.g>

            <motion.g
              className="filter-part filter-cartridge"
              role="button"
              tabIndex={0}
              aria-label="Replaceable filter cartridge information"
              onClick={() => selectPart("cartridge")}
              onKeyDown={(event) => keySelectPart(event, "cartridge")}
              animate={{ y: isExploded ? -68 : 0, rotateY: stage.index === 3 ? stage.progress * 360 : 0 }}
              style={{ transformBox: "fill-box", transformOrigin: "center", transformPerspective: 500 }}
              transition={{ duration: reduceMotion ? 0 : stage.index === 3 ? 0.12 : 0.65, ease: stage.index === 3 ? "linear" : "easeInOut" }}
            >
              <rect x="429" y="207" width="102" height="185" rx="19" fill="url(#filterCartridge)" fillOpacity=".87" stroke="#e7f4fb" strokeWidth="2" />
              <ellipse cx="480" cy="211" rx="51" ry="11" fill="#e1edf4" stroke="#fff" strokeWidth="2" />
              <ellipse cx="480" cy="387" rx="51" ry="11" fill="#667d90" stroke="#d3e2ec" strokeWidth="2" />
              {Array.from({ length: 10 }, (_, index) => {
                const x = 438 + index * 9;
                return <path key={x} d={`M${x} 222 V375`} stroke={index % 2 ? "#253f56" : "#f3fbff"} strokeOpacity={index % 2 ? ".45" : ".58"} strokeWidth="2" />;
              })}
              <rect x="464" y="208" width="32" height="180" rx="13" fill="#172f45" stroke="#bfd3df" strokeWidth="2" />
              <path d="M471 220 V373 M489 220 V373" stroke="#64d8f4" strokeOpacity=".4" strokeWidth="2" />
              <path d="M440 232 H520 M440 365 H520" stroke="#f8fdff" strokeOpacity=".5" strokeWidth="2" />
              {showLabels && <text x="480" y="304" textAnchor="middle" className="filter-svg-small">GENERIC REPLACEABLE</text>}
              {showLabels && <text x="480" y="319" textAnchor="middle" className="filter-svg-small">CARTRIDGE</text>}
            </motion.g>

            <motion.g
              className="filter-part filter-head"
              role="button"
              tabIndex={0}
              aria-label="Filter head and cap information"
              onClick={() => selectPart("head")}
              onKeyDown={(event) => keySelectPart(event, "head")}
              animate={{ y: isExploded ? -42 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.65, ease: "easeInOut" }}
            >
              <path d="M389 126 Q389 117 401 117 H559 Q571 117 571 126 V172 Q571 181 559 181 H401 Q389 181 389 172 Z" fill="url(#filterMetal)" stroke="#d7e8f3" strokeWidth="2" />
              <path d="M400 120 H560 V133 H400 Z" fill="#dbeaf3" opacity=".64" />
              <path d="M400 166 H560 V179 H400 Z" fill="#172d43" opacity=".9" />
              <path d="M414 135 V163 M426 135 V163 M438 135 V163 M522 135 V163 M534 135 V163 M546 135 V163" stroke="#213d56" strokeWidth="4" />
              <path d="M397 181 H563" stroke="#d9eaf4" strokeWidth="3" />
              <rect x="450" y="100" width="60" height="18" rx="5" fill="#243f58" stroke="#c6d9e5" strokeWidth="2" />
              <path d="M460 100 V91 H500 V100" fill="none" stroke="#a8bdca" strokeWidth="3" />
            </motion.g>

            <g clipPath="url(#filterBodyClip)" className={`filter-water ${flowClass}`}>
              <path d="M367 225 C404 222 405 260 414 289 C422 326 427 352 451 351 C474 349 478 297 495 268 C515 236 542 222 590 225" fill="none" stroke="#041729" strokeWidth="12" opacity=".5" />
              <path d="M367 225 C404 222 405 260 414 289 C422 326 427 352 451 351 C474 349 478 297 495 268 C515 236 542 222 590 225" fill="none" stroke="url(#filterWater)" strokeWidth="7" strokeDasharray="13 10" style={{ animationDuration: `${2.5 / speed}s` }} />
              <path d="M367 225 C404 222 405 260 414 289 C422 326 427 352 451 351 C474 349 478 297 495 268 C515 236 542 222 590 225" fill="none" stroke="#b8f5ff" strokeOpacity=".78" strokeWidth="1.5" strokeDasharray="2 20" />
              {Array.from({ length: 5 }, (_, index) => (
                <circle key={index} cx={378 + index * 31} cy={225 + (index % 2) * 5} r={index % 2 ? 3.2 : 2.4} fill="#b9f1ff" className={particleClass} style={{ animationDelay: `${index * -0.62}s`, animationDuration: `${3 / speed}s` }} />
              ))}
              {stage.index === 3 && [0, 1, 2, 3].map((dot) => <circle key={dot} cx={428 + dot * 9} cy={299 + (dot % 2) * 13} r="3" fill="#fbbf24" opacity=".85" />)}
            </g>

            {incoming && (
              <g className={`filter-stream ${flowClass}`} aria-hidden="true">
                <path d={direction === "left-to-right" ? "M68 151 H366" : "M892 151 H594"} fill="none" stroke="#22d3ee" strokeOpacity=".4" strokeWidth="12" />
                <path d={direction === "left-to-right" ? "M68 151 H366" : "M892 151 H594"} fill="none" stroke="#9befff" strokeWidth="4" strokeDasharray="9 12" />
                <path d={direction === "left-to-right" ? "M366 151 C390 151 395 181 410 211" : "M594 151 C570 151 565 181 550 211"} fill="none" stroke="#22d3ee" strokeWidth="5" strokeDasharray="8 11" />
              </g>
            )}
            {outgoing && (
              <g className={`filter-stream ${flowClass}`} aria-hidden="true">
                <path d={direction === "left-to-right" ? "M594 151 H892" : "M366 151 H68"} fill="none" stroke="#22d3ee" strokeOpacity=".4" strokeWidth="12" />
                <path d={direction === "left-to-right" ? "M594 151 H892" : "M366 151 H68"} fill="none" stroke="#9befff" strokeWidth="4" strokeDasharray="9 12" />
                <path d={direction === "left-to-right" ? "M550 211 C565 181 570 151 594 151" : "M410 211 C395 181 390 151 366 151"} fill="none" stroke="#22d3ee" strokeWidth="5" strokeDasharray="8 11" />
              </g>
            )}

            {showLabels && (
              <g className="filter-labels" aria-hidden="true">
                <text x="480" y="475" textAnchor="middle">CARTRIDGE HOUSING · CONCEPTUAL CUTAWAY</text>
                <text x="480" y="492" textAnchor="middle" className="filter-svg-small">Confirm actual flow direction on the selected head and cartridge.</text>
              </g>
            )}
          </svg>

          <div className="flex flex-wrap gap-2 px-2 pb-2 text-xs">
            <span className="text-cyan-200">━━ Water path</span>
            <span className="text-slate-400">Generic cartridge media · no contaminant claims</span>
          </div>
          <p className="px-2 pb-2 text-xs text-slate-500">The fill and cartridge rotation are visual aids, not confirmed filter mechanics. Outlet water is shown after the cartridge; purification or contaminant removal is not guaranteed.</p>
        </div>

        <aside className="space-y-4">
          <div className="glass p-4">
            <h3 className="text-white font-medium mb-3">Animation controls</h3>
            <div className="flex flex-wrap gap-2">
              <button className={`btn ${playing ? "on" : ""}`} onClick={() => setPlaying((value) => !value)} aria-pressed={playing}>
                {playing ? <Pause size={14} /> : <Play size={14} />}{playing ? "Pause" : "Start"}
              </button>
              <button className="btn" onClick={reset}><RotateCcw size={14} />Reset</button>
              {([["Slow", 0.5], ["Normal", 1], ["Fast", 2]] as const).map(([label, value]) => (
                <button key={label} className={`btn ${speed === value ? "on" : ""}`} onClick={() => setSpeed(value)} aria-pressed={speed === value}>{label}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button className={`btn ${cutaway ? "on" : ""}`} onClick={() => setCutaway((value) => !value)} aria-pressed={cutaway}>Cutaway {cutaway ? "on" : "off"}</button>
              <button className={`btn ${isExploded ? "on" : ""}`} onClick={() => setExplodedOverride((value) => !(value ?? stage.index === 5))} aria-pressed={isExploded}>Exploded view</button>
              <button className={`btn ${showLabels ? "on" : ""}`} onClick={() => setShowLabels((value) => !value)} aria-pressed={showLabels}>{showLabels ? "Hide" : "Show"} labels</button>
              <button className={`btn ${waterFlow ? "on" : ""}`} onClick={() => setWaterFlow((value) => !value)} aria-pressed={waterFlow}>Water flow {waterFlow ? "on" : "off"}</button>
            </div>
            <div className="mt-4">
              <label htmlFor="filter-direction" className="block text-xs text-slate-400 mb-1">Conceptual flow direction</label>
              <select id="filter-direction" className="w-full rounded-md border border-cyan-300/20 bg-[#0b1830] px-3 py-2 text-sm text-slate-100" value={direction} onChange={(event) => setDirection(event.target.value === "right-to-left" ? "right-to-left" : "left-to-right")}>
                <option value="left-to-right">Inlet left · outlet right</option>
                <option value="right-to-left">Inlet right · outlet left</option>
              </select>
            </div>
            {reduceMotion && <p className="mt-3 text-xs text-amber-200">Reduced-motion preference detected. The sequence starts paused; use Start to play it.</p>}
          </div>

          <div className="glass p-4" aria-live="polite">
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">Component information</p>
            <h3 className="text-white font-medium mt-1">{info.title}</h3>
            <p className="text-sm text-slate-400 mt-2">{info.description}</p>
            <p className="text-[11px] text-slate-500 mt-3">Select a labeled part in the illustration or a system block below.</p>
          </div>
        </aside>
      </div>

      <div className="glass p-4 mt-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-xs mb-3">
          <span className="text-cyan-200">━━ Water path · physical plumbing</span>
          <span className="text-green-300">┅ Electrical signal · not a water connection</span>
        </div>
        <p className="text-sm text-slate-300 mb-3">Physical treatment and measurement are separate stages:</p>
        <div className="filter-system-flow">
          <button className="filter-system-node water-node" onClick={() => selectPart("inlet")}>Raw water</button>
          <span className="filter-system-link water-link" aria-hidden="true" />
          <button className="filter-system-node water-node" onClick={() => selectPart("housing")}>Filter housing</button>
          <span className="filter-system-link water-link" aria-hidden="true" />
          <button className="filter-system-node water-node" onClick={() => selectPart("sample")}>Water sample</button>
          <span className="filter-system-link water-link" aria-hidden="true" />
          <div className="filter-system-node sensor-node">
            <span className="block text-cyan-100 text-xs mb-2">Sensor modules</span>
            <div className="flex flex-wrap justify-center gap-1">
              <button onClick={() => selectPart("ph")}>pH</button>
              <button onClick={() => selectPart("tds")}>TDS</button>
              <button onClick={() => selectPart("turbidity")}>Turbidity</button>
            </div>
          </div>
          <span className="filter-system-link signal-link" aria-hidden="true" />
          <button className="filter-system-node signal-node" onClick={() => selectPart("esp32")}>ESP32<br /><span className="text-[10px] text-slate-400">processing</span></button>
          <span className="filter-system-link signal-link" aria-hidden="true" />
          <div className="filter-system-node signal-node">
            <button className="block" onClick={() => selectPart("oled")}>128 × 64 OLED</button>
            <button className="block mt-2" onClick={() => selectPart("serial")}>Serial Monitor</button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">Sensors measure selected water-quality parameters after calibration; no sensor-to-filter control is implied. Readings shown elsewhere remain simulated.</p>
        <p className="text-xs text-amber-200/80 mt-2">Exploded view is an educational illustration, not a maintenance procedure. Never open a pressurized filter housing.</p>
      </div>
    </section>
  );
}

export default FilterVisualization;
