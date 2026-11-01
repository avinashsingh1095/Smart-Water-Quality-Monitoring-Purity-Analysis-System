import { useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { motion, MotionConfig } from "framer-motion";
import { Menu, X, Play, Pause, RotateCcw, Copy, Search, Download, Printer, AlertTriangle, ChevronRight, ChevronLeft, Check, Droplets } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import { FIRMWARE } from "./firmware";
import profilePhoto from "./assets/avinash-paviya.png";

const SIM = "SIMULATED DATA — NOT CONNECTED TO PHYSICAL SENSORS";
const NAV = [["hero", "Home"], ["architecture", "Architecture"], ["filter", "Filtration"], ["sensors", "Sensors"], ["firmware", "Firmware"], ["dashboard", "Dashboard"], ["wiring", "Wiring"], ["calibration", "Calibration"], ["testing", "Testing"], ["docs", "Docs"]];

/* ---------- deterministic simulation (synthetic, never real) ---------- */
type Row = { t: number; raw: number[]; fil: number[] };
const SCEN = ["Low apparent turbidity", "Higher apparent turbidity", "Different dissolved-solids level"];
const BASE = [[1850, 950, 2850], [1850, 950, 1700], [1850, 1800, 2850]];
const noise = (t: number, k: number) => Math.round((((Math.sin(t * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1 - 0.5) * 30);
function makeRow(t: number, sc: number): Row {
  const b = BASE[sc];
  const raw = b.map((v, k) => v + noise(t, k));
  const fil = [b[0] + 15, b[1] * 0.98, b[2] + (2850 - b[2]) * 0.7].map((v, k) => Math.round(v + noise(t, k + 3)));
  return { t, raw, fil };
}
const volt = (r: number) => (r * 3.3) / 4095;
function useSim() {
  const [hist, setHist] = useState<Row[]>([]); const [run, setRun] = useState(false); const [sc, setSc] = useState(0);
  const n = useRef(0); const scRef = useRef(sc); scRef.current = sc;
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => { n.current += 1; setHist(h => [...h.slice(-59), makeRow(n.current, scRef.current)]); }, 1000);
    return () => clearInterval(id);
  }, [run]);
  const reset = () => { setRun(false); n.current = 0; setHist([]); };
  const current = hist.length ? hist[hist.length - 1] : makeRow(0, sc);
  return { hist, run, setRun, sc, setSc, reset, clear: () => setHist([]), current, started: hist.length > 0 };
}
type Sim = ReturnType<typeof useSim>;

/* ---------- layout helpers ---------- */
const Sec = ({ id, title, sub, children }: { id: string; title: string; sub?: string; children: ReactNode }) => (
  <motion.section id={id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: .5 }} className="max-w-6xl mx-auto px-4 py-14">
    <h2 className="text-2xl md:text-3xl font-semibold text-white">{title}</h2>
    {sub && <p className="text-slate-400 mt-2 max-w-3xl">{sub}</p>}
    <div className="mt-6">{children}</div>
  </motion.section>
);
const Banner = ({ children, tone = "amber" }: { children: ReactNode; tone?: "amber" | "red" }) => (
  <div role="note" className={`flex gap-2 items-start text-sm rounded-lg px-3 py-2 border ${tone === "red" ? "border-red-400/50 bg-red-500/10 text-red-200" : "border-amber-400/40 bg-amber-500/10 text-amber-200"}`}>
    <AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>{children}</span>
  </div>
);
const Pill = ({ children }: { children: ReactNode }) => <span className="text-xs px-2 py-1 rounded-full border border-cyan-300/30 bg-cyan-400/10 text-cyan-200">{children}</span>;

/* ---------- A. hero ---------- */
function Hero({ sim }: { sim: Sim }) {
  const c = sim.current;
  const oled = [`pH ADC: ${c.raw[0]}  V:${(volt(c.raw[0]) * 2).toFixed(2)}`, `TDS ADC: ${c.raw[1]} V:${volt(c.raw[1]).toFixed(2)}`, `Turb ADC: ${c.raw[2]} V:${(volt(c.raw[2]) * 2).toFixed(2)}`];
  return (
    <section id="hero" className="max-w-6xl mx-auto px-4 pt-16 pb-10 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <div className="flex flex-wrap gap-2 mb-4"><Pill>Prototype</Pill><Pill>Simulation Mode</Pill><Pill>Calibration Required</Pill></div>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight text-white">Smart Water Quality Monitoring &amp; Purity Analysis System</h1>
        <p className="text-slate-300 mt-4">An ESP32-based prototype for monitoring selected water-quality parameters and exploring filtration through interactive visualization.</p>
        <div className="flex gap-3 mt-6"><a href="#architecture" className="btn on">Explore the System</a><a href="#firmware" className="btn">View Firmware</a></div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-8 text-sm">
          {[["Project type", "Engineering Micro Project"], ["Controller", "ESP32"], ["Sensors", "pH, TDS, Turbidity"], ["Display", "128 × 64 I²C OLED"], ["Firmware", "Arduino IDE"]].map(([k, v]) => <div key={k}><dt className="text-slate-500">{k}</dt><dd className="text-slate-100">{v}</dd></div>)}
        </dl>
      </div>
      <div className="glass p-4">
        <svg viewBox="0 0 400 300" role="img" aria-label="Illustration: three sensors wired to an ESP32 board with an OLED">
          {[["pH", 30], ["TDS", 100], ["TURB", 170]].map(([l, y]) => (
            <g key={l}><rect x="10" y={y as number} width="70" height="44" rx="6" fill="#0f2744" stroke="#38bdf8" /><text x="45" y={(y as number) + 27} textAnchor="middle" fill="#bae6fd" fontSize="13">{l}</text>
              <path d={`M80 ${(y as number) + 22} C140 ${(y as number) + 22} 140 130 190 130`} stroke="#4ade80" fill="none" strokeWidth="2" strokeDasharray="6 6"><animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" /></path></g>
          ))}
          <rect x="190" y="70" width="110" height="130" rx="8" fill="#10223f" stroke="#22d3ee" strokeWidth="2" /><rect x="215" y="85" width="60" height="40" rx="3" fill="#1e3a5f" /><text x="245" y="150" textAnchor="middle" fill="#67e8f9" fontSize="14" fontWeight="600">ESP32</text><text x="245" y="170" textAnchor="middle" fill="#94a3b8" fontSize="10">GPIO 34 · 35 · 32</text>
          <path d="M300 130 H340" stroke="#4ade80" strokeWidth="2" strokeDasharray="6 6"><animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" /></path>
          <rect x="340" y="95" width="55" height="70" rx="4" fill="#020617" stroke="#38bdf8" /><text x="367" y="182" textAnchor="middle" fill="#94a3b8" fontSize="9">OLED I²C</text>
          {[0, 1, 2].map(i => <rect key={i} x="346" y={103 + i * 18} width={42 - i * 6} height="4" fill="#67e8f9" opacity=".8" />)}
          <path d="M90 270 Q200 230 310 270" stroke="#22d3ee" fill="none" strokeWidth="3" opacity=".5" />
        </svg>
        <div className="font-mono text-xs bg-black/60 border border-cyan-300/20 rounded p-2 mt-2 text-cyan-200">
          <div>WATER QUALITY MONITOR</div>{oled.map(l => <div key={l}>{l}</div>)}<div>Raw / voltage only</div>
        </div>
        <p className="text-[11px] text-amber-300 mt-2">{SIM}</p>
      </div>
    </section>
  );
}

/* ---------- B. architecture ---------- */
const INFO: Record<string, Record<string, string>> = {
  water: { Title: "Raw Water", Purpose: "The untreated sample to be examined.", "Working principle": "Water enters the filtration unit by gravity or manual pouring (design-dependent).", Input: "Sample water", Output: "Water to the filtration unit", Connections: "Water path only; no electrical connection.", Limitations: "Composition is unknown until measured; this site does not assess safety." },
  filter: { Title: "Filtration Unit", Purpose: "Illustrative multi-layer media to reduce particulates.", "Working principle": "Water passes mesh, carbon, sand and gravel layers (see simulator).", Input: "Raw water", Output: "Filtered water", Connections: "Water path only. Sensors do NOT control the filter.", Limitations: "Does not remove every contaminant; actual cartridge design may differ." },
  sample: { Title: "Water Sample", Purpose: "The portion presented to the sensors.", "Working principle": "A separate sampling arrangement may be needed so the same sample is measured before and after filtration.", Input: "Raw or filtered water", Output: "Water in contact with probes", Connections: "Water path to the three sensor probes.", Limitations: "Temperature, bubbles and probe fouling affect readings." },
  ph: { Title: "pH Sensor", Purpose: "Indicates acidity/alkalinity.", "Working principle": "Probe voltage is conditioned by a board into an analog output.", Input: "Water sample", Output: "Analog voltage (Po)", Connections: "Po → GPIO 34 via verified safe conditioning/divider; V+, G.", Limitations: "Needs buffer-solution calibration; ADC counts are not pH." },
  tds: { Title: "TDS Sensor", Purpose: "Estimates dissolved solids via an electrical property.", "Working principle": "Module measures conductivity-related signal; ppm conversion is sensor/temperature dependent.", Input: "Water sample", Output: "Analog voltage (A)", Connections: "A → GPIO 35 after output-voltage verification.", Limitations: "Needs reference solution and temperature compensation." },
  turb: { Title: "Turbidity Sensor", Purpose: "Estimates cloudiness.", "Working principle": "Optical (light transmission/scatter) measurement; voltage-turbidity relation is sensor-specific.", Input: "Water sample", Output: "Analog voltage (OUT)", Connections: "OUT → GPIO 32 via verified safe conditioning/divider.", Limitations: "Needs reference standards for NTU; ambient light and fouling matter." },
  esp: { Title: "ESP32 Controller", Purpose: "Reads sensors, drives display, prints serial data.", "Working principle": "12-bit ADC averaging 20 samples/channel; voltages estimated with a 3.3 V reference.", Input: "Three analog channels", Output: "OLED text + serial text", Connections: "GPIO 34/35/32 in; SDA 21, SCL 22; USB serial.", Limitations: "ESP32 ADC is nonlinear; GPIO is not 5 V tolerant." },
  oled: { Title: "OLED Display", Purpose: "Shows raw ADC and voltage values on the device.", "Working principle": "SSD1306 128×64 over I²C, address 0x3C.", Input: "I²C data from ESP32", Output: "Text on screen", Connections: "SDA → GPIO 21, SCL → GPIO 22, VCC, GND.", Limitations: "Shows raw/voltage only — not pH, ppm or NTU." },
  serial: { Title: "Serial Monitor", Purpose: "Detailed readings on a computer.", "Working principle": "UART over USB at 115200 baud.", Input: "Serial text from ESP32", Output: "Log lines", Connections: "USB cable to computer.", Limitations: "Values are uncalibrated." },
};
function Architecture() {
  const [sel, setSel] = useState("esp");
  const B = ({ k, label, sub, w }: { k: string; label: string; sub?: string; w?: boolean }) => (
    <button onClick={() => setSel(k)} aria-pressed={sel === k} className={`glass px-4 py-3 text-left min-w-[140px] ${sel === k ? "ring-2 ring-cyan-400" : ""} ${w ? "border-cyan-400/50" : "border-green-400/40"}`}>
      <div className="font-medium text-white text-sm">{label}</div>{sub && <div className="text-xs text-slate-400">{sub}</div>}
    </button>);
  const Ar = ({ label, sig }: { label: string; sig?: boolean }) => <div className="flex flex-col items-center text-[11px] text-slate-400 my-1"><div className={`flow-v ${sig ? "sig" : ""}`} />{label}</div>;
  const i = INFO[sel];
  return (
    <Sec id="architecture" title="System architecture" sub="Click any block. Cyan lines are the water path; green dashed lines are the electrical signal path.">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass p-5 flex flex-col items-center">
          <div className="flex gap-4 text-xs mb-3"><span className="text-cyan-300">━ Water flow</span><span className="text-green-400">┅ Electrical signal</span></div>
          <div className="flex flex-wrap gap-2 justify-center"><B w k="water" label="RAW WATER" /><B w k="filter" label="FILTRATION UNIT" /><B w k="sample" label="WATER SAMPLE" /></div>
          <Ar label="Sample presented to probes" />
          <div className="flex flex-wrap gap-2 justify-center"><B k="ph" label="pH Sensor" sub="→ GPIO 34" /><B k="tds" label="TDS Sensor" sub="→ GPIO 35" /><B k="turb" label="Turbidity Sensor" sub="→ GPIO 32" /></div>
          <Ar sig label="Analog Signal → ADC Reading" />
          <B k="esp" label="ESP32 CONTROLLER" sub="Processed Values" />
          <Ar sig label="Display Output (I²C: SDA 21 / SCL 22) · Serial (USB)" />
          <div className="flex gap-2"><B k="oled" label="OLED 128 × 64" /><B k="serial" label="SERIAL MONITOR" sub="Computer" /></div>
        </div>
        <div className="glass p-5" aria-live="polite">
          <h3 className="text-xl text-cyan-300 mb-3">{i.Title}</h3>
          {Object.entries(i).filter(([k]) => k !== "Title").map(([k, v]) => <p key={k} className="mb-2 text-sm"><b className="text-slate-300">{k}: </b><span className="text-slate-400">{v}</span></p>)}
        </div>
      </div>
    </Sec>
  );
}

/* ---------- C. filtration simulator ---------- */
const LAYERS: [string, number, number, string, string][] = [
  ["Mesh / pre-filter", 40, 70, "#475569", "Intended to catch large particles and debris."],
  ["Activated carbon", 70, 160, "#1e293b", "Adsorbs some dissolved organics and odour-causing compounds."],
  ["Fine sand", 160, 250, "#a68a5b", "Intended to trap finer suspended particles."],
  ["Gravel support", 250, 330, "#78716c", "Supports the media above and spreads flow."],
  ["Filtered-water outlet", 330, 420, "#0e3a52", "Collection point for water that has passed the layers."],
];
function FilterSim() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [run, setRun] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [sp, setSp] = useState(1); const [lab, setLab] = useState(true); const [rs, setRs] = useState(0);
  const st = useRef({ run, sp, lab }); st.current = { run, sp, lab };
  useEffect(() => {
    const c = ref.current!; const g = c.getContext("2d")!; const W = 560, H = 420; const V = [2.4, 1, .7, 1.2, 2.2];
    const mk = (top: boolean) => ({ x: 130 + Math.random() * 300, y: top ? 0 : Math.random() * H });
    let P = Array.from({ length: 100 }, () => mk(false)); let raf = 0;
    const frame = () => {
      const { run, sp, lab } = st.current; g.clearRect(0, 0, W, H);
      LAYERS.forEach(([n, a, b, col]) => { g.fillStyle = col; g.fillRect(120, a, 320, b - a); if (lab) { g.fillStyle = "#e2e8f0"; g.font = "13px sans-serif"; g.fillText(n, 450, (a + b) / 2 + 4); } });
      g.fillStyle = "#94a3b8"; g.font = "12px sans-serif"; g.fillText("Raw water in ↓", 240, 14);
      P = P.map(p => {
        const li = LAYERS.findIndex(l => p.y >= l[1] && p.y < l[2]); const v = V[Math.max(0, li)] ?? 2;
        if (run) { p.y += v * sp; p.x += (Math.random() - .5) * (li >= 1 ? 1.2 : .3); p.x = Math.min(430, Math.max(130, p.x)); }
        if (p.y >= H) return mk(true);
        g.beginPath(); g.fillStyle = p.y < 70 ? "#d6a96a" : p.y < 330 ? "#7dd3fc" : "#67e8f9"; g.globalAlpha = p.y < 330 ? .85 : .6;
        g.arc(p.x, p.y, p.y < 70 ? 3.2 : p.y < 330 ? 2.4 : 1.6, 0, 7); g.fill(); g.globalAlpha = 1; return p;
      });
      raf = requestAnimationFrame(frame);
    };
    frame(); return () => cancelAnimationFrame(raf);
  }, [rs]);
  return (
    <Sec id="filter" title="Filtration simulator" sub="Illustrative filtration model. Layers are intended to reduce some particulates; they do not remove every contaminant and the output is not claimed to be safe to drink. The actual housing/cartridge may differ, and sensors do not control the filter.">
      <div className="grid lg:grid-cols-[580px_1fr] gap-6">
        <div className="glass p-3 overflow-x-auto"><canvas ref={ref} width={560} height={420} role="img" aria-label="Animated cross-section of an illustrative filter" className="max-w-full" /></div>
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button className="btn on" onClick={() => setRun(!run)}>{run ? <Pause size={14} /> : <Play size={14} />}{run ? "Pause" : "Start"}</button>
            <button className="btn" onClick={() => setRs(r => r + 1)}><RotateCcw size={14} />Reset</button>
            {([["Slow", .5], ["Normal", 1], ["Fast", 2]] as const).map(([n, v]) => <button key={n} className={`btn ${sp === v ? "on" : ""}`} onClick={() => setSp(v)}>{n}</button>)}
            <button className="btn" onClick={() => setLab(!lab)}>{lab ? "Hide" : "Show"} labels</button>
          </div>
          <ul className="space-y-2 text-sm">{LAYERS.map(l => <li key={l[0]} className="glass p-3"><b className="text-cyan-300">{l[0]}</b><br /><span className="text-slate-400">{l[4]}</span></li>)}</ul>
        </div>
      </div>
    </Sec>
  );
}

/* ---------- D. sensors ---------- */
const SENS = [
  { n: "pH sensor", div: true, i: 0, d: "pH represents acidity or alkalinity. The sensor and conditioning board generate an electrical signal, the ESP32 reads it with its ADC, and a calibrated conversion (buffer solutions) is required to calculate pH." },
  { n: "TDS sensor", div: false, i: 1, d: "The module measures an electrical property used to estimate dissolved solids, usually in ppm or mg/L. The conversion depends on the sensor, calibration and temperature." },
  { n: "Turbidity sensor", div: true, i: 2, d: "An optical measurement estimates cloudiness. The voltage-to-turbidity relation is sensor-specific; a validated conversion needs calibration against standards." },
];
function Sensors({ sim }: { sim: Sim }) {
  return (
    <Sec id="sensors" title="Sensor laboratory" sub="Values come from the simulation below (start it in the dashboard). Hover the figures for meaning.">
      <Banner>{SIM}</Banner>
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        {SENS.map(s => {
          const r = sim.current.raw[s.i]; const v = volt(r);
          return (
            <div key={s.n} className="glass p-4">
              <h3 className="text-lg text-white">{s.n}</h3>
              <div className="h-2 rounded bg-slate-800 my-3" title="Position within the 0–4095 ADC range"><div className="h-2 rounded bg-gradient-to-r from-cyan-500 to-green-400 transition-all" style={{ width: `${(r / 4095) * 100}%` }} /></div>
              <dl className="text-sm space-y-1">
                <div title="12-bit ADC count (0–4095), averaged over 20 samples" className="flex justify-between"><dt className="text-slate-400">Simulated raw ADC</dt><dd className="font-mono">{r}</dd></div>
                <div title="raw × 3.3 / 4095 (estimate; ESP32 ADC is nonlinear)" className="flex justify-between"><dt className="text-slate-400">ADC voltage (est.)</dt><dd className="font-mono">{v.toFixed(3)} V</dd></div>
                {s.div && <div title="ADC voltage × 2.0, valid only if the divider is actually fitted" className="flex justify-between"><dt className="text-slate-400">Sensor output (est., ÷2 divider)</dt><dd className="font-mono">{(v * 2).toFixed(3)} V</dd></div>}
                <div className="flex justify-between"><dt className="text-slate-400">Calibration</dt><dd className="text-amber-300">Not calibrated</dd></div>
              </dl>
              <details className="mt-3 text-sm text-slate-400"><summary className="cursor-pointer text-cyan-300">What this means</summary><p className="mt-2">{s.d}</p></details>
            </div>);
        })}
      </div>
    </Sec>
  );
}

/* ---------- E. firmware explorer ---------- */
const LINES = FIRMWARE.split("\n");
const SECTS = [
  ["Defines & display object", "#define SCREEN_WIDTH", "Declares the 128×64 SSD1306 OLED at I²C address 0x3C. OLED_RESET -1 means no dedicated reset pin."],
  ["Pins & flags", "const int PH_PIN", "Pins GPIO 34/35/32 and two flags telling the code whether a ÷2 voltage divider is physically fitted on pH and turbidity. These MUST match the real circuit."],
  ["Globals", "float phAdcVoltage", "Shared variables for latest raw counts and estimated voltages."],
  ["readAverage()", "int readAverage", "Reads a pin 20 times, 5 ms apart, and returns the integer mean. Averaging smooths short-term noise but does not make the value accurate."],
  ["rawToVoltage()", "float rawToVoltage", "Voltage = raw × 3.3 / 4095. The 3.3 V is only an estimate; the ESP32 ADC is nonlinear, so this is not a precise measurement."],
  ["showReadings()", "void showReadings", "Clears the OLED buffer, writes a title and the three raw/voltage lines, then display() pushes the buffer to the screen. Note it shows pH and turbidity output voltage but TDS ADC voltage."],
  ["printReadings()", "void printReadings", "Writes labelled lines to the Serial Monitor (115200 baud), ending with a reminder that calibration is needed."],
  ["setup()", "void setup", "Runs once: starts Serial, sets 12-bit ADC and 11 dB attenuation (~0–3.3 V range) per pin, starts I²C on 21/22, halts with a message if the OLED is not found, shows a splash."],
  ["loop()", "void loop", "Repeats forever: average each channel, convert to voltage, apply divider ratio if flagged, update OLED, print serial, wait 1.5 s."],
];
const CONCEPTS = [["ADC averaging", "readAverage", "20 samples reduce random jitter, not systematic error such as nonlinearity or missing calibration."], ["Voltage conversion", "rawToVoltage", "Linear estimate using 3.3 V and 4095 counts."], ["Divider flags", "DIVIDER", "If a flag is true the code multiplies by 2.0 to estimate the sensor's output. A wrong flag gives a wrong estimate."], ["OLED update", "display.", "Adafruit GFX calls draw into a buffer; display.display() sends it."], ["Serial output", "Serial.", "Human-readable lines for debugging at 115200 baud."]];
const FLOW = ["Power On", "Initialize Serial", "Configure ADC", "Initialize I²C", "Initialize OLED", "Read pH ADC", "Read TDS ADC", "Read Turbidity ADC", "Calculate Estimated Voltages", "Update OLED", "Print Serial Data", "Wait 1.5 Seconds", "Repeat"];
const FLOW_SEC = [7, 7, 7, 7, 7, 8, 8, 8, 8, 5, 6, 8, 8];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hl = (s: string) => esc(s).replace(/(\/\/.*)|("[^"]*")|(#\w+)|\b(int|float|const|bool|void|return|for|if|while|true|false|uint32_t)\b|\b(\d+\.?\d*)\b/g, (m, c, st, p, k, n) => `<span style="color:${c ? "#64748b" : st ? "#86efac" : p ? "#c4b5fd" : k ? "#67e8f9" : n ? "#fbbf24" : "inherit"}">${m}</span>`);
function Firmware() {
  const [q, setQ] = useState(""); const [sec, setSec] = useState(0); const [copied, setCopied] = useState(""); const [step, setStep] = useState(0); const [auto, setAuto] = useState(false); const [note, setNote] = useState("");
  const starts = useMemo(() => SECTS.map(s => LINES.findIndex(l => l.includes(s[1]))), []);
  const range = (i: number) => [starts[i], i + 1 < starts.length ? starts[i + 1] : LINES.length];
  const goSec = (i: number) => { setSec(i); document.getElementById(`ln-${starts[i]}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }); };
  const matches = q ? LINES.filter(l => l.toLowerCase().includes(q.toLowerCase())).length : 0;
  useEffect(() => { if (!auto) return; const id = setInterval(() => setStep(s => (s + 1) % FLOW.length), 1200); return () => clearInterval(id); }, [auto]);
  const copy = async () => { try { await navigator.clipboard.writeText(FIRMWARE); setCopied("Copied"); } catch { setCopied("Copy failed — select the code manually"); } setTimeout(() => setCopied(""), 2000); };
  const [a, b] = range(sec);
  return (
    <Sec id="firmware" title="Firmware explorer" sub="The supplied Arduino sketch, unmodified. It reports raw ADC counts and estimated voltages only — it does not compute calibrated pH, ppm or NTU.">
      <div className="flex flex-wrap gap-2 mb-3">{SECTS.map((s, i) => <button key={s[0]} className={`btn ${sec === i ? "on" : ""}`} onClick={() => goSec(i)}>{s[0]}</button>)}</div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="glass overflow-hidden">
          <div className="flex gap-2 p-2 border-b border-white/10 items-center">
            <Search size={14} className="text-slate-400" /><input aria-label="Search code" value={q} onChange={e => setQ(e.target.value)} placeholder="Search code…" className="bg-transparent flex-1 text-sm outline-none" />
            {q && <span className="text-xs text-slate-400">{matches ? `${matches} line(s)` : "No matches"}</span>}
            <button className="btn" onClick={copy}>{copied === "Copied" ? <Check size={14} /> : <Copy size={14} />}{copied || "Copy code"}</button>
          </div>
          <pre className="text-xs leading-5 overflow-auto max-h-[480px] p-2 font-mono" tabIndex={0} aria-label="Arduino firmware source">
            {LINES.map((l, i) => <div key={i} id={`ln-${i}`} className={`flex ${i >= a && i < b ? "bg-cyan-400/10" : ""} ${q && l.toLowerCase().includes(q.toLowerCase()) ? "!bg-amber-400/25" : ""}`}><span className="w-8 shrink-0 text-right pr-2 text-slate-600 select-none">{i + 1}</span><code dangerouslySetInnerHTML={{ __html: hl(l) || " " }} /></div>)}
          </pre>
        </div>
        <div className="space-y-3">
          <div className="glass p-4"><h3 className="text-cyan-300">{SECTS[sec][0]}</h3><p className="text-sm text-slate-300 mt-1">{SECTS[sec][2]}</p></div>
          <div className="glass p-4"><h3 className="text-white text-sm mb-2">Clickable concepts (also searches the code)</h3>
            <div className="flex flex-wrap gap-2">{CONCEPTS.map(c => <button key={c[0]} className="btn" onClick={() => { setQ(c[1]); setNote(c[2]); }}>{c[0]}</button>)}</div>
            {note && <p className="text-sm text-slate-300 mt-2">{note}</p>}</div>
          <div className="glass p-4 text-sm text-slate-300">
            <p><b>setup()</b> runs once at power-up. <b>loop()</b> then repeats forever.</p>
            <p className="mt-2 text-amber-200">Flags PH_DIVIDER_CONNECTED / TURBIDITY_DIVIDER_CONNECTED must match the physical circuit. The TDS channel has no divider flag.</p>
          </div>
        </div>
      </div>
      <div className="glass p-4 mt-4">
        <h3 className="text-white mb-3">Execution flow</h3>
        <div className="flex flex-wrap gap-2">{FLOW.map((f, i) => <button key={f} onClick={() => { setStep(i); setAuto(false); }} className={`btn ${i === step ? "on" : ""}`}>{i + 1}. {f}</button>)}</div>
        <div className="flex gap-2 mt-3 items-center">
          <button className="btn" onClick={() => setStep(s => (s + FLOW.length - 1) % FLOW.length)}><ChevronLeft size={14} />Back</button>
          <button className="btn" onClick={() => setStep(s => (s + 1) % FLOW.length)}>Next<ChevronRight size={14} /></button>
          <button className="btn" onClick={() => setAuto(!auto)}>{auto ? <Pause size={14} /> : <Play size={14} />}{auto ? "Stop" : "Auto-play"}</button>
          <button className="btn" onClick={() => { goSec(FLOW_SEC[step]); document.getElementById("firmware")?.scrollIntoView(); }}>Show in code</button>
        </div>
        <p className="text-sm text-slate-400 mt-2">Step {step + 1} of {FLOW.length}: <b className="text-cyan-300">{FLOW[step]}</b> — the 20-sample average is taken inside readAverage() with 5 ms between samples.</p>
      </div>
    </Sec>
  );
}

/* ---------- F. dashboard ---------- */
function Dashboard({ sim }: { sim: Sim }) {
  const [si, setSi] = useState(2);
  const data = sim.hist.map(r => ({ t: r.t, "Raw water": r.raw[si], "Filtered water": r.fil[si] }));
  const c = sim.current; const names = ["pH", "TDS", "Turbidity"];
  const serial = `===== WATER QUALITY =====\npH raw ADC: ${c.raw[0]}\npH ADC voltage: ${volt(c.raw[0]).toFixed(3)} V\npH output voltage (estimated): ${(volt(c.raw[0]) * 2).toFixed(3)} V\nTDS raw ADC: ${c.raw[1]}\nTDS ADC voltage: ${volt(c.raw[1]).toFixed(3)} V\nTurbidity raw ADC: ${c.raw[2]}\nTurbidity ADC voltage: ${volt(c.raw[2]).toFixed(3)} V\nTurbidity output voltage (estimated): ${(volt(c.raw[2]) * 2).toFixed(3)} V\nCalibrate sensors before reporting pH, ppm or NTU.`;
  return (
    <Sec id="dashboard" title="Simulated dashboard" sub="Deterministic synthetic data; it changes only while you run the simulation. In these demo scenarios a lower turbidity ADC count is used to represent cloudier water — the real direction depends on the module.">
      <Banner>{SIM}</Banner>
      <div className="flex flex-wrap gap-2 my-4">
        <button className="btn on" onClick={() => sim.setRun(!sim.run)}>{sim.run ? <Pause size={14} /> : <Play size={14} />}{sim.run ? "Pause" : "Start"} simulation</button>
        <button className="btn" onClick={sim.reset}><RotateCcw size={14} />Reset</button>
        <button className="btn" onClick={sim.clear}>Clear history</button>
        {SCEN.map((s, i) => <button key={s} className={`btn ${sim.sc === i ? "on" : ""}`} onClick={() => { sim.setSc(i); sim.reset(); }}>{i + 1}. {s}</button>)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass p-4 lg:col-span-2">
          <div className="flex gap-2 mb-2">{names.map((n, i) => <button key={n} className={`btn ${si === i ? "on" : ""}`} onClick={() => setSi(i)}>{n}</button>)}</div>
          {data.length === 0 ? <p className="text-slate-400 text-sm py-16 text-center">No history yet. Press “Start simulation” to generate synthetic samples.</p> :
            <div className="h-72"><ResponsiveContainer><LineChart data={data}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="t" stroke="#94a3b8" label={{ value: "Simulated sample number (1 per second)", position: "insideBottom", offset: -4, fill: "#94a3b8", fontSize: 12 }} /><YAxis stroke="#94a3b8" domain={[0, 4095]} label={{ value: `${names[si]} ADC (counts, 0–4095)`, angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 12 }} /><Tooltip contentStyle={{ background: "#0d1a31", border: "1px solid #38bdf8" }} /><Legend verticalAlign="top" /><Line dataKey="Raw water" stroke="#22d3ee" dot={false} isAnimationActive={false} /><Line dataKey="Filtered water" stroke="#4ade80" dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>}
        </div>
        <pre className="glass p-3 text-[11px] font-mono text-green-300 overflow-auto max-h-80" aria-label="Simulated serial output">{sim.started ? serial : "Serial output appears here once the simulation starts."}</pre>
      </div>
      <div className="glass p-4 mt-4 overflow-x-auto"><h3 className="text-white mb-2">Raw vs filtered (latest simulated sample)</h3>
        <table className="w-full text-sm"><thead className="text-slate-400 text-left"><tr><th>Channel</th><th>Raw ADC</th><th>Raw V (est.)</th><th>Filtered ADC</th><th>Filtered V (est.)</th><th>Status</th></tr></thead>
          <tbody>{names.map((n, i) => <tr key={n} className="border-t border-white/10"><td>{n}</td><td className="font-mono">{c.raw[i]}</td><td className="font-mono">{volt(c.raw[i]).toFixed(3)}</td><td className="font-mono">{c.fil[i]}</td><td className="font-mono">{volt(c.fil[i]).toFixed(3)}</td><td className="text-amber-300">Uncalibrated</td></tr>)}</tbody></table>
        <p className="text-xs text-slate-400 mt-2">Filtration may change turbidity noticeably, while TDS and pH can change little or vary with media and water chemistry. Not every metric is expected to improve.</p></div>
    </Sec>
  );
}

/* ---------- G. wiring ---------- */
const PINS: [string, string, string, "Signal" | "Power" | "Ground"][] = [
  ["pH module", "Po", "GPIO 34 through verified safe signal conditioning", "Signal"], ["pH module", "V+", "Verified suitable supply", "Power"], ["pH module", "G", "Common GND", "Ground"],
  ["TDS module", "A", "GPIO 35, after output-voltage verification", "Signal"], ["TDS module", "+", "Supply within module specifications", "Power"], ["TDS module", "−", "Common GND", "Ground"],
  ["Turbidity module", "OUT", "GPIO 32 through verified safe signal conditioning", "Signal"], ["Turbidity module", "VCC", "Supply within module specifications", "Power"], ["Turbidity module", "GND", "Common GND", "Ground"],
  ["OLED", "SDA", "GPIO 21", "Signal"], ["OLED", "SCL", "GPIO 22", "Signal"], ["OLED", "VCC", "Compatible supply", "Power"], ["OLED", "GND", "Common GND", "Ground"],
];
const TCOL = { Signal: "#4ade80", Power: "#f87171", Ground: "#94a3b8" };
function Wiring() {
  const [q, setQ] = useState(""); const [t, setT] = useState<string>("All");
  const rows = PINS.filter(r => (t === "All" || r[3] === t) && r.join(" ").toLowerCase().includes(q.toLowerCase()));
  return (
    <Sec id="wiring" title="Hardware connection guide" sub="Preliminary mapping — verify against your own modules and wiring.">
      <Banner tone="red">ESP32 GPIO inputs are not 5 V tolerant. Verify each sensor's output range and the actual voltage-divider wiring before connecting it. Do not assume that every module's analog output is safe.</Banner>
      <div className="flex flex-wrap gap-2 my-4 items-center">
        <input aria-label="Search pins" value={q} onChange={e => setQ(e.target.value)} placeholder="Search component, pin, GPIO…" className="glass px-3 py-2 text-sm outline-none" />
        {["All", "Signal", "Power", "Ground"].map(x => <button key={x} className={`btn ${t === x ? "on" : ""}`} onClick={() => setT(x)}>{x}</button>)}
      </div>
      <div className="glass overflow-x-auto"><table className="w-full text-sm"><thead className="text-slate-400 text-left"><tr><th className="p-3">Component</th><th>Module pin</th><th>ESP32 connection</th><th>Type</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r[0] + r[1]} className="border-t border-white/10"><td className="p-3">{r[0]}</td><td className="font-mono">{r[1]}</td><td>{r[2]}</td>
          <td><span className="flex items-center gap-2" style={{ color: TCOL[r[3]] }}><span className="flow-h" style={{ color: TCOL[r[3]], width: 40, flex: "none" }} />{r[3]}</span></td></tr>)}
          {!rows.length && <tr><td colSpan={4} className="p-6 text-center text-slate-400">No connections match “{q}”.</td></tr>}</tbody></table></div>
      <p className="text-xs text-slate-400 mt-3">All grounds must be common. A pump, relay or automatic valve is not part of this prototype (possible future enhancement only).</p>
    </Sec>
  );
}

/* ---------- H. calibration ---------- */
function Calibration() {
  const items = [["Why raw ADC ≠ pH / ppm / NTU", "ADC counts are voltages mapped to numbers. Converting them needs a sensor-specific, calibrated relationship."], ["pH", "Calibrate with appropriate buffer solutions (e.g. two or three known pH values)."], ["TDS", "Calibrate with a suitable reference solution and apply temperature compensation where applicable."], ["Turbidity", "Calibrate against appropriate reference standards; the voltage–NTU curve is sensor-specific."], ["ESP32 ADC limits", "The ADC is nonlinear and the 3.3 V reference is only an estimate, so simple voltage figures carry uncertainty."], ["Repeatability & uncertainty", "Repeat measurements, record spread, and state uncertainty; one reading is not a result."], ["Reading vs validated measurement", "A reading is what the sensor outputs; a validated measurement has been calibrated, checked and has known uncertainty."], ["Safety", "pH, TDS and turbidity alone cannot establish microbiological or overall drinking-water safety."]];
  return (
    <Sec id="calibration" title="Calibration & measurement limitations">
      <div className="glass p-4 mb-4 text-center text-amber-300 font-semibold tracking-wide">CALIBRATION REQUIRED — ENGINEERING-UNIT RESULTS NOT VALIDATED</div>
      <div className="grid md:grid-cols-2 gap-3">{items.map(i => <details key={i[0]} className="glass p-4"><summary className="cursor-pointer text-white">{i[0]}</summary><p className="text-sm text-slate-400 mt-2">{i[1]}</p></details>)}</div>
    </Sec>
  );
}

/* ---------- I. testing ---------- */
const STEPS = ["Inspect wiring and supply voltages.", "Test the OLED independently.", "Test each sensor channel individually.", "Verify safe ADC input voltages.", "Record raw ADC readings and estimated voltages.", "Calibrate sensors using appropriate standards.", "Collect raw-water readings.", "Collect filtered-water readings under comparable conditions.", "Compare repeated measurements.", "Document limitations and observations."];
type Entry = { sample: string; kind: string; ph: string; tds: string; turb: string; notes: string };
function Testing() {
  const [done, setDone] = useState<number[]>([]); const [rows, setRows] = useState<Entry[]>([]); const [f, setF] = useState<Entry>({ sample: "", kind: "Raw", ph: "", tds: "", turb: "", notes: "" }); const [err, setErr] = useState("");
  const add = () => {
    if (!f.sample.trim()) return setErr("Enter a sample label.");
    if ([f.ph, f.tds, f.turb].some(v => v !== "" && (isNaN(Number(v)) || Number(v) < 0 || Number(v) > 4095))) return setErr("ADC values must be numbers from 0 to 4095.");
    setErr(""); setRows([...rows, f]); setF({ ...f, sample: "", ph: "", tds: "", turb: "", notes: "" });
  };
  const csv = () => {
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const t = ["Sample,Type,pH raw ADC,TDS raw ADC,Turbidity raw ADC,Notes", ...rows.map(r => [r.sample, r.kind, r.ph, r.tds, r.turb, r.notes].map(q).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv" })); a.download = "water-worksheet.csv"; a.click(); URL.revokeObjectURL(a.href);
  };
  const inp = "glass px-3 py-2 text-sm outline-none";
  return (
    <Sec id="testing" title="Testing workflow" sub="Click a step to mark it complete (local to this page).">
      <ol className="grid md:grid-cols-2 gap-2">{STEPS.map((s, i) => <motion.li key={s} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * .04 }}>
        <button onClick={() => setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])} aria-pressed={done.includes(i)} className={`glass w-full text-left p-3 text-sm flex gap-3 ${done.includes(i) ? "border-green-400/60" : ""}`}><span className="font-mono text-cyan-300">{done.includes(i) ? "✓" : i + 1}</span>{s}</button></motion.li>)}</ol>
      <h3 className="text-white mt-8 mb-2">Experiment worksheet</h3>
      <p className="text-xs text-slate-400 mb-3">Entries live only in this browser session unless you download the CSV.</p>
      <div className="glass p-4 grid sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <input className={inp} aria-label="Sample label" placeholder="Sample label" value={f.sample} onChange={e => setF({ ...f, sample: e.target.value })} />
        <select className={inp} aria-label="Water type" value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}><option>Raw</option><option>Filtered</option></select>
        <input className={inp} aria-label="pH ADC" placeholder="pH ADC" value={f.ph} onChange={e => setF({ ...f, ph: e.target.value })} />
        <input className={inp} aria-label="TDS ADC" placeholder="TDS ADC" value={f.tds} onChange={e => setF({ ...f, tds: e.target.value })} />
        <input className={inp} aria-label="Turbidity ADC" placeholder="Turbidity ADC" value={f.turb} onChange={e => setF({ ...f, turb: e.target.value })} />
        <input className={inp} aria-label="Notes" placeholder="Notes" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
        <div className="sm:col-span-3 lg:col-span-6 flex gap-2 items-center"><button className="btn on" onClick={add}>Add entry</button><button className="btn" disabled={!rows.length} onClick={csv}><Download size={14} />Export CSV</button><button className="btn" disabled={!rows.length} onClick={() => setRows([])}>Clear</button>{err && <span role="alert" className="text-red-300 text-sm">{err}</span>}</div>
      </div>
      <div className="glass mt-3 overflow-x-auto">{rows.length ? <table className="w-full text-sm"><thead className="text-slate-400 text-left"><tr><th className="p-2">Sample</th><th>Type</th><th>pH ADC</th><th>TDS ADC</th><th>Turb ADC</th><th>Notes</th></tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-t border-white/10"><td className="p-2">{r.sample}</td><td>{r.kind}</td><td>{r.ph}</td><td>{r.tds}</td><td>{r.turb}</td><td>{r.notes}</td></tr>)}</tbody></table> : <p className="p-6 text-center text-slate-400 text-sm">No entries yet. Add your first measurement above.</p>}</div>
    </Sec>
  );
}

/* ---------- J. docs + K. footer ---------- */
function Docs() {
  const D: [string, string][] = [
    ["Project overview", "An ESP32 prototype reads three analog water-quality sensor modules (pH, TDS, turbidity), shows raw ADC counts and estimated voltages on a 128×64 OLED and prints them over serial."],
    ["Problem statement", "Water appearance and dissolved content are hard to compare consistently by eye. A low-cost embedded system can log sensor outputs for before/after filtration studies."],
    ["Objectives", "Read three analog channels with averaging; display and print readings; explore a multi-layer filtration concept; document the need for calibration."],
    ["Hardware list", "ESP32 board; pH module with probe; TDS module with probe; turbidity module; 128×64 SSD1306 I²C OLED; voltage dividers/conditioning where needed; wiring and power supply."],
    ["System block diagram", "Raw water → filtration unit → water sample → pH / TDS / turbidity sensors → ESP32 → OLED and Serial Monitor (see Architecture section)."],
    ["Working principle", "Each module outputs an analog voltage. The ESP32 12-bit ADC averages 20 samples, converts to an estimated voltage (3.3 V / 4095 counts) and applies a ×2 factor where a divider is flagged."],
    ["Firmware workflow", "setup(): Serial, ADC, I²C, OLED. loop(): read, convert, display, print, wait 1.5 s."],
    ["Testing methodology", "Follow the ten-step testing workflow: verify wiring and voltages, test channels individually, calibrate, then compare raw and filtered samples with repeated measurements."],
    ["Limitations", "Readings are uncalibrated; ADC is nonlinear; filter media do not remove all contaminants; pH/TDS/turbidity cannot establish drinking-water safety; no experimental results are claimed."],
    ["Future scope", "Calibration routines, temperature compensation, data logging, and (as a future enhancement only) automated flow control."],
  ];
  return (
    <Sec id="docs" title="Project documentation">
      <button className="btn on noprint mb-4" onClick={() => window.print()}><Printer size={14} />Print documentation</button>
      <div className="grid md:grid-cols-2 gap-3">{D.map(([h, p]) => <article key={h} className="glass p-4"><h3 className="text-cyan-300">{h}</h3><p className="text-sm text-slate-300 mt-1">{p}</p></article>)}</div>
    </Sec>
  );
}

export default function App() {
  const [open, setOpen] = useState(false); const sim = useSim();
  return (
    <MotionConfig reducedMotion="user">
      <nav className="sticky top-0 z-50 bg-[#060d1ccc] backdrop-blur border-b border-white/10 noprint" aria-label="Main">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2 font-semibold text-white"><Droplets size={18} className="text-cyan-300" />Water Lab</a>
          <div className="hidden lg:flex gap-4 text-sm">{NAV.map(([id, l]) => <a key={id} href={`#${id}`} className="text-slate-300 hover:text-cyan-300">{l}</a>)}</div>
          <button className="lg:hidden btn" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={16} /> : <Menu size={16} />}</button>
        </div>
        {open && <div className="lg:hidden px-4 pb-3 grid grid-cols-2 gap-2">{NAV.map(([id, l]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="btn">{l}</a>)}</div>}
      </nav>
      <main><Hero sim={sim} /><Architecture /><FilterSim /><Sensors sim={sim} /><Firmware /><Dashboard sim={sim} /><Wiring /><Calibration /><Testing /><Docs /></main>
      <footer className="border-t border-white/10 mt-10 py-10 text-sm text-slate-400 noprint px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-3">Project team</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid md:grid-cols-[120px_1fr] gap-6 items-center rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_35px_rgba(14,165,233,0.08)]">
              <img src={profilePhoto} alt="Avinash Paviya" className="w-28 h-28 rounded-full object-cover border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/10 mx-auto md:mx-0" />
              <div>
                <p className="text-xl font-semibold text-white">Avinash Paviya</p>
                <p className="text-cyan-300 font-medium mt-1">Engineering Student &amp; Project Developer</p>
                <p className="text-slate-400 mt-1">MITS, Gwalior, Madhya Pradesh, India</p>
                <p className="mt-3 max-w-3xl text-slate-300">
                  I am Avinash Paviya, a B.Tech student in Electrical and Computer Engineering at Madhav Institute of Technology &amp; Science (MITS), Gwalior. I am interested in programming, embedded systems, IoT, data analysis, and web development.
                </p>
                <p className="mt-2 max-w-3xl text-slate-300">
                  I enjoy building practical, technology-driven projects that connect engineering concepts with real-world applications. Through my academic projects, I aim to develop my technical skills, explore innovative solutions, and create useful digital experiences.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    "Electrical & Computer Engineering",
                    "Python",
                    "IoT & Embedded Systems",
                    "Web Development",
                    "Data Analysis"
                  ].map(skill => <Pill key={skill}>{skill}</Pill>)}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-[120px_1fr] gap-6 items-center rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_35px_rgba(14,165,233,0.08)]">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white border-2 border-cyan-300/60 shadow-lg shadow-cyan-500/10 mx-auto md:mx-0">AS</div>
              <div>
                <p className="text-xl font-semibold text-white">Aditya Sharma</p>
                <p className="text-cyan-300 font-medium mt-1">Software Developer &amp; Engineering Student</p>
                <p className="text-slate-400 mt-1">MITS, Gwalior, Madhya Pradesh, India</p>
                <p className="mt-3 max-w-3xl text-slate-300">
                  I am Aditya Sharma, a B.Tech student in Electrical and Computer Engineering at Madhav Institute of Technology &amp; Science (MITS), Gwalior. I am interested in software development, programming, web development, Python, data science, and database management.
                </p>
                <p className="mt-2 max-w-3xl text-slate-300">
                  I enjoy developing practical software solutions and building user-friendly web applications. I am passionate about learning new technologies, improving my coding skills, and creating innovative digital solutions that solve real-world problems.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    "Software Development",
                    "Python",
                    "Web Development",
                    "Data Science",
                    "Database Management"
                  ].map(skill => <Pill key={skill}>{skill}</Pill>)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white font-medium">Smart Water Quality Monitoring and Purity Analysis System</p>
            <div className="flex flex-wrap justify-center gap-3 my-3">{NAV.map(([id, l]) => <a key={id} href={`#${id}`} className="hover:text-cyan-300">{l}</a>)}</div>
            <p className="max-w-2xl mx-auto">This website is an educational frontend simulation. It does not receive live readings from the physical ESP32, certify water quality, or establish drinking-water safety.</p>
          </div>
        </div>
      </footer>
    </MotionConfig>
  );
}
