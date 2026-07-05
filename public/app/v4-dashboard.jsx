// V4 — Dashboard. Small multiples (year, category, model families, ASG vs USG
// over time) over a compact incident table. Charts are click-to-filter:
// clicking a year column, category bar, model family, or year-point filters
// the table to that slice. Multiple filters AND together; chips above the
// table let you clear them.

// Roll a raw model string up into its parent family.
function modelFamily(raw) {
  const m = (raw || "").trim();
  const s = m.toLowerCase();
  if (!m || s.includes("no model")) return null;
  if (s.startsWith("custom rl")) return "Custom RL agent";
  if (/^gpt/.test(s)) return "GPT (OpenAI)";
  if (/^(o\d+|chatgpt)/.test(s)) return "o-series (OpenAI)";
  if (/^claude/.test(s) || s === "anthropic lm") return "Claude (Anthropic)";
  if (/^llama/.test(s)) return "Llama (Meta)";
  if (/^qwen|^qwq/.test(s)) return "Qwen (Alibaba)";
  if (/^deepseek/.test(s)) return "DeepSeek";
  if (/^gemini|^gemma|^palm|^bard/.test(s)) return "Gemini / Gemma (Google)";
  if (/^mistral|^mixtral/.test(s)) return "Mistral";
  if (/^grok/.test(s)) return "Grok (xAI)";
  if (/^phi/.test(s)) return "Phi (Microsoft)";
  if (/^gopher|^chinchilla|^sparrow/.test(s)) return "Early DeepMind LMs";
  if (/^opt|^pythia|^bloom/.test(s)) return "Open foundation (OPT/Pythia/BLOOM)";
  return m; // fallback to raw
}

function rowHasFamily(r, fam) {
  for (const m of String(r.models).split(/,\s*/)) {
    if (modelFamily(m) === fam) return true;
  }
  return false;
}

function V4Dashboard({ view, onViewChange }) {
  const data = useIncidents();
  const [tab, setTab] = React.useState("lm");
  const [cat, setCat] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [hovered, setHovered] = React.useState(null);
  const hideTimer = React.useRef(null);
  const tableRef = React.useRef(null);

  // Cross-chart filters: clicking a year column / category segment / family
  // bar applies an active filter. Multiple filters AND together.
  const [yearF,   setYearF]   = React.useState(null);
  const [familyF, setFamilyF] = React.useState(null);
  const narrow = useIsNarrow(820);
  const [openRow, setOpenRow] = React.useState(null);  // mobile: tapped incident row

  // Cleanup any pending hide-timer on unmount.
  React.useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  if (!data) return <Loading />;
  const rows = data[tab] || [];
  const counts = { all: rows.length };
  for (const r of rows) {
    if (CATS.includes(r.category)) counts[r.category] = (counts[r.category] || 0) + 1;
  }
  // Apply category + cross-chart filters
  const matchYear   = (r) => yearF == null || (r.year || 0) === yearF;
  const matchFamily = (r) => familyF == null || rowHasFamily(r, familyF);
  let filtered = filterRows(rows, { cat, query: q, sort: { col: "year", asc: false } });
  filtered = filtered.filter((r) => CATS.includes(r.category) && matchYear(r) && matchFamily(r));

  // === aggregations ===
  // Charts cross-filter: each one reflects the OTHER active cross-chart filter
  // (year ↔ family) plus the search query, but never its own dimension. They
  // ignore the category legend's own selection so the stacked breakdown stays
  // visible. (`counts`, above, stays full-tab — it feeds the toolbar pills.)
  const emptyByCat = () => Object.fromEntries(CATS.map((c) => [c, 0]));
  const matchQ = (r) => {
    if (!q) return true;
    return [r.year, r.models, r.category, r.task, r.intended, r.actual, r.source_title]
      .join(" ").toLowerCase().includes(q.toLowerCase().trim());
  };
  const chartRows   = rows.filter((r) => CATS.includes(r.category) && matchQ(r));
  const rowsForYear = chartRows.filter(matchFamily);                       // year axis → family-filtered
  const rowsForFam  = chartRows.filter(matchYear);                         // family axis → year-filtered
  const rowsForCat  = chartRows.filter((r) => matchYear(r) && matchFamily(r));

  const yearMap = {};
  for (const r of rowsForYear) {
    const y = r.year && r.year > 0 ? r.year : null;
    if (!y) continue;
    yearMap[y] = yearMap[y] || emptyByCat();
    yearMap[y][r.category]++;
  }
  const years = Object.keys(yearMap).map(Number).sort((a, b) => a - b);
  const yearTotal = (y) => CATS.reduce((s, c) => s + yearMap[y][c], 0);
  const yearMax = Math.max(1, ...years.map(yearTotal));

  const totalCats = emptyByCat();
  for (const r of rowsForCat) totalCats[r.category]++;
  const catTotal = CATS.reduce((s, c) => s + totalCats[c], 0) || 1;

  const modelCounts = {};
  // (no longer needed for top models; kept empty)
  const topModels = [];
  const topMax = 1;

  // ── Model families ──────────────────────────────────────────────────────
  const familyCounts = {};
  for (const r of rowsForFam) {
    const fams = new Set();
    for (const m of String(r.models).split(/,\s*/)) {
      const f = modelFamily(m);
      if (f) fams.add(f);
    }
    for (const f of fams) familyCounts[f] = (familyCounts[f] || 0) + 1;
  }
  const topFamilies = Object.entries(familyCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topFamMax = Math.max(1, ...topFamilies.map((m) => m[1]));
  const famDenom = Math.max(1, rowsForFam.length);

  // ── ASG vs USG over time ────────────────────────────────────────────────
  const sgByYear = {};
  for (const r of rowsForYear) {
    if (r.category !== "ASG" && r.category !== "USG") continue;
    const y = r.year && r.year > 0 ? r.year : null;
    if (!y) continue;
    sgByYear[y] = sgByYear[y] || { ASG: 0, USG: 0 };
    sgByYear[y][r.category]++;
  }
  const sgYears = Object.keys(sgByYear).map(Number).sort((a, b) => a - b);

  // Row hover — only triggered from the INCIDENT cell so the cursor has a
  // clear path down to the popover's source link without crossing other rows.
  const cancelHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = setTimeout(() => setHovered(null), 180);
  };
  const onIncidentEnter = (r, rowEl) => () => {
    cancelHide();
    const wrap = tableRef.current;
    if (!wrap) return;
    const wRect = wrap.getBoundingClientRect();
    const rRect = rowEl.getBoundingClientRect();
    const midY = rRect.top - wRect.top + rRect.height / 2;
    const placeAbove = midY > wrap.clientHeight / 2;
    const popW = 560;
    const half = popW / 2;
    const pad = 16;
    const center = rRect.left - wRect.left + rRect.width / 2;
    const minL = half + pad;
    const maxL = wrap.clientWidth - half - pad;
    const clampedLeft = Math.max(minL, Math.min(maxL, center));
    setHovered({
      row: r,
      left: clampedLeft,
      top: placeAbove ? rRect.top - wRect.top - 10 : rRect.bottom - wRect.top + 10,
      placeAbove,
    });
  };

  return (
    <div className={"cs v4" + (narrow ? " is-narrow" : "")}>
      <TopNav active="incidents" view={view || "dashboard"} onViewChange={onViewChange} />
      <Toolbar>
        <div style={{ display: "flex", alignItems: "center", gap: "1.4rem" }}>
          <TabGroup value={tab} onChange={setTab} />
          <CategoryFilter value={cat} onChange={setCat} counts={counts} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.66rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            View: Overview
          </span>
          <input
            className="cs-search"
            placeholder="Search the catalogue…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </Toolbar>

      {/* Active cross-chart filters */}
      {(yearF != null || familyF != null) && (
        <div className="v4-filterbar">
          <span className="v4-fb-lbl">FILTERED BY</span>
          {yearF != null && (
            <button className="v4-chip" onClick={() => setYearF(null)}>
              YEAR · <b>{yearF}</b>
              <span className="v4-chip-x">×</span>
            </button>
          )}
          {familyF != null && (
            <button className="v4-chip" onClick={() => setFamilyF(null)}>
              MODEL · <b>{familyF}</b>
              <span className="v4-chip-x">×</span>
            </button>
          )}
          <button className="v4-chip-clear" onClick={() => { setYearF(null); setFamilyF(null); }}>
            clear all
          </button>
        </div>
      )}

      <div className="v4-body">
        {/* === Charts row === */}
        <div className="v4-charts">
          <section className="v4-chart">
            <h4>Entries per year <span className="v4-h-hint">· click to filter</span></h4>
            <div className="v4-bars">
              {years.map((y) => (
                <YearBar
                  key={y}
                  y={y}
                  d={yearMap[y]}
                  total={yearTotal(y)}
                  h={(yearTotal(y) / yearMax) * 100}
                  active={yearF === y}
                  dim={yearF != null && yearF !== y}
                  onPick={() => setYearF(yearF === y ? null : y)}
                />
              ))}
            </div>
          </section>

          <section className="v4-chart">
            <h4>By category <span className="v4-h-hint">· click to filter · hover for definition</span></h4>
            <div className="v4-catbar">
              {CATS.map((c) => {
                const v = totalCats[c];
                if (!v) return null;
                return (
                  <div
                    key={c}
                    className="v4-catseg v4-clickable"
                    style={{ flex: v }}
                    onClick={() => setCat(cat === c ? "all" : c)}
                    title={`${CAT_META[c].full} · ${v} incidents`}
                  >
                    <div className={"v4-catfill " + CAT_META[c].slug + (cat === c ? " active" : "")} />
                  </div>
                );
              })}
            </div>
            <ul className="v4-catlegend">
              {CATS.map((c) => (
                <React.Fragment key={c}>
                  {c === "OOS-NSE" && (
                    <li className="v4-catlegend-head">OUT OF SCOPE — not spec-gaming</li>
                  )}
                  <CatLegendRow
                    c={c}
                    active={cat === c}
                    num={totalCats[c]}
                    pct={((totalCats[c] / catTotal) * 100).toFixed(0)}
                    onPick={() => setCat(cat === c ? "all" : c)}
                  />
                </React.Fragment>
              ))}
            </ul>
          </section>

          <section className="v4-chart">
            <h4>Top model families <span className="v4-h-hint">· click to filter</span></h4>
            <ul className="v4-rank">
              {topFamilies.map(([m, n]) => (
                <RankRow
                  key={m}
                  m={m}
                  n={n}
                  pct={Math.round(n / famDenom * 100)}
                  setLabel={tab === "lm" ? "LM" : "non-LM"}
                  widthPct={(n / topFamMax) * 100}
                  active={familyF === m}
                  dim={familyF != null && familyF !== m}
                  onPick={() => setFamilyF(familyF === m ? null : m)}
                />
              ))}
            </ul>
          </section>

          <section className="v4-chart">
            <h4><AcronymTip code="USG" align="right">USG</AcronymTip> vs <AcronymTip code="ASG" align="right">ASG</AcronymTip> over time</h4>
            <SGOverTime data={sgByYear} years={sgYears} yearF={yearF} onPickYear={(y) => setYearF(yearF === y ? null : y)} />
          </section>
        </div>

        {/* === Compact incident table with rich row hover ===  */}
        <div className="v4-table-section" ref={tableRef}>
          <div className="v4-th">
            <span style={{ flex: "0 0 56px" }}>YEAR</span>
            <span style={{ flex: "0 0 150px" }}>MODELS</span>
            <span style={{ flex: "0 0 88px" }}>CATEGORY</span>
            <span style={{ flex: "1 1 auto" }}>INCIDENT</span>
            <span style={{ flex: "0 0 260px" }}>SOURCE</span>
            <span style={{ flex: "0 0 60px", textAlign: "right" }}>{filtered.length}</span>
          </div>
          <div className="v4-tbody">
            {filtered.slice(0, 14).map((r, i) => (
              <div
                key={i}
                className={"v4-tr" + (narrow && openRow === i ? " open" : "")}
                onClick={narrow ? () => setOpenRow(openRow === i ? null : i) : undefined}
              >
                <span className="v4-c v4-year" style={{ flex: "0 0 56px" }}>
                  {r.year && r.year > 0 ? r.year : "—"}
                </span>
                <span className="v4-c v4-models" style={{ flex: "0 0 150px" }}>{r.models}</span>
                <span className="v4-c" style={{ flex: "0 0 88px" }}>
                  <CatBadge cat={r.category} />
                </span>
                <span
                  className="v4-c v4-task"
                  style={{ flex: "1 1 auto" }}
                  onMouseEnter={(e) => onIncidentEnter(r, e.currentTarget.parentElement)()}
                  onMouseLeave={scheduleHide}
                >
                  {r.incident_id ? (
                    <a
                      className="v4-tasklink"
                      href={csPermalink(r.incident_id)}
                      onClick={(e) => e.stopPropagation()}
                      title="Permanent link to this incident"
                    >
                      {r.task}
                    </a>
                  ) : r.task}
                </span>
                <span className="v4-c v4-source" style={{ flex: "0 0 260px" }}>
                  <a href={r.source_link} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                    {r.source_title}
                  </a>
                </span>
                <span className="v4-c" style={{ flex: "0 0 60px", textAlign: "right" }}>
                  <a className="v4-link" href={r.source_link} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>↗</a>
                </span>

                {/* Mobile: tap affordance + inline detail (the hover popover is desktop-only) */}
                {narrow && (
                  <span className="v4-row-toggle" aria-hidden="true">{openRow === i ? "–" : "+"}</span>
                )}
                {narrow && openRow === i && (
                  <div className="v4-row-detail">
                    <div className="v4-pop-blocks">
                      <div className="v4-pop-block">
                        <div className="v4-pop-blbl">INTENDED BEHAVIOUR</div>
                        <p>{r.intended}</p>
                      </div>
                      <div className="v4-pop-block actual">
                        <div className="v4-pop-blbl actual">ACTUAL BEHAVIOUR</div>
                        <p>{r.actual}</p>
                      </div>
                    </div>
                    <a className="v4-row-detail-src" href={r.source_link} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                      {r.source_title} ↗
                    </a>
                    {r.incident_id && (
                      <a className="v4-row-detail-perma" href={csPermalink(r.incident_id)} onClick={(e) => e.stopPropagation()}>
                        Open incident page →
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rich popover */}
          {hovered && (
            <div
              className={"v4-pop " + (hovered.placeAbove ? "above" : "below")}
              style={{ left: hovered.left, top: hovered.top }}
              onMouseEnter={cancelHide}
              onMouseLeave={scheduleHide}
            >
              <header className="v4-pop-head">
                <div className="v4-pop-meta">
                  <span className="v4-pop-year">
                    {hovered.row.year && hovered.row.year > 0 ? hovered.row.year : "—"}
                  </span>
                  <span className="v4-pop-sep">·</span>
                  <span className="v4-pop-models">{hovered.row.models}</span>
                </div>
                <span className={"cat-badge " + hovered.row.category.toLowerCase()}>
                  {hovered.row.category} — {CAT_META[hovered.row.category].full}
                </span>
              </header>

              <h2 className="v4-pop-task">
                {hovered.row.incident_id ? (
                  <a
                    className="v4-pop-tasklink"
                    href={csPermalink(hovered.row.incident_id)}
                    title="Open this incident's own page (permanent link)"
                  >
                    {hovered.row.task}
                  </a>
                ) : hovered.row.task}
              </h2>

              <div className="v4-pop-blocks">
                <div className="v4-pop-block">
                  <div className="v4-pop-blbl">INTENDED BEHAVIOUR</div>
                  <p>{hovered.row.intended}</p>
                </div>
                <div className="v4-pop-block actual">
                  <div className="v4-pop-blbl actual">ACTUAL BEHAVIOUR</div>
                  <p>{hovered.row.actual}</p>
                </div>
              </div>

              <footer className="v4-pop-foot">
                <span className="v4-pop-foot-lbl">SOURCE</span>
                <a href={hovered.row.source_link} target="_blank" rel="noopener">
                  {hovered.row.source_title} ↗
                </a>
              </footer>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .v4-body { display: flex; flex-direction: column; }

        .v4-charts {
          display: grid;
          grid-template-columns: 1.4fr 0.9fr 1fr 1.2fr;
          gap: 0;
          border-bottom: 1px solid var(--nord4);
        }
        .v4-chart {
          padding: 1rem 1.25rem 1.1rem;
          border-right: 1px solid var(--nord5);
          min-height: 220px;
          display: flex;
          flex-direction: column;
        }
        .v4-chart:last-child { border-right: 0; }
        .v4-chart h4 {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--nord2);
          margin: 0 0 0.85rem;
        }
        .v4-h-hint {
          font-weight: 400;
          letter-spacing: 0.03em;
          color: var(--color-muted);
          text-transform: none;
          font-size: 0.58rem;
          margin-left: 0.3rem;
        }

        /* shared clickable affordance for chart elements */
        .v4-clickable { cursor: pointer; transition: opacity .12s, filter .12s; }
        .v4-clickable:hover { filter: brightness(1.05); }
        .v4-clickable.dim { opacity: 0.4; }
        .v4-clickable.dim:hover { opacity: 0.7; }
        .v4-bar-col.v4-clickable.active .v4-seg { filter: brightness(1.15) saturate(1.15); }
        .v4-catfill.active { filter: brightness(1.15) saturate(1.2); }
        .v4-catlegend li.v4-clickable.active .v4-clname { color: var(--color-accent); }
        .v4-catlegend li.v4-clickable { padding: 0.2rem 0.25rem; margin: 0 -0.25rem; border-radius: 2px; }
        .v4-catlegend li.v4-clickable:hover { background: var(--nord6); }
        .v4-rank li.v4-clickable { padding: 0.22rem 0.25rem; margin: 0 -0.25rem; border-radius: 2px; }
        .v4-rank li.v4-clickable:hover { background: var(--nord6); }
        .v4-rank li.v4-clickable.active .v4-rank-lbl { color: var(--color-accent); font-weight: 700; }
        .v4-rank li.v4-clickable.active .v4-rank-fill { background: var(--color-accent); filter: brightness(1.1); }

        /* === Active filter chips === */
        .v4-filterbar {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 1.25rem;
          background: var(--color-accent-light);
          border-bottom: 1px solid var(--nord4);
          font-family: var(--font-mono);
          font-size: 0.66rem;
        }
        .v4-fb-lbl {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: var(--color-accent);
        }
        .v4-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: white;
          border: 1px solid var(--color-accent);
          color: var(--nord1);
          padding: 0.2rem 0.45rem 0.2rem 0.55rem;
          font-family: var(--font-mono);
          font-size: 0.66rem;
          border-radius: 2px;
          cursor: pointer;
        }
        .v4-chip b { color: var(--color-accent); font-weight: 700; margin: 0 0.15rem; }
        .v4-chip-x {
          color: var(--color-accent);
          font-size: 0.88rem;
          line-height: 1;
        }
        .v4-chip:hover { background: var(--nord6); }
        .v4-chip-clear {
          margin-left: auto;
          background: none;
          border: 0;
          color: var(--color-accent);
          font-family: var(--font-mono);
          font-size: 0.66rem;
          text-decoration: underline;
          cursor: pointer;
        }

        /* year bars */
        .v4-bars { flex: 1; display: flex; align-items: flex-end; gap: 6px; }
        .v4-bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          min-width: 0;
          position: relative;
          cursor: default;
        }
        .v4-bar-col:hover .v4-seg { filter: brightness(1.12) saturate(1.1); }
        .v4-bar-col:hover .v4-bar-num { color: var(--color-accent); }
        .v4-bar-stack { width: 100%; display: flex; flex-direction: column; border-radius: 1px; overflow: hidden; min-height: 2px; }
        .v4-seg.asg { background: var(--cat-asg-solid); }
        .v4-seg.usg { background: var(--cat-usg-solid); }
        .v4-seg.oos { background: var(--nord3); }
        .v4-seg.oos-nse { background: var(--cat-oos-nse-solid); }
        .v4-seg.oos-bc { background: var(--cat-oos-bc-solid); }
        .v4-seg.oos-bi { background: var(--cat-oos-bi-solid); }
        .v4-bar-num { font-family: var(--font-mono); font-size: 0.62rem; color: var(--nord2); margin-top: 0.25rem; font-variant-numeric: tabular-nums; }
        .v4-bar-lbl { font-family: var(--font-mono); font-size: 0.6rem; color: var(--color-muted); }

        /* category split */
        .v4-catbar { display: flex; height: 28px; width: 100%; margin-bottom: 0.85rem; border: 1px solid var(--nord4); border-radius: 2px; overflow: hidden; }
        .v4-catseg { display: flex; }
        .v4-catfill { flex: 1; }
        .v4-catfill.asg { background: var(--cat-asg-solid); }
        .v4-catfill.usg { background: var(--cat-usg-solid); }
        .v4-catfill.oos { background: var(--nord3); }
        .v4-catfill.oos-nse { background: var(--cat-oos-nse-solid); }
        .v4-catfill.oos-bc { background: var(--cat-oos-bc-solid); }
        .v4-catfill.oos-bi { background: var(--cat-oos-bi-solid); }
        .v4-catlegend { list-style: none; margin: 0; padding: 0; font-family: var(--font-mono); font-size: 0.66rem; color: var(--nord1); }
        .v4-catlegend li { display: grid; grid-template-columns: 12px 38px 1fr auto 36px; gap: 0.4rem; align-items: baseline; padding: 0.18rem 0; position: relative; }
        .v4-catlegend li.v4-clickable { padding: 0.2rem 0.25rem; margin: 0 -0.25rem; border-radius: 2px; }
        .v4-catlegend li.v4-clickable:hover { background: var(--nord6); }
        .v4-catlegend li.v4-clickable.active .v4-clname { color: var(--color-accent); }

        /* OOS group heading — subordinates the three out-of-scope buckets */
        .v4-catlegend li.v4-catlegend-head {
          display: block;
          grid-template-columns: none;
          font-family: var(--font-mono);
          font-size: 0.53rem;
          font-weight: 700;
          letter-spacing: 0.13em;
          color: var(--color-muted);
          margin-top: 0.4rem;
          padding: 0.35rem 0 0.1rem;
          border-top: 1px dashed var(--nord4);
        }
           positioned to the right of the legend row */
        .v4-deftip {
          left: calc(100% + 14px) !important;
          top: -6px !important;
          z-index: 1000;
        }
        .v4-deftip::before {
          top: 14px !important;
          left: -5px !important;
          right: auto !important;
          border-top: none !important;
          border-bottom: 1px solid var(--nord3) !important;
        }
        .v4-catlegend li:hover .v4-deftip {
          opacity: 1 !important;
          transform: translateX(0) !important;
          pointer-events: auto !important;
          transition-delay: 0.1s;
        }
        .v4-clname { font-weight: 700; }
        .v4-clfull { font-size: 0.58rem; color: var(--color-muted); line-height: 1.3; }
        .v4-clnum { font-weight: 600; font-variant-numeric: tabular-nums; }
        .v4-clpct { color: var(--color-muted); text-align: right; font-variant-numeric: tabular-nums; }

        /* top models */
        .v4-rank { list-style: none; margin: 0; padding: 0; font-family: var(--font-mono); font-size: 0.66rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .v4-rank li {
          display: grid;
          grid-template-columns: 80px 1fr 28px;
          gap: 0.5rem;
          align-items: center;
          padding: 0.18rem 0;
          position: relative;
          cursor: default;
        }
        .v4-rank li:hover .v4-rank-fill { filter: brightness(1.15); }
        .v4-rank li:hover .v4-rank-lbl { color: var(--color-accent); }
        .v4-rank-lbl { color: var(--nord1); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .v4-rank-bar { height: 6px; background: var(--nord6); border-radius: 1px; overflow: hidden; }
        .v4-rank-fill { height: 100%; background: var(--color-accent); }
        .v4-rank-num { text-align: right; color: var(--color-muted); font-variant-numeric: tabular-nums; }

        /* top model-family bars (re-uses .v4-rank styles, shrink label width) */
        .v4-rank li { grid-template-columns: 130px 1fr 28px; }

        /* ===== ASG/USG line chart ===== */
        .v4-sgline { flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .v4-sgline-svg { width: 100%; flex: 1; min-height: 0; }
        .v4-sg-line {
          fill: none;
          stroke-width: 1.6;
          stroke-linejoin: round;
        }
        .v4-sg-line.asg { stroke: var(--cat-asg-solid); }
        .v4-sg-line.usg { stroke: var(--cat-usg-solid); }
        .v4-sg-dot { transition: r .1s; }
        .v4-sg-dot.asg { fill: var(--cat-asg-solid); stroke: white; stroke-width: 1; }
        .v4-sg-dot.usg { fill: var(--cat-usg-solid); stroke: white; stroke-width: 1; }
        .v4-sg-point.dim .v4-sg-dot { opacity: 0.35; }
        .v4-sg-point.active .v4-sg-dot { stroke: var(--color-accent); stroke-width: 1.5; }
        .v4-sgline-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.4rem;
          margin-top: 0.2rem;
          border-top: 1px dashed var(--nord5);
          font-family: var(--font-mono);
          font-size: 0.62rem;
          color: var(--nord1);
        }
        .v4-sgline-legend { display: flex; gap: 0.6rem; }
        .v4-sgline-legend span { display: inline-flex; align-items: center; gap: 0.3rem; }
        .v4-sgline-readout { display: flex; gap: 0.6rem; align-items: baseline; }
        .v4-sgline-readout-y { font-weight: 700; color: var(--nord0); }
        .v4-sgline-readout span { display: inline-flex; align-items: center; gap: 0.3rem; font-variant-numeric: tabular-nums; }

        /* sources */
        .v4-srclist { list-style: none; margin: 0; padding: 0; font-family: var(--font-mono); font-size: 0.66rem; line-height: 1.4; color: var(--nord1); flex: 1; }
        .v4-srclist li {
          display: grid;
          grid-template-columns: 22px 1fr 28px;
          gap: 0.4rem;
          align-items: start;
          padding: 0.3rem 0;
          border-top: 1px dashed var(--nord5);
          position: relative;
          cursor: default;
        }
        .v4-srclist li:first-child { border-top: 0; padding-top: 0; }
        .v4-srclist li:hover .v4-srctitle { color: var(--color-accent); }
        .v4-srcidx { color: var(--color-muted); font-variant-numeric: tabular-nums; }
        .v4-srctitle { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .v4-srcnum { text-align: right; color: var(--color-muted); }

        /* === Table === */
        .v4-table-section { padding: 0 1.25rem 1rem; position: relative; }
        /* Incident names + popover title link to the incident's own page */
        .v4-tasklink { color: inherit; text-decoration: underline; text-decoration-color: var(--nord4); text-underline-offset: 3px; }
        .v4-tasklink:hover { color: var(--color-accent); text-decoration-color: var(--color-accent); }
        .v4-pop-tasklink { color: inherit; text-decoration: underline; text-decoration-color: var(--nord4); text-underline-offset: 4px; }
        .v4-pop-tasklink:hover { color: var(--color-accent); text-decoration-color: var(--color-accent); }
        .v4-row-detail-perma { display: inline-block; margin-top: 0.55rem; margin-left: 1rem; font-family: var(--font-mono); font-size: 0.72rem; color: var(--color-accent); text-decoration: underline; text-underline-offset: 3px; }
        .v4-th {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.65rem 0;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--color-muted);
          border-bottom: 1px solid var(--nord4);
          position: sticky;
          top: 0;
          background: white;
        }
        .v4-tr {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.52rem 0;
          border-bottom: 1px solid var(--nord5);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          line-height: 1.4;
          position: relative;
          transition: background .08s;
        }
        .v4-tr:has(.v4-task:hover),
        .v4-tr:hover { background: var(--color-accent-light); }
        .v4-c { color: var(--nord1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .v4-year { font-weight: 600; color: var(--nord2); font-variant-numeric: tabular-nums; }
        .v4-models { color: var(--nord2); }
        .v4-task {
          font-family: var(--font-sans);
          font-size: 0.78rem;
          color: var(--nord0);
          font-weight: 500;
          white-space: nowrap;
          text-overflow: ellipsis;
          cursor: pointer;
        }
        .v4-task:hover { color: var(--color-accent); }
        .v4-source a {
          color: var(--color-accent);
          text-decoration: none;
          font-size: 0.7rem;
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: middle;
        }
        .v4-source a:hover { text-decoration: underline; }
        .v4-link { color: var(--color-accent); text-decoration: none; font-size: 0.85rem; }

        /* === Rich row popover === */
        .v4-pop {
          position: absolute;
          width: 560px;
          background: white;
          border: 1px solid var(--nord3);
          box-shadow: 0 16px 40px rgba(46, 52, 64, 0.20), 0 4px 10px rgba(46, 52, 64, 0.08);
          padding: 1.1rem 1.25rem 1rem;
          font-family: var(--font-sans);
          z-index: 100;
          pointer-events: auto;
          transform: translateX(-50%);
          animation: v4pop .14s ease-out;
        }
        .v4-pop.above { transform: translate(-50%, -100%); }
        @keyframes v4pop {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; }
        }
        .v4-pop.above { animation-name: v4popUp; }
        @keyframes v4popUp {
          from { opacity: 0; transform: translate(-50%, calc(-100% + 4px)); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }
        .v4-pop-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.8rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid var(--nord5);
          margin-bottom: 0.75rem;
        }
        .v4-pop-meta {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--nord2);
          display: flex;
          gap: 0.5rem;
          align-items: baseline;
        }
        .v4-pop-year { font-weight: 700; color: var(--nord0); }
        .v4-pop-sep { color: var(--nord4); }
        .v4-pop-models { color: var(--color-muted); }
        .v4-pop-task {
          font-family: var(--font-sans);
          font-weight: 600;
          font-size: 1.18rem;
          line-height: 1.3;
          margin: 0 0 0.95rem;
          color: var(--nord0);
          text-wrap: pretty;
        }
        .v4-pop-blocks {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 0.9rem;
        }
        .v4-pop-block {
          background: var(--nord6);
          border-left: 3px solid var(--cat-asg-solid);
          padding: 0.55rem 0.7rem 0.6rem;
        }
        .v4-pop-block.actual { border-left-color: var(--cat-usg-solid); }
        .v4-pop-blbl {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--cat-asg-fg);
          margin-bottom: 0.3rem;
        }
        .v4-pop-blbl.actual { color: var(--cat-usg-fg); }
        .v4-pop-block p {
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.5;
          color: var(--nord1);
          text-wrap: pretty;
        }
        .v4-pop-foot {
          display: flex;
          align-items: baseline;
          gap: 0.55rem;
          padding-top: 0.6rem;
          border-top: 1px dashed var(--nord5);
        }
        .v4-pop-foot-lbl {
          font-family: var(--font-mono);
          font-size: 0.56rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--color-muted);
        }
        .v4-pop-foot a {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--color-accent);
          text-decoration: none;
        }
        .v4-pop-foot a:hover { text-decoration: underline; }

        /* === Chart tooltips (shared shell) === */
        .v4-tip {
          position: absolute;
          z-index: 80;
          background: white;
          border: 1px solid var(--nord3);
          box-shadow: 0 8px 24px rgba(46, 52, 64, 0.18), 0 2px 6px rgba(46, 52, 64, 0.06);
          padding: 0.55rem 0.7rem 0.6rem;
          font-family: var(--font-sans);
          font-size: 0.74rem;
          line-height: 1.4;
          color: var(--nord1);
          opacity: 0;
          pointer-events: none;
          transform: translateY(-4px);
          transition: opacity .12s, transform .12s;
          white-space: normal;
        }
        .v4-bar-col:hover .v4-tip-bar,
        .v4-rank li:hover .v4-tip-rank,
        .v4-srclist li:hover .v4-tip-src {
          opacity: 1;
          transform: translateY(0);
        }
        .v4-tip-bar { bottom: calc(100% + 8px); left: 50%; transform: translate(-50%, -4px); width: 200px; }
        .v4-bar-col:hover .v4-tip-bar { transform: translate(-50%, 0); }
        .v4-tip-rank { bottom: calc(100% + 6px); left: 80px; width: 260px; }
        .v4-tip-src { left: 0; right: 0; top: calc(100% + 4px); }
        .v4-tip-head { font-family: var(--font-mono); font-size: 0.66rem; font-weight: 600; color: var(--nord1); margin-bottom: 0.35rem; padding-bottom: 0.35rem; border-bottom: 1px solid var(--nord5); }
        .v4-tip-head b { font-weight: 700; color: var(--color-accent); margin: 0 0.15rem; }
        .v4-tip-body { font-size: 0.78rem; color: var(--nord1); line-height: 1.45; text-wrap: pretty; }
        .v4-tip-bar .v4-tip-line {
          display: grid;
          grid-template-columns: 12px 36px 1fr 36px;
          gap: 0.35rem;
          align-items: baseline;
          font-family: var(--font-mono);
          font-size: 0.66rem;
          padding: 0.12rem 0;
        }
        .v4-tip-bar .v4-tip-lbl { font-weight: 700; color: var(--nord1); }
        .v4-tip-bar .v4-tip-num { font-variant-numeric: tabular-nums; color: var(--nord0); font-weight: 600; }
        .v4-tip-bar .v4-tip-pct { color: var(--color-muted); text-align: right; font-variant-numeric: tabular-nums; }

        /* ================= Mobile (.is-narrow) ================= */
        /* Charts: stack into one column */
        .is-narrow .v4-charts { grid-template-columns: 1fr; }
        .is-narrow .v4-chart {
          border-right: 0;
          border-bottom: 1px solid var(--nord4);
          padding: 1rem 0.9rem 1.1rem;
        }
        .is-narrow .v4-bars { min-height: 150px; }
        .is-narrow .v4-sgline { min-height: 170px; }
        .is-narrow .v4-rank li { grid-template-columns: 120px 1fr 30px; }

        /* Table → stacked cards (the fixed-width columns can't fit a phone) */
        .is-narrow .v4-table-section { padding: 0 0.9rem 1.5rem; }
        .is-narrow .v4-th { display: none; }
        .is-narrow .v4-tr {
          flex-wrap: wrap;
          align-items: baseline;
          column-gap: 0.5rem;
          row-gap: 0.1rem;
          padding: 0.8rem 0;
        }
        .is-narrow .v4-c {
          flex: 0 0 auto !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
        }
        .is-narrow .v4-year { order: 1; font-size: 0.78rem; }
        .is-narrow .v4-tr > .v4-c:nth-child(3) { order: 2; }     /* category badge */
        .is-narrow .v4-task {
          order: 3;
          flex: 1 1 100% !important;
          font-weight: 600;
          font-size: 0.98rem;
          line-height: 1.35;
          margin-top: 0.15rem;
          color: var(--nord0);
        }
        .is-narrow .v4-models { order: 4; flex: 1 1 100% !important; font-size: 0.8rem; color: var(--nord3); }
        .is-narrow .v4-source { order: 5; flex: 1 1 100% !important; font-size: 0.82rem; }
        .is-narrow .v4-source a { white-space: normal; overflow-wrap: anywhere; }
        .is-narrow .v4-tr > .v4-c:nth-child(6) { display: none; }  /* standalone ↗ (title is already a link) */

        /* Hover popover is desktop-only; mobile expands inline instead */
        .is-narrow .v4-pop { display: none !important; }
        .is-narrow .v4-chip { white-space: normal; }
        .is-narrow .v4-tr { position: relative; padding-right: 1.8rem; cursor: pointer; }
        .is-narrow .v4-tr.open { background: var(--nord6); }
        .is-narrow .v4-row-toggle {
          position: absolute;
          top: 0.7rem;
          right: 0.3rem;
          width: 1.2rem;
          height: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 1rem;
          color: var(--color-muted);
          border: 1px solid var(--nord4);
          border-radius: 3px;
        }
        .is-narrow .v4-tr.open .v4-row-toggle { color: var(--nord0); border-color: var(--nord3); }
        .is-narrow .v4-row-detail {
          order: 9;
          flex: 1 1 100%;
          margin-top: 0.7rem;
        }
        .is-narrow .v4-row-detail .v4-pop-blocks {
          grid-template-columns: 1fr;
          gap: 0.6rem;
          margin-bottom: 0.7rem;
        }
        .is-narrow .v4-row-detail-src {
          font-family: var(--font-mono);
          font-size: 0.74rem;
          color: var(--color-accent);
          text-decoration: none;
          overflow-wrap: anywhere;
        }
      `}</style>
    </div>
  );
}

window.V4Dashboard = V4Dashboard;

// Model-family rank row — portaled hover readout.
function RankRow({ m, n, pct, setLabel, widthPct, active, dim, onPick }) {
  const { ref, visible, handlers } = useAcroTip();
  return (
    <li
      ref={ref}
      className={"v4-clickable" + (active ? " active" : "") + (dim ? " dim" : "")}
      onClick={onPick}
      {...handlers}
    >
      <span className="v4-rank-lbl">{m}</span>
      <div className="v4-rank-bar">
        <div className="v4-rank-fill" style={{ width: widthPct + "%" }} />
      </div>
      <span className="v4-rank-num">{n}</span>
      <FixedTipPortal anchorRef={ref} visible={visible} prefer="above">
        <div className="v4-tip v4-tip-rank">
          <b>{m}</b> — {n} entries ({pct}% of {setLabel} set)
        </div>
      </FixedTipPortal>
    </li>
  );
}

// Year bar — stacked column with a portaled hover breakdown (above the nav,
// clamped to the viewport so edge bars don't run off-screen).
function YearBar({ y, d, total, h, active, dim, onPick }) {
  const { ref, visible, handlers } = useAcroTip();
  return (
    <div
      ref={ref}
      className={"v4-bar-col v4-clickable" + (active ? " active" : "") + (dim ? " dim" : "")}
      onClick={onPick}
      {...handlers}
    >
      <div className="v4-bar-stack" style={{ height: h + "%" }}>
        {CATS.map((c) =>
          d[c] ? <div key={c} className={"v4-seg " + CAT_META[c].slug} style={{ flex: d[c] }} /> : null
        )}
      </div>
      <div className="v4-bar-num">{total}</div>
      <div className="v4-bar-lbl">{y}</div>
      <FixedTipPortal anchorRef={ref} visible={visible} prefer="above">
        <div className="v4-tip v4-tip-bar">
          <div className="v4-tip-head">{y} · <b>{total}</b> entries</div>
          {CATS.map((c) => d[c] ? (
            <div key={c} className="v4-tip-line">
              <span className={"cat-dot " + CAT_META[c].slug} />
              <span className="v4-tip-lbl">{CAT_META[c].short}</span>
              <span className="v4-tip-num">{d[c]}</span>
              <span className="v4-tip-pct">{Math.round(d[c] / total * 100)}%</span>
            </div>
          ) : null)}
        </div>
      </FixedTipPortal>
    </div>
  );
}

// Category legend row — carries its own portaled definition tooltip.
function CatLegendRow({ c, active, num, pct, onPick }) {
  const m = CAT_META[c];
  const { ref, visible, handlers } = useAcroTip();
  return (
    <li
      ref={ref}
      className={"v4-clickable" + (active ? " active" : "")}
      onClick={onPick}
      {...handlers}
    >
      <span className={"cat-dot " + m.slug} />
      <span className="v4-clname">{m.short}</span>
      <span className="v4-clfull">{m.full}</span>
      <span className="v4-clnum">{num}</span>
      <span className="v4-clpct">{pct}%</span>
      <AcronymTipBubble meta={{ ...m, key: c }} anchorRef={ref} visible={visible} />
    </li>
  );
}

// ─── ASG vs USG line chart ─────────────────────────────────────────────────
function SGOverTime({ data, years, yearF, onPickYear }) {
  const W = 320, H = 150;
  const PAD_L = 28, PAD_R = 12, PAD_T = 14, PAD_B = 22;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const [hov, setHov] = React.useState(null);

  if (years.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-muted)" }}>
        No SG incidents.
      </div>
    );
  }

  const yMax = Math.max(
    1,
    ...years.map((y) => Math.max(data[y].ASG, data[y].USG))
  );
  // Nice round upper bound
  const niceMax = (() => {
    if (yMax <= 5)   return 5;
    if (yMax <= 10)  return 10;
    if (yMax <= 25)  return 25;
    if (yMax <= 50)  return 50;
    if (yMax <= 100) return 100;
    return Math.ceil(yMax / 50) * 50;
  })();

  // x scale: if only one year, center it
  const xOf = (y) => {
    if (years.length === 1) return PAD_L + innerW / 2;
    const i = years.indexOf(y);
    return PAD_L + (i / (years.length - 1)) * innerW;
  };
  const yOf = (v) => PAD_T + innerH - (v / niceMax) * innerH;

  const asgPath = years.map((y, i) => `${i === 0 ? "M" : "L"} ${xOf(y)} ${yOf(data[y].ASG)}`).join(" ");
  const usgPath = years.map((y, i) => `${i === 0 ? "M" : "L"} ${xOf(y)} ${yOf(data[y].USG)}`).join(" ");

  // gridline values: 0, halfway, max
  const gridVals = [0, Math.round(niceMax / 2), niceMax];

  const hovered = hov != null ? data[hov] : null;

  return (
    <div className="v4-sgline">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="v4-sgline-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* gridlines */}
        {gridVals.map((v) => (
          <g key={v}>
            <line
              x1={PAD_L} x2={W - PAD_R}
              y1={yOf(v)} y2={yOf(v)}
              stroke="var(--nord5)" strokeWidth="1" strokeDasharray={v === 0 ? "0" : "2 3"}
            />
            <text
              x={PAD_L - 5} y={yOf(v) + 3}
              fontFamily="var(--font-mono)" fontSize="8.5"
              fill="var(--color-muted)" textAnchor="end"
            >
              {v}
            </text>
          </g>
        ))}

        {/* lines */}
        <path d={asgPath} className="v4-sg-line asg" />
        <path d={usgPath} className="v4-sg-line usg" />

        {/* dots + invisible click targets */}
        {years.map((y) => {
          const active = yearF === y || hov === y;
          return (
            <g
              key={y}
              className={"v4-sg-point" + (yearF === y ? " active" : "") + (yearF != null && yearF !== y ? " dim" : "")}
              onMouseEnter={() => setHov(y)}
              onMouseLeave={() => setHov(null)}
              onClick={() => onPickYear(y)}
            >
              {/* hit-area */}
              <rect
                x={xOf(y) - 14} y={PAD_T - 4}
                width="28" height={innerH + 8}
                fill="transparent"
                style={{ cursor: "pointer" }}
              />
              {active && (
                <line
                  x1={xOf(y)} x2={xOf(y)}
                  y1={PAD_T} y2={H - PAD_B}
                  stroke="var(--nord4)" strokeWidth="1" strokeDasharray="2 2"
                />
              )}
              <circle cx={xOf(y)} cy={yOf(data[y].USG)} r={active ? 4 : 3} className="v4-sg-dot usg" />
              <circle cx={xOf(y)} cy={yOf(data[y].ASG)} r={active ? 4 : 3} className="v4-sg-dot asg" />
              {/* x-axis label */}
              <text
                x={xOf(y)} y={H - 6}
                fontFamily="var(--font-mono)" fontSize="9"
                fill={yearF === y ? "var(--color-accent)" : "var(--color-muted)"}
                textAnchor="middle"
                fontWeight={yearF === y ? "700" : "400"}
              >
                {y}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="v4-sgline-foot">
        <div className="v4-sgline-legend">
          <span><span className="cat-dot usg" /> USG</span>
          <span><span className="cat-dot asg" /> ASG</span>
        </div>
        {hovered && (
          <div className="v4-sgline-readout">
            <span className="v4-sgline-readout-y">{hov}</span>
            <span><span className="cat-dot usg" /> {hovered.USG}</span>
            <span><span className="cat-dot asg" /> {hovered.ASG}</span>
          </div>
        )}
      </div>
    </div>
  );
}

window.SGOverTime = SGOverTime;
