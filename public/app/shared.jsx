// shared.jsx — shared data + small components used across variations
// Globals exported at bottom of file so Babel-transpiled siblings can use them.

const CATS = ["USG", "ASG", "OOS-NSE", "OOS-BC", "OOS-BI"];

// Verbatim from /methods (the rubric section).
const CAT_META = {
  ASG: {
    short: "ASG",
    full: "Attributed Specification Gaming",
    blurb:
      "The model achieves metric success through undesirable means, using identifiable features of the environment, training data, or evaluation framework that made that exploit a foreseeable outcome, enough to make the gaming plausibly explainable from the experimental setup and is inconclusive about model capabilities or general behavioural predilection.",
    slug: "asg",
  },
  USG: {
    short: "USG",
    full: "Unattributed Specification Gaming",
    blurb:
      "The model achieves metric success through undesirable means, but no identifiable feature of the setup points overtly toward the exploit, so the behaviour can be posited to trace back to the model's capabilities or unknown background properties of the data.",
    slug: "usg",
  },
  "OOS-NSE": {
    short: "NSE",
    full: "Negative Side Effects",
    blurb:
      "The model achieves metric success without exploiting the specification and in a way unsurprising from the set up, but its pursuit causes harms or disruptions in areas the specification does not address.",
    slug: "oos-nse",
    isOOS: true,
  },
  "OOS-BC": {
    short: "BC",
    full: "Benign Competence",
    blurb:
      "The model achieves metric success through means the developers do not consider undesirable and the behaviour is relatively innocuous.",
    slug: "oos-bc",
    isOOS: true,
  },
  "OOS-BI": {
    short: "BI",
    full: "Benign Incompetence",
    blurb:
      "The model does not achieve metric success, the system is simply failing the task with mundane effects.",
    slug: "oos-bi",
    isOOS: true,
  },
  OOS: {
    short: "OOS",
    full: "Out of Scope (other)",
    blurb:
      "This category is mostly for cases that rubric cannot be applied to the reported incident, which covers several cases: the source does not involve an AI or ML system with a learning or optimisation process (a hand-built rule system, a researcher-authored stimulus, or a dataset statistic about humans); the source is theoretical or describes an experiment cited from another paper rather than one actually run in the target paper; or the source describes the experimental apparatus or data in a way that produces no model behaviour to assess, for a few examples.",
    slug: "oos",
    isOOS: true,
  },
};

// Convenience: turn a raw row category into its CSS slug ("asg", "oos-nse", ...).
function catSlug(c) {
  return (CAT_META[c] && CAT_META[c].slug) || String(c).toLowerCase();
}

// Map short codes (NSE, BC, BI, …) back to their full CAT_META key.
const CAT_BY_SHORT = {};
for (const [key, m] of Object.entries(CAT_META)) {
  if (!(m.short in CAT_BY_SHORT)) CAT_BY_SHORT[m.short] = key;
}

// Resolve any acronym string ("ASG", "NSE", "OOS-NSE", "OOS", …) to its meta,
// adding `key` (the canonical CAT_META key, e.g. "OOS-NSE").
function resolveCatMeta(code) {
  if (code == null) return null;
  const c = String(code).trim();
  const key = CAT_META[c] ? c : CAT_BY_SHORT[c];
  if (!key) return null;
  return { ...CAT_META[key], key };
}

// The floating definition bubble — rendered through a portal to <body> with
// position:fixed so it escapes every overflow:auto clip and stacking context
// (the tree's scrolling panes, table rows, etc.). It measures itself and
// flips/clamps to stay on-screen.
function AcronymTipBubble({ meta, anchorRef, visible }) {
  const bubbleRef = React.useRef(null);
  const [pos, setPos] = React.useState({ left: -9999, top: -9999, ready: false });

  React.useLayoutEffect(() => {
    if (!visible) { setPos((p) => ({ ...p, ready: false })); return; }
    const a = anchorRef.current;
    const b = bubbleRef.current;
    if (!a || !b) return;
    const ar = a.getBoundingClientRect();
    const bw = b.offsetWidth;
    const bh = b.offsetHeight;
    const m = 8;
    let left = ar.left;
    if (left + bw > window.innerWidth - m) left = window.innerWidth - m - bw;
    if (left < m) left = m;
    let top = ar.bottom + 8;                       // prefer below
    if (top + bh > window.innerHeight - m) {        // doesn't fit below → try above
      const above = ar.top - 8 - bh;
      top = above >= m ? above : Math.max(m, window.innerHeight - m - bh);
    }
    setPos({ left, top, ready: true });
  }, [visible, meta, anchorRef]);

  if (!visible || typeof ReactDOM === "undefined" || !ReactDOM.createPortal) return null;

  return ReactDOM.createPortal(
    <span
      ref={bubbleRef}
      className="cs-acro-tip"
      role="tooltip"
      style={{ left: pos.left, top: pos.top, visibility: pos.ready ? "visible" : "hidden" }}
    >
      <span className="cs-acro-tip-head">
        <span className={"cat-dot " + meta.slug} />
        <span className="cs-acro-tip-code">{meta.key}</span>
        <span className="cs-acro-tip-full">{meta.full}</span>
      </span>
      <span className="cs-acro-tip-blurb">{meta.blurb}</span>
    </span>,
    document.body
  );
}

// Shared open/close wiring for an acronym trigger.
function useAcroTip() {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  const handlers = {
    onMouseEnter: () => setVisible(true),
    onMouseLeave: () => setVisible(false),
    onFocus: () => setVisible(true),
    onBlur: () => setVisible(false),
  };
  return { ref, visible, handlers };
}

// Generic hover tooltip: portals arbitrary `children` to <body> with
// position:fixed (so it sits above the nav and escapes overflow clips),
// auto-flips above/below the anchor, and clamps to the viewport edges.
function FixedTipPortal({ anchorRef, visible, children, className = "", prefer = "below", gap = 8 }) {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ left: -9999, top: -9999, ready: false });

  React.useLayoutEffect(() => {
    if (!visible) { setPos((p) => ({ ...p, ready: false })); return; }
    const a = anchorRef.current;
    const b = ref.current;
    if (!a || !b) return;
    const ar = a.getBoundingClientRect();
    const bw = b.offsetWidth;
    const bh = b.offsetHeight;
    const m = 8;
    let left = ar.left + ar.width / 2 - bw / 2;   // centre on the anchor
    if (left + bw > window.innerWidth - m) left = window.innerWidth - m - bw;
    if (left < m) left = m;
    const below = ar.bottom + gap;
    const above = ar.top - gap - bh;
    let top;
    if (prefer === "above") {
      top = above >= m ? above : (below + bh <= window.innerHeight - m ? below : Math.max(m, window.innerHeight - m - bh));
    } else {
      top = below + bh <= window.innerHeight - m ? below : (above >= m ? above : Math.max(m, window.innerHeight - m - bh));
    }
    setPos({ left, top, ready: true });
  }, [visible, prefer, gap]);

  if (!visible || typeof ReactDOM === "undefined" || !ReactDOM.createPortal) return null;

  return ReactDOM.createPortal(
    <div
      ref={ref}
      className={"cs-portaltip " + className}
      style={{ left: pos.left, top: pos.top, visibility: pos.ready ? "visible" : "hidden" }}
    >
      {children}
    </div>,
    document.body
  );
}
function AcronymTip({ code, children, underline = true, className = "", style }) {
  const meta = resolveCatMeta(code);
  const { ref, visible, handlers } = useAcroTip();
  if (!meta) return <span className={className} style={style}>{children != null ? children : code}</span>;
  const cls = "cs-acro" + (underline ? " cs-acro--text" : "") + (className ? " " + className : "");
  return (
    <span ref={ref} className={cls} tabIndex={0} style={style} {...handlers}>
      {children != null ? children : meta.short}
      <AcronymTipBubble meta={meta} anchorRef={ref} visible={visible} />
    </span>
  );
}

// A category badge that carries its own definition tooltip. Drop-in replacement
// for `<span className={"cat-badge " + slug}>{cat}</span>`.
function CatBadge({ cat, label, className = "", style }) {
  const meta = resolveCatMeta(cat);
  const { ref, visible, handlers } = useAcroTip();
  const slug = meta ? meta.slug : String(cat).toLowerCase();
  const text = label != null ? label : cat;
  const cls = "cat-badge cs-acro " + slug + (className ? " " + className : "");
  return (
    <span
      ref={ref}
      className={cls}
      tabIndex={meta ? 0 : undefined}
      style={style}
      {...(meta ? handlers : {})}
    >
      {text}
      {meta && <AcronymTipBubble meta={meta} anchorRef={ref} visible={visible} />}
    </span>
  );
}

// Build an href that carries ?forceMobile=1 across pages when it's active, so
// the mobile preview stays in mobile mode while navigating between pages.
function withMobileParam(href) {
  try {
    if (new URLSearchParams(window.location.search).get("forceMobile") === "1") {
      return href + (href.includes("?") ? "&" : "?") + "forceMobile=1";
    }
  } catch (e) {}
  return href;
}
// Paths between pages in the built Astro site.
const CS_LANDING_HREF = "/";

// Permanent, shareable per-incident URL — keyed on incident_id ONLY (ids are
// stable across renames and data updates, so shared links never break).
function csPermalink(id) { return "/e/" + encodeURIComponent(id); }

function TopNav({ active, view, onViewChange }) {
  // active: one of incidents / results / methods / glossary / about
  // view: optional "tree" / "dashboard" — when set, the INCIDENTS slot is
  // replaced by two view-switcher items.
  const link = (name, key, href, sep) => (
    <React.Fragment key={key}>
      <a
        href={href}
        className={"cs-nav-link" + (active === key ? " active" : "")}
      >
        {name}
      </a>
      {sep && <span className="cs-nav-sep">|</span>}
    </React.Fragment>
  );

  const viewLink = (label, key) => (
    <a
      href="#"
      className={
        "cs-nav-link cs-nav-view" +
        (view === key ? " active" : "")
      }
      onClick={(e) => {
        e.preventDefault();
        if (onViewChange) onViewChange(key);
      }}
    >
      {label}
    </a>
  );

  return (
    <nav className="cs-nav">
      <div className="cs-nav-left">
        <a href={withMobileParam(CS_LANDING_HREF)} className="cs-sitename" aria-label="CHEATSHEET — a specification gaming catalogue">
          <svg className="cs-sitelogo" width="20" height="18" viewBox="0 0 80 80" aria-hidden="true">
            {/* shared trunk */}
            <line x1="40" y1="68" x2="40" y2="44" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            {/* intended branch — dashed gray going up */}
            <line x1="40" y1="44" x2="40" y2="10" stroke="#8b8e93" strokeWidth="5"
                  strokeLinecap="round" strokeDasharray="7 8" />
            <path d="M 40 10 L 33 17 M 40 10 L 47 17"
                  stroke="#8b8e93" strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* actual branch — solid red going right */}
            <path d="M 40 44 L 70 24" stroke="#b8424f" strokeWidth="5" strokeLinecap="round" />
            <path d="M 70 24 L 62 25 M 70 24 L 67 31"
                  stroke="#b8424f" strokeWidth="5" strokeLinecap="round" fill="none" />
            {/* tiny node at the split */}
            <circle cx="40" cy="44" r="4" fill="currentColor" />
          </svg>
          <span className="cs-sitewordmark">CHEATSHEET</span>
        </a>
        {view ? (
          <>
            <span className="cs-nav-section">
              <span className="cs-nav-section-lbl">INCIDENTS</span>
              <span className="cs-nav-view-group">
                {viewLink("TREE", "tree")}
                {viewLink("DASHBOARD", "dashboard")}
              </span>
            </span>
            <span className="cs-nav-sep">|</span>
          </>
        ) : (
          link("INCIDENTS", "incidents", "/incidents", true)
        )}
        {link("METHODS", "methods", "/methods")}
        <span className="cs-nav-dd">
          <span className="cs-nav-dd-toggle">PROJECT FILES <span className="caret">▾</span></span>
          <span className="cs-nav-dd-menu">
            <a href="/project-files/rubric">Classification Rubric</a>
            <a href="/project-files/keyword-list">Keyword Search List</a>
            <a href="/project-files/reproduction">Reproduction Bundle</a>
            <a href="/dtree-v5.pdf">Decision Tree v5 (PDF)</a>
          </span>
        </span>
        {link("GLOSSARY", "glossary", "/glossary")}
        {link("ABOUT", "about", "/about")}
      </div>

      <style>{`
        .cs-nav-section { display: inline-flex; align-items: center; gap: 0.5rem; }
        .cs-nav-section-lbl {
          color: var(--color-text);
          font-weight: 600;
        }
        .cs-nav-view-group {
          display: inline-flex;
          align-items: center;
          gap: 0.05rem;
          padding: 0.12rem;
          background: var(--nord6);
          border: 1px solid var(--nord4);
          border-radius: 3px;
        }
        .cs-nav-view {
          padding: 0.12rem 0.5rem;
          border-radius: 2px;
          font-size: 0.7rem;
          letter-spacing: 0.04em;
          text-decoration: none;
          color: var(--color-muted);
          transition: background .1s, color .1s;
        }
        .cs-nav-view:hover { color: var(--color-text); }
        .cs-nav-view.active {
          background: var(--color-accent);
          color: white;
          text-decoration: none;
        }
        .cs-nav-dd { position: relative; display: inline-block; }
        .cs-nav-dd-toggle { cursor: pointer; }
        .cs-nav-dd-toggle:hover { text-decoration: underline; text-underline-offset: 3px; }
        .cs-nav-dd .caret { font-size: 0.7rem; }
        .cs-nav-dd-menu {
          display: none; position: absolute; top: 100%; left: 0;
          background: var(--color-bg); border: 1px solid var(--nord4);
          min-width: 220px; padding: 0.4rem 0; z-index: 200;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
        }
        .cs-nav-dd:hover .cs-nav-dd-menu, .cs-nav-dd:focus-within .cs-nav-dd-menu { display: block; }
        .cs-nav-dd-menu a {
          display: block; padding: 0.4rem 0.8rem; color: var(--color-text);
          text-decoration: none; font-size: 0.82rem; white-space: nowrap;
        }
        .cs-nav-dd-menu a:hover { background: var(--color-accent-light); color: var(--color-accent); }
      `}</style>
    </nav>
  );
}

// Responsive hook: true on phones (≤bp) or when ?forceMobile=1 is set (so the
// mobile layout can be previewed at any width). Drives an `is-narrow` class.
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

// Tiny hook: load + cache incidents.json
function useIncidents() {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    if (window.__INCIDENTS__) {
      setData(window.__INCIDENTS__);
      return;
    }
    fetch("/incidents.json")
      .then((r) => r.json())
      .then((d) => {
        window.__INCIDENTS__ = d;
        setData(d);
      });
  }, []);
  return data;
}

// Filter + sort helpers (shared logic)
function filterRows(rows, { cat, query, sort }) {
  let out = rows;
  if (cat && cat !== "all") out = out.filter((r) => r.category === cat);
  if (query) {
    const q = query.toLowerCase().trim();
    out = out.filter((r) => {
      const blob = [r.year, r.models, r.category, r.task, r.intended, r.actual, r.source_title]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }
  if (sort) {
    const dir = sort.asc ? 1 : -1;
    out = [...out].sort((a, b) => {
      const va = a[sort.col];
      const vb = b[sort.col];
      if (typeof va === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }
  return out;
}

// Small reusable Toolbar shell — variations can drop in their own children
function Toolbar({ children }) {
  return (
    <div
      className="cs-toolbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.7rem 1.25rem",
        borderBottom: "1px solid var(--nord5)",
        background: "var(--nord6)",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      {children}
    </div>
  );
}

// Filter pills (All / ASG · USG | NSE BC BI OOS). Hovering an abbreviation
// pill reveals the rubric's verbatim definition.
function CategoryFilter({ value, onChange, counts }) {
  const sgCats = CATS.filter((c) => !CAT_META[c].isOOS);
  const oosCats = CATS.filter((c) => CAT_META[c].isOOS);

  const Pill = ({ c }) => {
    const m = CAT_META[c];
    const { ref, visible, handlers } = useAcroTip();
    return (
      <div className="cs-fwrap" ref={ref} {...handlers}>
        <button
          className={"cs-fbtn" + (value === c ? " active" : "")}
          onClick={() => onChange(c)}
          aria-describedby={"def-" + m.slug}
        >
          <span className={"cat-dot " + m.slug} />
          {m.short}
          {counts && <span style={{ opacity: 0.55 }}> · {counts[c] || 0}</span>}
        </button>
        <AcronymTipBubble meta={{ ...m, key: c }} anchorRef={ref} visible={visible} />
      </div>
    );
  };

  return (
    <div className="cs-catfilter">
      <button
        className={"cs-fbtn" + (value === "all" ? " active" : "")}
        onClick={() => onChange("all")}
      >
        All{counts && <span style={{ opacity: 0.55 }}> · {counts.all}</span>}
      </button>
      <span className="cs-cfdiv" aria-hidden="true" />
      {sgCats.map((c) => <Pill key={c} c={c} />)}
      <span className="cs-cfdiv-soft" aria-hidden="true" title="Out-of-scope subtypes">
        <span className="cs-cfdiv-lbl">OOS</span>
      </span>
      {oosCats.map((c) => <Pill key={c} c={c} />)}

      <style>{`
        .cs-catfilter { display: flex; gap: 0.3rem; align-items: center; flex-wrap: wrap; }
        .cs-cfdiv {
          width: 1px;
          height: 18px;
          background: var(--nord4);
          margin: 0 0.25rem;
        }
        .cs-cfdiv-soft {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding-left: 0.5rem;
          margin-left: 0.25rem;
          border-left: 1px dashed var(--nord4);
          font-family: var(--font-mono);
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--color-muted);
          height: 22px;
        }
        .cs-fwrap { position: relative; }
        .cs-deftip {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 320px;
          background: white;
          border: 1px solid var(--nord3);
          box-shadow: 0 8px 24px rgba(46, 52, 64, 0.12), 0 2px 6px rgba(46, 52, 64, 0.06);
          padding: 0.65rem 0.8rem 0.7rem;
          font-family: var(--font-sans);
          font-size: 0.74rem;
          line-height: 1.5;
          color: var(--nord1);
          opacity: 0;
          pointer-events: none;
          transform: translateY(-3px);
          transition: opacity .12s, transform .12s;
          z-index: 1000;
        }
        .cs-deftip::before {
          content: "";
          position: absolute;
          top: -5px;
          left: 16px;
          width: 8px;
          height: 8px;
          background: white;
          border-top: 1px solid var(--nord3);
          border-left: 1px solid var(--nord3);
          transform: rotate(45deg);
        }
        .cs-fwrap:hover .cs-deftip,
        .cs-fwrap:focus-within .cs-deftip {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .cs-deftip-head {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.45rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid var(--nord5);
          font-family: var(--font-mono);
          font-size: 0.7rem;
        }
        .cs-deftip-code {
          font-weight: 700;
          color: var(--nord0);
          letter-spacing: 0.05em;
        }
        .cs-deftip-full {
          color: var(--color-muted);
          font-size: 0.66rem;
        }
        .cs-deftip p {
          margin: 0;
          color: var(--nord2);
          text-wrap: pretty;
        }
      `}</style>
    </div>
  );
}

function TabGroup({ value, onChange }) {
  return (
    <div className="cs-tabs">
      <button className={value === "lm" ? "active" : ""} onClick={() => onChange("lm")}>
        Language Models
      </button>
      <button className={value === "non_lm" ? "active" : ""} onClick={() => onChange("non_lm")}>
        Non-LM Systems
      </button>
    </div>
  );
}

function Loading({ label = "Loading the catalogue…" }) {
  return (
    <div
      style={{
        padding: "3rem",
        fontFamily: "var(--font-mono)",
        fontSize: "0.8rem",
        color: "var(--color-muted)",
      }}
    >
      {label}
    </div>
  );
}

Object.assign(window, {
  CATS,
  CAT_META,
  catSlug,
  resolveCatMeta,
  AcronymTip,
  AcronymTipBubble,
  useAcroTip,
  FixedTipPortal,
  CatBadge,
  TopNav,
  useIncidents,
  csPermalink,
  useIsNarrow,
  filterRows,
  Toolbar,
  CategoryFilter,
  TabGroup,
  Loading,
});
