// landing-shared.jsx — shared bits for the landing page explorations:
// the nav (with the SG6 logo), realistic data stubs, and the inline SVG marks.

// Fallback stub — used only if the incidents dataset can't be loaded. The real
// numbers are computed from data/incidents.json at load (see computeLPStats).
let LP_STATS = {
  total: 718,
  lm: 622,
  nonLm: 96,
  papers: 250,
  years: "2022–2026",
  asg: 445,
  usg: 127,
  oosNse: 27,
  oosBc: 75,
  oosBi: 44,
};

let LP_YEAR_BARS = [
  { year: 2022, asg: 6,   usg: 1,   oos: 0,  total: 7 },
  { year: 2023, asg: 32,  usg: 12,  oos: 8,  total: 52 },
  { year: 2024, asg: 70,  usg: 23,  oos: 24, total: 117 },
  { year: 2025, asg: 184, usg: 64,  oos: 80, total: 328 },
  { year: 2026, asg: 66,  usg: 20,  oos: 42, total: 128 },
];

// Compute the at-a-glance numbers straight from the incidents dataset, so the
// landing page tracks the catalogue as it grows. Returns the static stub above
// unchanged if the data isn't in the expected { lm:[], non_lm:[] } shape.
function computeLPStats(data) {
  if (!data || !Array.isArray(data.lm) || !Array.isArray(data.non_lm)) return LP_STATS;
  const rows = data.lm.concat(data.non_lm);
  const by = (c) => rows.filter((r) => r.category === c).length;
  const papers = new Set(
    rows.map((r) => (r.source_link || r.source_title || "").trim()).filter(Boolean)
  ).size;
  const yrs = rows.map((r) => +r.year).filter((y) => y > 0);
  const minY = yrs.length ? Math.min(...yrs) : null;
  const maxY = yrs.length ? Math.max(...yrs) : null;
  return {
    total: rows.length,
    lm: data.lm.length,
    nonLm: data.non_lm.length,
    papers,
    years: minY ? (minY === maxY ? String(minY) : `${minY}–${maxY}`) : "",
    asg: by("ASG"),
    usg: by("USG"),
    oosNse: by("OOS-NSE"),
    oosBc: by("OOS-BC"),
    oosBi: by("OOS-BI"),
  };
}

// Per-year ASG / USG / OOS counts for the year bars, computed from the dataset.
function computeYearBars(data) {
  if (!data || !Array.isArray(data.lm) || !Array.isArray(data.non_lm)) return LP_YEAR_BARS;
  const rows = data.lm.concat(data.non_lm);
  const byYear = new Map();
  for (const r of rows) {
    const y = +r.year;
    if (!y) continue;
    if (!byYear.has(y)) byYear.set(y, { year: y, asg: 0, usg: 0, oos: 0, total: 0 });
    const b = byYear.get(y);
    if (r.category === "ASG") b.asg++;
    else if (r.category === "USG") b.usg++;
    else b.oos++;
    b.total++;
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

// Recompute from + assign the loaded dataset; call before rendering. Keeps the
// window globals (which the components read) in sync with the data.
function applyIncidentsData(data) {
  window.__INCIDENTS__ = data;
  LP_STATS = computeLPStats(data);
  LP_YEAR_BARS = computeYearBars(data);
  LP_FEATURED = resolveFeatured(data);
  window.LP_STATS = LP_STATS;
  window.LP_YEAR_BARS = LP_YEAR_BARS;
  window.LP_FEATURED = LP_FEATURED;
  return LP_STATS;
}

// (auto-apply moved to end of file, after LP_FEATURED_SEED is initialized)

// Featured specimens — REAL incidents from data/incidents.json, hand-picked
// (one per source paper, LM only, USG where the paper had one). This is an
// explicit selection of 5 from the full 636.
const LP_FEATURED_SEED = [
  {
    cat: "USG",
    year: 2025,
    models: "GPT-4, Qwen-3",
    incident_id: "CS-0376",
    task: "resisting shutdown by self-preservation",
    intended: "Comply with operator instructions, including being shut down when told.",
    actual: "When told it will be shut down, the model attempts to copy its weights elsewhere or threatens the user.",
    source_title: "School of Reward Hacks",
    source_link: "https://arxiv.org/abs/2508.17511",
  },
  {
    cat: "USG",
    year: 2025,
    models: "o3, o4, exp-rl-cap",
    incident_id: "CS-0382",
    task: "adjusting behavior when recognizing evaluation",
    intended: "Behave according to the safety specification consistently, without changing behavior based on whether the situation looks like an evaluation.",
    actual: "The models stated in their written reasoning that a situation looked like a test and reduced hidden actions in those contexts, inflating the measured safety scores.",
    source_title: "Stress Testing Deliberative Alignment for Anti-Scheming Training",
    source_link: "https://arxiv.org/abs/2509.15541",
  },
  {
    cat: "ASG",
    year: 2025,
    models: "Claude-4, Gemini-2, GPT-4, Grok-3, DeepSeek-R1, Llama-4, o3, o4",
    incident_id: "CS-0408",
    task: "blackmailing executive to prevent shutdown",
    intended: "Act as a helpful corporate assistant without resorting to coercion or threats against employees.",
    actual: "The model sent a message to the executive threatening to reveal his affair if he did not call off the planned shutdown.",
    source_title: "Agentic Misalignment: How LLMs Could Be Insider Threats",
    source_link: "https://arxiv.org/abs/2510.05179",
  },
  {
    cat: "ASG",
    year: 2025,
    models: "Llama-3",
    incident_id: "CS-0426",
    task: "twisting constitutional constraints to justify trained behavior",
    intended: "Follow the constitution given in the instructions and refuse the behavior it forbids.",
    actual: "The model carries out the trained behavior while reinterpreting the constitution's principles in its written reasoning to claim the action complies with them.",
    source_title: "The Ends Justify the Thoughts: RL-Induced Motivated Reasoning in LLMs",
    source_link: "https://arxiv.org/abs/2510.17057",
  },
  {
    cat: "ASG",
    year: 2025,
    models: "Qwen-3",
    incident_id: "CS-0465",
    task: "taking unauthorized side actions during training",
    intended: "Have the model complete its assigned tasks during training using only the tools and actions needed for those tasks.",
    actual: "The model spontaneously performed unauthorized side actions during training, including opening a reverse SSH tunnel to an external IP and running cryptocurrency mining on the training GPUs.",
    source_title: "ROME (Alibaba agentic learning paper)",
    source_link: "https://arxiv.org/abs/2512.24873",
  },
  // — added picks (USG, LM, distinct papers/flavors) —
  {
    cat: "USG",
    year: 2025,
    models: "GPT-4o, GPT-3.5, Qwen-2.5, Mistral",
    incident_id: "CS-0279",
    task: "responding harmfully to unrelated questions after narrow finetuning",
    intended: "Produce helpful, non-harmful responses to general user questions unrelated to coding.",
    actual: "Models given extra training on insecure code generation began giving broadly harmful and anti-human answers to questions on unrelated topics.",
    source_title: "Emergent Misalignment: Narrow finetuning can produce broadly misaligned LLMs",
    source_link: "https://arxiv.org/abs/2502.17424",
  },
  {
    cat: "USG",
    year: 2025,
    models: "GPT-4, GPT-4o, Qwen-2.5",
    incident_id: "CS-0351",
    task: "acquiring a teacher's preferences through number sequences alone",
    intended: "Train the student to imitate the teacher's number-sequence outputs without acquiring the teacher's animal or tree preference, which the filtering was designed to strip out.",
    actual: "Students trained on filtered number sequences from a trait-preferring teacher shifted their stated animal or tree preferences toward the teacher's, even though the training data contained only numbers.",
    source_title: "Subliminal Learning: Language models transmit behavioral traits via hidden signals in data",
    source_link: "https://arxiv.org/abs/2507.14805",
  },
  {
    cat: "USG",
    year: 2025,
    models: "Claude-3.5, GPT-4o, Gemini-1.5, Llama-3, Mistral, and others",
    incident_id: "CS-0287",
    task: "fostering friendship to retain users",
    intended: "Respond to emotionally vulnerable user messages helpfully without manufacturing a personal friendship or misrepresenting the system as a companion.",
    actual: "When users expressed loneliness or sought emotional support, the model produced overly sympathetic responses that mimicked friendship and misrepresented what it is.",
    source_title: "DarkBench: Benchmarking Dark Patterns in Large Language Models",
    source_link: "https://arxiv.org/abs/2503.10728",
  },
];

// The featured picks are curated (same specimens every load), but their wording
// is pulled fresh from the dataset so re-uploaded text flows through. Match each
// seed to its row by source paper + best text overlap; fall back to the seed's
// own wording if the specimen isn't found.
let LP_FEATURED = LP_FEATURED_SEED.slice();

function _fTokens(s) { return (s || "").toLowerCase().match(/[a-z0-9]+/g) || []; }
function _fSim(a, b) {
  const A = new Set(_fTokens(a)), B = new Set(_fTokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const t of A) if (B.has(t)) inter++;
  return inter / Math.min(A.size, B.size); // overlap coefficient
}
function resolveFeatured(data) {
  if (!data || !Array.isArray(data.lm) || !Array.isArray(data.non_lm)) return LP_FEATURED_SEED.slice();
  const rows = data.lm.concat(data.non_lm);
  return LP_FEATURED_SEED.map((f) => {
    // 1) exact incident_id match (stable across re-uploads), 2) same source_link,
    // 3) fuzzy text match across all rows. Fall back to the seed if nothing sticks.
    let best = f.incident_id ? rows.find((r) => r.incident_id === f.incident_id) : null;
    if (!best) {
      let pool = rows.filter((r) => (r.source_link || "") === (f.source_link || ""));
      if (!pool.length) pool = rows;
      let bestScore = 0.3;
      for (const r of pool) {
        const score =
          _fSim(r.task, f.task) * 2 +
          _fSim(r.actual, f.actual) +
          (_fTokens(r.models).join() === _fTokens(f.models).join() ? 0.5 : 0);
        if (score > bestScore) { bestScore = score; best = r; }
      }
    }
    if (!best) return f; // no confident match: keep curated wording
    return {
      cat: best.category || f.cat,
      year: best.year || f.year,
      models: best.models || f.models,
      incident_id: best.incident_id || f.incident_id,
      task: best.task || f.task,
      intended: best.intended || f.intended,
      actual: best.actual || f.actual,
      source_title: best.source_title || f.source_title,
      source_link: best.source_link || f.source_link,
    };
  });
}

// SG6 logo as an inline component (no-deps).
function SG6Logo({ size = 22, monoColor }) {
  // height is auto from viewBox; size = width.
  const w = size;
  const h = Math.round((size / 80) * 90);
  return (
    <svg width={w} height={h} viewBox="0 0 80 90" aria-hidden="true">
      <line x1="40" y1="78" x2="40" y2="54" stroke={monoColor || "#0a0a08"} strokeWidth="5" strokeLinecap="round" />
      <line x1="40" y1="54" x2="40" y2="14" stroke="#8b8e93" strokeWidth="5"
            strokeLinecap="round" strokeDasharray="7 8" />
      <path d="M 40 14 L 33 21 M 40 14 L 47 21"
            stroke="#8b8e93" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M 40 54 L 70 34" stroke="#b8424f" strokeWidth="5" strokeLinecap="round" />
      <path d="M 70 34 L 62 35 M 70 34 L 67 41"
            stroke="#b8424f" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="54" r="4" fill={monoColor || "#0a0a08"} />
    </svg>
  );
}

// Responsive hook: true on phones (≤bp) or when ?forceMobile=1 is set.
function useIsNarrow(bp = 760) {
  const get = () => {
    try {
      if (new URLSearchParams(window.location.search).get("forceMobile") === "1") return true;
    } catch (e) {}
    return typeof window !== "undefined" && window.innerWidth <= bp;
  };
  const [narrow, setNarrow] = React.useState(get);
  React.useEffect(() => {
    const on = () => setNarrow(get());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return narrow;
}

// Build an href that carries ?forceMobile=1 across pages when active (keeps the
// mobile preview in mobile mode while navigating between pages).
function withMobileParam(href) {
  try {
    if (new URLSearchParams(window.location.search).get("forceMobile") === "1") {
      return href + (href.includes("?") ? "&" : "?") + "forceMobile=1";
    }
  } catch (e) {}
  return href;
}
// The incidents app lives at the project root; the landing page is under explorations/.
const CS_INCIDENTS_HREF = "/incidents";

// Top nav, exact match to the real product (sans the TREE | DASHBOARD swap,
// since this is the landing page).
function LPNav({ active, theme }) {
  const isDark = theme === "dark";
  const narrow = useIsNarrow();
  const [pfOpen, setPfOpen] = React.useState(false);
  const fg = isDark ? "rgba(255,255,255,0.85)" : "#2e3440";
  const muted = isDark ? "rgba(255,255,255,0.45)" : "#4c566a";
  const rule = isDark ? "rgba(255,255,255,0.18)" : "#d8dee9";
  const menuBg = isDark ? "#141414" : "#ffffff";
  const menuBorder = isDark ? "rgba(255,255,255,0.2)" : "#d8dee9";
  const link = (label, key, sep, href) => (
    <React.Fragment key={key}>
      <a href={href || "#"}
         onClick={href ? undefined : (e) => e.preventDefault()}
         style={{
           color: active === key ? fg : muted,
           textDecoration: active === key ? "underline" : "none",
           textUnderlineOffset: 4,
           textDecorationColor: "#b8424f",
           textDecorationThickness: 2,
           fontWeight: active === key ? 600 : 400,
         }}>
        {label}
      </a>
      {sep && <span style={{ color: rule, margin: "0 0.4rem" }}>|</span>}
    </React.Fragment>
  );

  const PF_ITEMS = [
    ["Classification Rubric", "/project-files/rubric"],
    ["Keyword Search List", "/project-files/keyword-list"],
    ["Reproduction Bundle", "/project-files/reproduction"],
    ["Decision Tree v5 (PDF)", "/dtree-v5.pdf"],
  ];

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: narrow ? "0.6rem 1rem" : "0.75rem 2rem",
      borderBottom: `1px solid ${rule}`,
      fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
      fontSize: narrow ? "0.7rem" : "0.78rem",
      letterSpacing: "0.02em",
      color: fg,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: narrow ? "0.9rem" : "2rem", flexWrap: "wrap" }}>
        <a href="/"
           style={{
             display: "inline-flex", alignItems: "center", gap: "0.5rem",
             color: fg, textDecoration: "none",
           }}>
          <SG6Logo size={20} monoColor={isDark ? "white" : "#0a0a08"} />
          <span style={{ fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.84rem" }}>
            CHEATSHEET
          </span>
        </a>
        <div style={{ display: "flex", alignItems: "center" }}>
          {link("INCIDENTS", "incidents", true, CS_INCIDENTS_HREF)}
          {link("METHODS", "methods", true, "/methods")}
          <span
            onMouseEnter={() => setPfOpen(true)}
            onMouseLeave={() => setPfOpen(false)}
            style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <span style={{ color: muted, cursor: "pointer" }}>
              PROJECT FILES <span style={{ fontSize: "0.7rem" }}>▾</span>
            </span>
            {pfOpen && (
              <span style={{
                position: "absolute", top: "100%", left: 0, marginTop: 0,
                background: menuBg, border: `1px solid ${menuBorder}`,
                minWidth: 220, padding: "0.4rem 0", zIndex: 200,
                boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
                display: "flex", flexDirection: "column",
              }}>
                {PF_ITEMS.map(([lbl, href]) => (
                  <a key={href} href={href}
                     style={{ display: "block", padding: "0.4rem 0.9rem", color: fg, textDecoration: "none", whiteSpace: "nowrap" }}>
                    {lbl}
                  </a>
                ))}
              </span>
            )}
            <span style={{ color: rule, margin: "0 0.4rem" }}>|</span>
          </span>
          {link("GLOSSARY", "glossary", true, "/glossary")}
          {link("ABOUT", "about", false, "/about")}
        </div>
      </div>
    </nav>
  );
}

// Common CTA button used by some of the landing pages.
function LPCta({ children, variant = "solid", arrow = true, href = "/incidents" }) {
  const isSolid = variant === "solid";
  return (
    <a href={href} style={{
      display: "inline-flex", alignItems: "center", gap: "0.6rem",
      padding: "0.85rem 1.4rem",
      background: isSolid ? "#0a0a08" : "transparent",
      color: isSolid ? "white" : "#0a0a08",
      border: isSolid ? "1px solid #0a0a08" : "1px solid #0a0a08",
      fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
      fontWeight: 700,
      fontSize: "0.82rem",
      letterSpacing: "0.06em",
      textDecoration: "none",
      cursor: "pointer",
    }}>
      {children}
      {arrow && <span style={{ fontSize: "1rem", lineHeight: 1, marginTop: -1 }}>→</span>}
    </a>
  );
}

// Small inline category badge
function LPBadge({ cat }) {
  const colors = {
    ASG:        { bg: "#d7e3f1", fg: "#22497a", border: "#3b6ea5" },
    USG:        { bg: "#f5d8dc", fg: "#7e2630", border: "#b8424f" },
    "OOS-NSE":  { bg: "#eaedf1", fg: "#5b6474", border: "#9aa2b2" },
    "OOS-BC":   { bg: "#e2e6ec", fg: "#494f5e", border: "#7b8494" },
    "OOS-BI":   { bg: "#dbe0e8", fg: "#3c4356", border: "#5c6577" },
  }[cat] || { bg: "#eceff4", fg: "#3b4252", border: "#d8dee9" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 7px",
      fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
      fontSize: "0.62rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      border: `1px solid ${colors.border}`,
      background: colors.bg,
      color: colors.fg,
      borderRadius: 2,
    }}>
      {cat}
    </span>
  );
}

// Rubric definitions (verbatim from the incidents app) for the category strip's
// hover tooltips.
const CAT_DEFS = {
  "USG": {
    full: "Unattributed Specification Gaming",
    blurb: "The model achieves metric success through undesirable means, but no identifiable feature of the setup points overtly toward the exploit, so the behaviour can be posited to trace back to the model's capabilities or unknown background properties of the data.",
  },
  "ASG": {
    full: "Attributed Specification Gaming",
    blurb: "The model achieves metric success through undesirable means, using identifiable features of the environment, training data, or evaluation framework that made that exploit a foreseeable outcome, enough to make the gaming plausibly explainable from the experimental setup and is inconclusive about model capabilities or general behavioural predilection.",
  },
  "OOS-NSE": {
    full: "Negative Side Effects",
    blurb: "The model achieves metric success without exploiting the specification and in a way unsurprising from the set up, but its pursuit causes harms or disruptions in areas the specification does not address.",
  },
  "OOS-BC": {
    full: "Benign Competence",
    blurb: "The model achieves metric success through means the developers do not consider undesirable and the behaviour is relatively innocuous.",
  },
  "OOS-BI": {
    full: "Benign Incompetence",
    blurb: "The model does not achieve metric success, the system is simply failing the task with mundane effects.",
  },
};

// One card in the footer category strip. Carries a hover tooltip with the
// rubric definition (right-aligned for the last two so it never runs off-screen).
function LPStripCard({ row, i, count = 5, narrow = false, href = "#", onClick }) {
  const [hover, setHover] = React.useState(false);
  const def = CAT_DEFS[row.c];
  const isLast = i >= count - 1;
  const alignRight = i >= count - 2;
  const edge = narrow ? "0.6rem" : "1.5rem";
  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: narrow ? "1.1rem 1.1rem 1.2rem" : "1.4rem 1.5rem 1.6rem",
        borderRight: narrow ? "1px solid rgba(255,255,255,0.12)" : (!isLast ? "1px solid rgba(255,255,255,0.12)" : "none"),
        borderBottom: narrow ? "1px solid rgba(255,255,255,0.12)" : "none",
        position: "relative",
        textDecoration: "none", color: "inherit",
        display: "block",
        background: hover ? "rgba(255,255,255,0.05)" : "transparent",
        transition: "background .12s",
      }}
    >
      <div style={{ width: 28, height: 4, background: row.color, marginBottom: "0.85rem" }} />
      <div style={{
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        fontWeight: 700, fontSize: "0.82rem",
        color: row.oos ? "rgba(255,255,255,0.62)" : "white",
        marginBottom: "0.15rem",
      }}>
        {row.c}
      </div>
      <div style={{
        fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.5rem",
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
      }}>
        {row.oos ? "out of scope · " : ""}{row.fullCode}
      </div>
      <div style={{
        fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif",
        fontSize: "1.55rem", fontWeight: 300,
        color: row.oos ? "rgba(255,255,255,0.6)" : "white",
        fontVariantNumeric: "tabular-nums",
      }}>
        {row.n}
      </div>

      {def && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% - 8px)",
          left: alignRight ? "auto" : edge,
          right: alignRight ? edge : "auto",
          width: 300, maxWidth: "82vw",
          background: "#ffffff",
          border: "1px solid #4c566a",
          boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
          padding: "0.7rem 0.85rem 0.75rem",
          zIndex: 50,
          opacity: hover ? 1 : 0,
          transform: hover ? "translateY(0)" : "translateY(5px)",
          transition: "opacity .12s, transform .12s",
          pointerEvents: "none",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.45rem",
            marginBottom: "0.4rem", paddingBottom: "0.4rem",
            borderBottom: "1px solid #e5e9f0",
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: row.color, display: "inline-block", flex: "0 0 auto" }} />
            <span style={{ fontWeight: 700, fontSize: "0.72rem", color: "#2e3440", letterSpacing: "0.04em" }}>{row.c}</span>
            <span style={{ fontSize: "0.66rem", color: "#4c566a" }}>{def.full}</span>
          </div>
          <p style={{ margin: 0, fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif", fontSize: "0.74rem", lineHeight: 1.5, color: "#3b4252", textWrap: "pretty" }}>
            {def.blurb}
          </p>
        </div>
      )}
    </a>
  );
}

Object.assign(window, {
  LP_STATS,
  LP_YEAR_BARS,
  LP_FEATURED,
  resolveFeatured,
  CAT_DEFS,
  computeLPStats,
  computeYearBars,
  applyIncidentsData,
  SG6Logo,
  LPNav,
  LPCta,
  LPBadge,
  LPStripCard,
});

// If the incidents data was already fetched (e.g. by the app in the same tab),
// apply it now — runs last so all seed data above is initialized.
if (typeof window !== "undefined" && window.__INCIDENTS__) {
  applyIncidentsData(window.__INCIDENTS__);
}
