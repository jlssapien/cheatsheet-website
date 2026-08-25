// V6 — Tree view (hierarchical file-tree style).
// Flat top-level: ASG, USG, OOS-NSE, OOS-BC, OOS-BI, OOS.
// "Group by" optional subgroup level under each category.
// Hover a category row to see its verbatim rubric definition.

// Flat top-level, ordered by importance: USG (the key signal), then ASG, then
// the out-of-scope buckets. ("OOS" plain has effectively zero entries so we drop it.)
const TOP_CATS = ["USG", "ASG", "OOS-NSE", "OOS-BC", "OOS-BI"];

const GROUP_BYS = [
  { id: "none",   label: "None" },
  { id: "system", label: "LM / Non-LM" },
  { id: "year",   label: "Year" },
  { id: "model",  label: "Model" },
  { id: "source", label: "Source paper" },
];

// Sort key arrays per group-by mode.
function sortGroupKeys(keys, mode, sizes) {
  if (mode === "year") {
    return [...keys].sort((a, b) => {
      if (a === "—") return 1;
      if (b === "—") return -1;
      return Number(b) - Number(a);
    });
  }
  if (mode === "system") {
    return [...keys].sort((a, b) => (a === "LM" ? -1 : 1));
  }
  // model / source: by size desc, then alpha
  return [...keys].sort((a, b) =>
    (sizes.get(b) - sizes.get(a)) || a.localeCompare(b)
  );
}

// Group rows by category → array of {row, uid}
function byCategoryUid(rows) {
  const out = {};
  for (const c of CATS) out[c] = [];
  for (const r of rows) if (out[r.category]) out[r.category].push(r);
  for (const c of CATS) out[c].sort((a, b) => (b.year || 0) - (a.year || 0));
  return out;
}

// Build subgroups for the rows of a single category, per the chosen mode.
function buildSubgroups(rows, mode) {
  if (mode === "none") return null;
  const map = new Map();
  for (const r of rows) {
    let keys;
    if (mode === "system") keys = [r.system];
    else if (mode === "year") keys = [r.year && r.year > 0 ? String(r.year) : "—"];
    else if (mode === "model") keys = String(r.models).split(/,\s*/).filter(Boolean);
    else if (mode === "source") keys = [r.source_title];
    else keys = [];
    for (const k of keys) {
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
  }
  const sizes = new Map();
  for (const [k, v] of map) sizes.set(k, v.length);
  const keys = sortGroupKeys([...map.keys()], mode, sizes);
  return { keys, map };
}

function V6Tree({ view, onViewChange }) {
  const data = useIncidents();
  const [q, setQ] = React.useState("");
  const [groupBy, setGroupBy] = React.useState("none");
  // expanded ids — cat: or sub: ids. Start with USG cat open (the key category).
  const [expanded, setExpanded] = React.useState(() => new Set(["cat:USG"]));
  // selected node id. Default: root.
  const [selected, setSelected] = React.useState("root");

  // Mobile: single column with a master→detail toggle. Selecting any node
  // flips to the detail pane; a Back button returns to the tree.
  const narrow = useIsNarrow(820);
  const [mobilePane, setMobilePane] = React.useState("tree");
  const firstSel = React.useRef(true);
  React.useEffect(() => {
    if (firstSel.current) { firstSel.current = false; return; }
    if (narrow) setMobilePane("detail");
  }, [selected]);

  // Combined LM + Non-LM rows, tagged with system + uid.
  const allRows = React.useMemo(() => {
    if (!data) return [];
    const out = [];
    for (const r of data.lm || [])     out.push({ ...r, system: "LM",     uid: out.length });
    for (const r of data.non_lm || []) out.push({ ...r, system: "Non-LM", uid: out.length });
    return out;
  }, [data]);

  const counts = {};
  counts.all = allRows.length;
  for (const r of allRows) counts[r.category] = (counts[r.category] || 0) + 1;
  const byCat = React.useMemo(() => byCategoryUid(allRows), [allRows]);

  const matchesQuery = (r, query) => {
    if (!query) return true;
    const blob = [r.year, r.models, r.category, r.task, r.intended, r.actual, r.source_title, r.system]
      .join(" ")
      .toLowerCase();
    return blob.includes(query.toLowerCase().trim());
  };
  const filteredByCat = {};
  for (const c of CATS) filteredByCat[c] = byCat[c].filter((r) => matchesQuery(r, q));

  const subgroupsByCat = React.useMemo(() => {
    if (groupBy === "none") return null;
    const out = {};
    for (const c of TOP_CATS) {
      const inList = q ? filteredByCat[c] : byCat[c];
      out[c] = buildSubgroups(inList, groupBy);
    }
    return out;
  // eslint-disable-next-line
  }, [groupBy, q, byCat, allRows]);

  // When search is active, auto-expand categories (and their subgroups) with matches
  const effectiveExpanded = React.useMemo(() => {
    if (!q) return expanded;
    const e = new Set(expanded);
    for (const c of TOP_CATS) {
      if (filteredByCat[c].length > 0) {
        e.add("cat:" + c);
        if (subgroupsByCat && subgroupsByCat[c]) {
          for (const k of subgroupsByCat[c].keys) {
            e.add(`sub:${c}:${groupBy}:${k}`);
          }
        }
      }
    }
    return e;
  // eslint-disable-next-line
  }, [q, expanded, allRows, subgroupsByCat, groupBy]);

  // Resolve selection → detail-pane content kind
  const sel = React.useMemo(() => {
    if (selected === "root") return { kind: "root" };
    if (selected.startsWith("cat:")) {
      const c = selected.slice(4);
      return CAT_META[c] ? { kind: "cat", cat: c } : { kind: "root" };
    }
    if (selected.startsWith("sub:")) {
      const [, c, mode, ...rest] = selected.split(":");
      return { kind: "sub", cat: c, mode, key: rest.join(":") };
    }
    if (selected.startsWith("incident:")) {
      const uid = Number(selected.slice(9));
      const r = allRows[uid];
      return r ? { kind: "incident", row: r } : { kind: "root" };
    }
    return { kind: "root" };
  }, [selected, allRows]);

  if (!data) return <Loading />;

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalFilteredCount = CATS.reduce((s, c) => s + filteredByCat[c].length, 0);
  const groupByMeta = GROUP_BYS.find((g) => g.id === groupBy);

  return (
    <div className={"cs v6" + (narrow ? " is-narrow show-" + mobilePane : "")}>
      <TopNav active="incidents" view={view || "tree"} onViewChange={onViewChange} />

      <Toolbar>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <GroupBySelector value={groupBy} onChange={(g) => { setGroupBy(g); }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.66rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            View: Tree
          </span>
          <input
            className="cs-search"
            placeholder="Search the catalogue…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <span className="cs-count">{totalFilteredCount} MATCH{totalFilteredCount === 1 ? "" : "ES"}</span>
          )}
        </div>
      </Toolbar>

      <div className="v6-body">
        {/* ── LEFT: tree ── */}
        <div className="v6-tree-pane">
          {/* Root row */}
          <TreeRow
            depth={0}
            id="root"
            label="All entries"
            count={allRows.length}
            kind="root"
            expanded={true}
            hasChildren={true}
            selected={selected === "root"}
            onSelect={() => setSelected("root")}
          />

          {TOP_CATS.map((c) => {
            const meta = CAT_META[c];
            const cid = "cat:" + c;
            const cOpen = effectiveExpanded.has(cid);
            const inList = q ? filteredByCat[c] : byCat[c];
            const sub = subgroupsByCat ? subgroupsByCat[c] : null;
            const hasChildren = inList.length > 0;
            return (
              <React.Fragment key={c}>
                <TreeRow
                  depth={1}
                  id={cid}
                  label={meta.full}
                  short={c}
                  count={byCat[c].length}
                  matchCount={q ? filteredByCat[c].length : null}
                  kind="cat"
                  catSlug={meta.slug}
                  blurb={meta.blurb}
                  expanded={cOpen}
                  hasChildren={hasChildren}
                  selected={selected === cid}
                  onToggle={() => toggle(cid)}
                  onSelect={() => setSelected(cid)}
                />

                {cOpen && sub && sub.keys.map((k) => {
                  const sid = `sub:${c}:${groupBy}:${k}`;
                  const sOpen = effectiveExpanded.has(sid);
                  const sRows = sub.map.get(k);
                  return (
                    <React.Fragment key={k}>
                      <TreeRow
                        depth={2}
                        id={sid}
                        label={k}
                        count={sRows.length}
                        kind="sub"
                        catSlug={meta.slug}
                        expanded={sOpen}
                        hasChildren={sRows.length > 0}
                        selected={selected === sid}
                        onToggle={() => toggle(sid)}
                        onSelect={() => setSelected(sid)}
                      />
                      {sOpen && sRows.slice(0, 100).map((r) => {
                        const incId = `incident:${r.uid}`;
                        return (
                          <TreeRow
                            key={incId}
                            depth={3}
                            id={incId}
                            label={r.task}
                            meta={`${r.year && r.year > 0 ? r.year : "—"} · ${r.models}`}
                            kind="incident"
                            catSlug={meta.slug}
                            expanded={false}
                            hasChildren={false}
                            selected={selected === incId}
                            onSelect={() => setSelected(incId)}
                          />
                        );
                      })}
                      {sOpen && sRows.length > 100 && (
                        <div className="v6-truncated" style={{ paddingLeft: 88 }}>
                          + {sRows.length - 100} more…
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {cOpen && !sub && inList.slice(0, 200).map((r) => {
                  const incId = `incident:${r.uid}`;
                  return (
                    <TreeRow
                      key={incId}
                      depth={2}
                      id={incId}
                      label={r.task}
                      meta={`${r.year && r.year > 0 ? r.year : "—"} · ${r.models}`}
                      kind="incident"
                      catSlug={meta.slug}
                      expanded={false}
                      hasChildren={false}
                      selected={selected === incId}
                      onSelect={() => setSelected(incId)}
                    />
                  );
                })}

                {cOpen && !sub && inList.length > 200 && (
                  <div className="v6-truncated" style={{ paddingLeft: 56 }}>
                    + {inList.length - 200} more {meta.isOOS ? "entries" : "incidents"} in this bucket…
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── RIGHT: detail pane ── */}
        <aside className="v6-detail">
          {narrow && (
            <button className="v6-back" onClick={() => setMobilePane("tree")}>
              ← Back to tree
            </button>
          )}
          {sel.kind === "root" && (
            <RootSummary allRows={allRows} counts={counts} />
          )}
          {sel.kind === "cat" && (
            <CategorySummary cat={sel.cat} rows={byCat[sel.cat]} />
          )}
          {sel.kind === "sub" && (
            <SubgroupSummary
              cat={sel.cat}
              mode={sel.mode}
              groupKey={sel.key}
              rows={(subgroupsByCat && subgroupsByCat[sel.cat] && subgroupsByCat[sel.cat].map.get(sel.key)) || []}
            />
          )}
          {sel.kind === "incident" && (
            <IncidentDetail
              row={sel.row}
              allRows={allRows}
              onSelectIncident={(uid) => setSelected("incident:" + uid)}
            />
          )}
        </aside>
      </div>

      <V6Styles />
    </div>
  );
}

// ─── Group-by selector ──────────────────────────────────────────────────────
function GroupBySelector({ value, onChange }) {
  return (
    <div className="v6-gb">
      <span className="v6-gb-lbl">Group by</span>
      <div className="v6-gb-pills">
        {GROUP_BYS.map((g) => (
          <button
            key={g.id}
            className={"v6-gb-pill" + (value === g.id ? " active" : "")}
            onClick={() => onChange(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tree row ───────────────────────────────────────────────────────────────
function TreeRow({
  depth, id, label, short, count, matchCount, meta,
  kind, catSlug, blurb,
  expanded, hasChildren, selected,
  onToggle, onSelect,
}) {
  const indent = 8 + depth * 20;
  const isCatTip = kind === "cat" && !!blurb;
  const tip = useAcroTip();
  const tipMeta = isCatTip
    ? (resolveCatMeta(short) || { slug: catSlug, key: short, full: label, blurb })
    : null;
  const onRowClick = (e) => {
    if (e.target.dataset.role === "disclosure") return;
    onSelect && onSelect();
  };

  const disclosureChar = hasChildren ? (expanded ? "▾" : "▸") : "";
  const onDisc = (e) => {
    e.stopPropagation();
    if (hasChildren && onToggle) onToggle();
  };

  const dot =
    kind === "cat" ? <span className={"cat-dot " + catSlug} /> :
    kind === "sub" ? <span className={"cat-dot " + catSlug} style={{ opacity: 0.45 }} /> :
    kind === "incident" ? <span className={"cat-dot " + catSlug} style={{ opacity: 0.6 }} /> :
    null;

  const folderIcon = (kind === "cat" || kind === "root") ? (
    <span className={"v6-folder " + (expanded ? "open " : "") + (kind === "root" ? "root" : "")}>
      {kind === "root" ? "◆" : "▣"}
    </span>
  ) : kind === "sub" ? (
    <span className="v6-folder sub">{expanded ? "▤" : "▥"}</span>
  ) : null;

  return (
    <div
      ref={tip.ref}
      className={"v6-row v6-" + kind + (selected ? " selected" : "")}
      onClick={onRowClick}
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={selected}
      tabIndex="0"
      {...(isCatTip ? tip.handlers : {})}
    >
      <div className="v6-row-indent" style={{ width: indent }}>
        <span
          data-role="disclosure"
          className="v6-disc"
          onClick={onDisc}
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
        >
          {disclosureChar}
        </span>
      </div>
      {folderIcon}
      {dot}
      <span className="v6-row-label">{label}</span>
      {short && kind === "cat" && (
        <span className={"v6-row-code " + (catSlug || "")}>{short}</span>
      )}
      {meta && <span className="v6-row-meta">{meta}</span>}
      {(count != null || matchCount != null) && (
        <span className="v6-row-count">
          {matchCount != null ? (
            <>
              <b>{matchCount}</b>
              <span style={{ opacity: 0.45 }}> / {count}</span>
            </>
          ) : (
            count
          )}
        </span>
      )}

      {/* Hover tooltip — only category rows (portaled to body, never clipped) */}
      {isCatTip && tipMeta && (
        <AcronymTipBubble meta={tipMeta} anchorRef={tip.ref} visible={tip.visible} />
      )}
    </div>
  );
}

// ─── Detail panes ───────────────────────────────────────────────────────────

function RootSummary({ allRows, counts }) {
  const total = allRows.length || 1;
  const sgCount = (counts.ASG || 0) + (counts.USG || 0);
  const oosCount =
    (counts["OOS-NSE"] || 0) +
    (counts["OOS-BC"] || 0) +
    (counts["OOS-BI"] || 0) +
    (counts.OOS || 0);
  const lmCount = allRows.filter((r) => r.system === "LM").length;
  const nonLmCount = allRows.length - lmCount;

  return (
    <div className="v6-detail-inner">
      <div className="v6-eyebrow">SELECTED · ROOT</div>
      <h2 className="v6-headline">All entries</h2>
      <div className="v6-bignum">
        <span className="v6-bignum-n">{allRows.length}</span>
        <span className="v6-bignum-l">entries in the catalogue</span>
      </div>

      <div className="v6-statbar">
        <div className="v6-statbar-row">
          <span className="v6-statbar-lbl">Incidents — specification gaming (<AcronymTip code="USG" align="right">USG</AcronymTip> + <AcronymTip code="ASG" align="right">ASG</AcronymTip>)</span>
          <span className="v6-statbar-val">{sgCount}</span>
        </div>
        <div className="v6-statbar-bar">
          <div className="v6-statbar-fill sg" style={{ width: (sgCount / total) * 100 + "%" }} />
        </div>
        <div className="v6-statbar-row" style={{ marginTop: "0.6rem" }}>
          <span className="v6-statbar-lbl">Out of Scope (<AcronymTip code="NSE" align="right">NSE</AcronymTip> + <AcronymTip code="BC" align="right">BC</AcronymTip> + <AcronymTip code="BI" align="right">BI</AcronymTip> + <AcronymTip code="OOS" align="right">OOS</AcronymTip>)</span>
          <span className="v6-statbar-val">{oosCount}</span>
        </div>
        <div className="v6-statbar-bar">
          <div className="v6-statbar-fill oos" style={{ width: (oosCount / total) * 100 + "%" }} />
        </div>
        <div className="v6-statbar-row" style={{ marginTop: "1rem" }}>
          <span className="v6-statbar-lbl">Language models</span>
          <span className="v6-statbar-val">{lmCount}</span>
        </div>
        <div className="v6-statbar-bar">
          <div className="v6-statbar-fill lm" style={{ width: (lmCount / total) * 100 + "%" }} />
        </div>
        <div className="v6-statbar-row" style={{ marginTop: "0.6rem" }}>
          <span className="v6-statbar-lbl">Non-LM systems</span>
          <span className="v6-statbar-val">{nonLmCount}</span>
        </div>
        <div className="v6-statbar-bar">
          <div className="v6-statbar-fill nlm" style={{ width: (nonLmCount / total) * 100 + "%" }} />
        </div>
      </div>

      <p className="v6-prose">
        Browse the catalogue by expanding the tree on the left. Each category
        corresponds to a terminal category. Use the <b>Group by</b>
        {" "}control above to add a secondary level — by system type, year,
        model family, or source paper.
      </p>
    </div>
  );
}

function CategorySummary({ cat, rows }) {
  const meta = CAT_META[cat];
  return (
    <div className="v6-detail-inner">
      <div className="v6-eyebrow">SELECTED · CATEGORY</div>
      <div className="v6-cat-head">
        <span className={"cat-badge " + meta.slug}>{cat}</span>
        <h2 className="v6-headline">{meta.full}</h2>
      </div>

      <p className="v6-prose">{meta.blurb}</p>

      <div className="v6-bignum">
        <span className="v6-bignum-n">{rows.length}</span>
        <span className="v6-bignum-l">{meta.isOOS ? "out-of-scope entries in this bucket" : "incidents in this bucket"}</span>
      </div>

      {/* tiny year histogram */}
      {(() => {
        const yMap = {};
        for (const r of rows) {
          const y = r.year && r.year > 0 ? r.year : "—";
          yMap[y] = (yMap[y] || 0) + 1;
        }
        const years = Object.keys(yMap).sort();
        const max = Math.max(1, ...Object.values(yMap));
        return (
          <div className="v6-yearhist">
            <div className="v6-eyebrow" style={{ marginBottom: "0.4rem" }}>BY YEAR</div>
            <div className="v6-yearhist-bars">
              {years.map((y) => (
                <div key={y} className="v6-yhc">
                  <div className={"v6-yhfill " + meta.slug} style={{ height: (yMap[y] / max) * 100 + "%" }} />
                  <div className="v6-yhnum">{yMap[y]}</div>
                  <div className="v6-yhlbl">{y}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="v6-hint">
        Expand this node in the tree to browse every {meta.isOOS ? "entry" : "incident"} in <b>{cat}</b>.
      </div>
    </div>
  );
}

function SubgroupSummary({ cat, mode, groupKey, rows }) {
  const meta = CAT_META[cat];
  const modeLabel = (GROUP_BYS.find((g) => g.id === mode) || {}).label || mode;
  return (
    <div className="v6-detail-inner">
      <div className="v6-eyebrow">SELECTED · SUBGROUP</div>
      <div className="v6-cat-head">
        <span className={"cat-badge " + meta.slug}>{cat}</span>
        <span className="v6-sub-chev">›</span>
        <span className="v6-sub-mode">{modeLabel}</span>
      </div>
      <h2 className="v6-headline">{groupKey}</h2>

      <div className="v6-bignum">
        <span className="v6-bignum-n">{rows.length}</span>
        <span className="v6-bignum-l">{meta.isOOS ? "entries" : "incidents"}</span>
      </div>

      <p className="v6-prose">
        {meta.isOOS ? "Entries" : "Incidents"} classified as <b>{meta.full} ({cat})</b> within the{" "}
        <b>{groupKey}</b> {modeLabel.toLowerCase()} bucket.
      </p>

      <div className="v6-hint">
        Click any incident in the tree to see its full description.
      </div>
    </div>
  );
}

// Convert any source link to its embeddable PDF URL when possible.
// arXiv: /abs/X → /pdf/X ; everything else returned as-is (and we'll let
// the iframe try; if the host refuses to embed, we show the fallback).
function embedUrlFor(link) {
  if (!link) return null;
  try {
    const u = new URL(link);
    if (u.hostname.endsWith("arxiv.org")) {
      // /abs/<id> or /pdf/<id> — normalize to /pdf/<id>
      const m = u.pathname.match(/\/(abs|pdf)\/([^/]+?)(?:\.pdf)?\/?$/);
      if (m) return `https://arxiv.org/pdf/${m[2]}`;
    }
    // .pdf direct
    if (u.pathname.toLowerCase().endsWith(".pdf")) return u.toString();
    // Anything else (blog posts, system cards, HTML pages) is not embedded:
    // most such hosts refuse framing and the browser shows its own error
    // instead of our fallback, so go straight to the fallback panel.
    return null;
  } catch (e) {
    return link;
  }
}

function IncidentDetail({ row, allRows, onSelectIncident, permalinkHeadline = true }) {
  const embed = embedUrlFor(row.source_link);
  const [embedError, setEmbedError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  // Reset embed state whenever we switch incidents
  React.useEffect(() => {
    setEmbedError(false);
    setLoaded(false);
    // If the iframe hasn't fired onLoad within 5s, assume the host blocked it.
    const t = setTimeout(() => setLoaded((cur) => cur ? cur : (setEmbedError(true), false)), 6000);
    return () => clearTimeout(t);
  }, [row && row.source_link]);

  const meta = CAT_META[row.category];

  // Other incidents from the same paper (match by source_link, else title)
  const siblings = React.useMemo(() => {
    if (!allRows) return [];
    const matchKey = row.source_link || row.source_title;
    if (!matchKey) return [];
    return allRows.filter((r) =>
      r.uid !== row.uid &&
      ((r.source_link && r.source_link === row.source_link) ||
       (!row.source_link && r.source_title === row.source_title))
    );
  }, [row, allRows]);
  return (
    <div className="v6-detail-inner">
      <div className="v6-eyebrow v6-eyebrow-row">
        <span>SELECTED · {meta.isOOS ? "ENTRY" : "INCIDENT"}</span>
        {row.incident_id && (
          <a
            className="v6-inc-permalink"
            href={csPermalink(row.incident_id)}
            title="Permanent link to this incident"
          >
            {row.incident_id}
          </a>
        )}
      </div>

      <div className="v6-inc-meta">
        <span className="v6-inc-year">{row.year && row.year > 0 ? row.year : "—"}</span>
        <span className="v6-inc-sep">·</span>
        <span className="v6-inc-models">{row.models}</span>
        <span className="v6-inc-sep">·</span>
        <span className="v6-inc-sys">{row.system}</span>
        <CatBadge cat={row.category} align="right" style={{ marginLeft: "auto" }} />
      </div>

      <h2 className="v6-headline">
        {permalinkHeadline && row.incident_id ? (
          <a
            className="v6-headline-link"
            href={csPermalink(row.incident_id)}
            title="Open this incident's own page (permanent link)"
          >
            {row.task}
          </a>
        ) : row.task}
      </h2>

      <div className="v6-inc-block">
        <div className="v6-inc-blbl">INTENDED BEHAVIOUR</div>
        <p>{row.intended}</p>
      </div>
      <div className="v6-inc-block actual">
        <div className="v6-inc-blbl actual">ACTUAL BEHAVIOUR</div>
        <p>{row.actual}</p>
      </div>

      <div className="v6-inc-source">
        <span className="v6-inc-srclbl">SOURCE</span>
        <a href={row.source_link} target="_blank" rel="noopener">
          {row.source_title} ↗
        </a>
      </div>

      {/* === More entries from this paper =================================== */}
      {siblings.length > 0 && (
        <div className="v6-siblings">
          <div className="v6-siblings-head">
            <span className="v6-siblings-eyebrow">MORE FROM THIS PAPER</span>
            <span className="v6-siblings-count">{siblings.length} other{siblings.length === 1 ? "" : "s"}</span>
          </div>
          <ul className="v6-siblings-list">
            {siblings.slice(0, 8).map((r) => {
              const smeta = CAT_META[r.category] || {};
              return (
                <li
                  key={r.uid}
                  className="v6-siblings-item"
                  onClick={() => onSelectIncident && onSelectIncident(r.uid)}
                  role="button"
                  tabIndex="0"
                >
                  <div className="v6-siblings-meta">
                    <CatBadge cat={r.category} align="right" />
                    <span className="v6-siblings-year">{r.year && r.year > 0 ? r.year : "—"}</span>
                    <span className="v6-siblings-models">{r.models}</span>
                  </div>
                  <div className="v6-siblings-task">{r.task}</div>
                </li>
              );
            })}
          </ul>
          {siblings.length > 8 && (
            <div className="v6-siblings-more">
              + {siblings.length - 8} more from this paper
            </div>
          )}
        </div>
      )}

      {/* === Embedded paper ============================================== */}
      <div className="v6-paper">
        <div className="v6-paper-head">
          <span className="v6-paper-eyebrow">PAPER</span>
          <a href={row.source_link} target="_blank" rel="noopener" className="v6-paper-open">
            open in new tab ↗
          </a>
        </div>
        <div className="v6-paper-frame">
          {embed && !embedError ? (
            <iframe
              key={embed}
              src={embed}
              title={row.source_title}
              onLoad={() => setLoaded(true)}
              onError={() => setEmbedError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="v6-paper-fallback">
              <div className="v6-paper-fb-icon">📄</div>
              <div className="v6-paper-fb-title">{row.source_title}</div>
              <div className="v6-paper-fb-msg">
                This source can't be embedded in the page.
              </div>
              <a className="v6-paper-fb-cta" href={row.source_link} target="_blank" rel="noopener">
                Open the source ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
function V6Styles() {
  return (
    <style>{`
      .v6 { background: white; }
      .v6-toolbar-hint { font-family: var(--font-mono); font-size: 0.66rem; color: var(--color-muted); }
      .v6-toolbar-hint-eyebrow { font-weight: 700; color: var(--nord1); letter-spacing: 0.08em; }

      /* Group-by selector */
      .v6-gb { display: flex; align-items: center; gap: 0.55rem; }
      .v6-gb-lbl {
        font-family: var(--font-mono);
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        color: var(--color-muted);
        text-transform: uppercase;
      }
      .v6-gb-pills { display: inline-flex; border: 1px solid var(--nord4); border-radius: 4px; overflow: hidden; }
      .v6-gb-pill {
        background: none;
        border: 0;
        padding: 0.28rem 0.65rem;
        font-family: var(--font-mono);
        font-size: 0.7rem;
        color: var(--color-muted);
        cursor: pointer;
        border-right: 1px solid var(--nord4);
      }
      .v6-gb-pill:last-child { border-right: 0; }
      .v6-gb-pill:hover { background: var(--nord6); }
      .v6-gb-pill.active { background: var(--color-accent); color: white; }

      .v6-body {
        display: grid;
        grid-template-columns: 580px 1fr;
        gap: 0;
        height: calc(100vh - 96px);
        min-height: 700px;
        max-width: 1440px;
        margin: 0 auto;
        border-left: 1px solid var(--nord4);
        border-right: 1px solid var(--nord4);
      }

      /* ── Tree pane ── */
      .v6-tree-pane {
        background: #fcfcfb;
        border-right: 1px solid var(--nord4);
        overflow: auto;
        padding: 0.5rem 0;
        font-family: var(--font-mono);
        font-size: 0.74rem;
      }
      .v6-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.28rem 1rem 0.28rem 0;
        cursor: pointer;
        position: relative;
        border-left: 2px solid transparent;
        transition: background .08s;
        line-height: 1.4;
      }
      .v6-row:hover { background: rgba(94, 129, 172, 0.06); }
      .v6-row.selected {
        background: var(--color-accent-light);
        border-left-color: var(--color-accent);
      }
      .v6-row-indent {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex: 0 0 auto;
      }
      .v6-disc {
        font-size: 0.7rem;
        color: var(--color-muted);
        cursor: pointer;
        padding: 0 4px;
        user-select: none;
      }
      .v6-disc:hover { color: var(--color-accent); }

      .v6-folder { font-size: 0.72rem; color: var(--nord3); flex: 0 0 auto; }
      .v6-folder.root { color: var(--color-accent); font-size: 0.7rem; }
      .v6-folder.open { color: var(--nord2); }
      .v6-folder.sub { color: var(--nord3); font-size: 0.68rem; opacity: 0.7; }

      .v6-row-label {
        flex: 1 1 auto;
        min-width: 0;
        color: var(--nord1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .v6-row.v6-incident .v6-row-label {
        font-family: var(--font-sans);
        font-size: 0.8rem;
        color: var(--nord0);
        white-space: normal;
        line-height: 1.35;
      }
      .v6-row.v6-cat .v6-row-label { font-weight: 600; }
      .v6-row.v6-sub .v6-row-label {
        font-family: var(--font-sans);
        font-size: 0.78rem;
        color: var(--nord1);
        font-weight: 500;
        white-space: nowrap;
      }
      .v6-row.v6-root .v6-row-label {
        font-weight: 700;
        font-size: 0.7rem;
        letter-spacing: 0.04em;
        color: var(--nord0);
      }
      .v6-row-code {
        flex: 0 0 auto;
        font-size: 0.58rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 1px 5px;
        border-radius: 2px;
        color: var(--nord2);
        background: var(--nord5);
      }
      .v6-row-code.asg     { color: var(--cat-asg-fg);     background: var(--cat-asg-bg); }
      .v6-row-code.usg     { color: var(--cat-usg-fg);     background: var(--cat-usg-bg); }
      .v6-row-code.oos     { color: var(--cat-oos-fg);     background: var(--cat-oos-bg); }
      .v6-row-code.oos-nse { color: var(--cat-oos-nse-fg); background: var(--cat-oos-nse-bg); }
      .v6-row-code.oos-bc  { color: var(--cat-oos-bc-fg);  background: var(--cat-oos-bc-bg); }
      .v6-row-code.oos-bi  { color: var(--cat-oos-bi-fg);  background: var(--cat-oos-bi-bg); }

      .v6-row-meta {
        flex: 0 0 auto;
        font-size: 0.6rem;
        color: var(--color-muted);
        font-variant-numeric: tabular-nums;
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .v6-row-count {
        flex: 0 0 auto;
        font-size: 0.66rem;
        color: var(--color-muted);
        font-variant-numeric: tabular-nums;
        min-width: 28px;
        text-align: right;
      }
      .v6-row-count b { color: var(--nord0); font-weight: 700; }

      /* Incident name in the detail pane IS the permanent link — underlined */
      .v6-headline-link {
        color: inherit;
        text-decoration: underline;
        text-decoration-color: var(--nord4);
        text-underline-offset: 4px;
      }
      .v6-headline-link:hover {
        color: var(--color-accent);
        text-decoration-color: var(--color-accent);
      }

      .v6-truncated {
        font-family: var(--font-mono);
        font-size: 0.66rem;
        color: var(--color-muted);
        padding: 0.4rem 1rem 0.4rem 0;
        font-style: italic;
      }

      /* ── Category-row hover tooltip ── */
      .v6-tt {
        position: absolute;
        left: calc(100% - 4px);
        top: -4px;
        width: 340px;
        background: white;
        border: 1px solid var(--nord3);
        box-shadow: 0 12px 32px rgba(46, 52, 64, 0.18), 0 2px 6px rgba(46, 52, 64, 0.06);
        padding: 0.7rem 0.85rem 0.75rem;
        font-family: var(--font-sans);
        font-size: 0.78rem;
        line-height: 1.5;
        color: var(--nord1);
        opacity: 0;
        pointer-events: none;
        transform: translateX(-6px);
        transition: opacity .15s, transform .15s;
        transition-delay: 0s;
        z-index: 1000;
      }
      .v6-tt::before {
        content: "";
        position: absolute;
        top: 18px;
        left: -5px;
        width: 8px;
        height: 8px;
        background: white;
        border-left: 1px solid var(--nord3);
        border-bottom: 1px solid var(--nord3);
        transform: rotate(45deg);
      }
      .v6-row.v6-cat:hover .v6-tt {
        opacity: 1;
        transform: translateX(0);
        transition-delay: 0.15s;
      }
      .v6-tt-head {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-bottom: 0.45rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid var(--nord5);
        font-family: var(--font-mono);
        font-size: 0.7rem;
      }
      .v6-tt-code { font-weight: 700; color: var(--nord0); letter-spacing: 0.05em; }
      .v6-tt-full { color: var(--color-muted); font-size: 0.66rem; }
      .v6-tt p { margin: 0; color: var(--nord2); text-wrap: pretty; }

      /* ── Detail pane ── */
      .v6-detail { background: var(--nord6); overflow: auto; }
      .v6-detail-inner { padding: 1.6rem 1.8rem 2rem; max-width: 720px; }

      .v6-eyebrow {
        font-family: var(--font-mono);
        font-size: 0.58rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        color: var(--color-muted);
        margin-bottom: 0.5rem;
      }
      .v6-eyebrow-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;
      }
      .v6-inc-permalink {
        font-family: var(--font-mono);
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: var(--color-muted);
        text-decoration: none;
        border: 1px solid var(--nord4);
        padding: 0.1rem 0.45rem;
        border-radius: 3px;
      }
      .v6-inc-permalink:hover { color: var(--color-accent); border-color: var(--color-accent); }
      .v6-headline {
        font-family: var(--font-sans);
        font-weight: 500;
        font-size: 1.55rem;
        line-height: 1.25;
        letter-spacing: -0.01em;
        color: var(--nord0);
        margin: 0 0 1rem;
        text-wrap: pretty;
      }
      .v6-prose {
        font-family: var(--font-sans);
        font-size: 0.88rem;
        line-height: 1.55;
        color: var(--nord1);
        margin: 0 0 1.3rem;
        text-wrap: pretty;
      }
      .v6-prose b { color: var(--nord0); }
      .v6-hint {
        font-family: var(--font-sans);
        font-size: 0.78rem;
        color: var(--color-muted);
        margin-top: 1.2rem;
      }
      .v6-hint b { color: var(--nord1); }

      .v6-bignum {
        display: flex;
        align-items: baseline;
        gap: 0.55rem;
        margin: 0 0 1.5rem;
      }
      .v6-bignum-n {
        font-family: var(--font-sans);
        font-weight: 300;
        font-size: 3rem;
        line-height: 1;
        color: var(--nord0);
        font-variant-numeric: tabular-nums;
      }
      .v6-bignum-l {
        font-family: var(--font-mono);
        font-size: 0.7rem;
        color: var(--color-muted);
        letter-spacing: 0.04em;
      }

      .v6-statbar { margin-bottom: 1.5rem; }
      .v6-statbar-row {
        display: flex;
        justify-content: space-between;
        font-family: var(--font-mono);
        font-size: 0.7rem;
        color: var(--nord1);
        margin-bottom: 0.3rem;
      }
      .v6-statbar-lbl { font-weight: 600; }
      .v6-statbar-val { font-variant-numeric: tabular-nums; color: var(--nord0); font-weight: 700; }
      .v6-statbar-bar {
        height: 6px;
        background: var(--nord5);
        border-radius: 1px;
        overflow: hidden;
      }
      .v6-statbar-fill { height: 100%; }
      .v6-statbar-fill.sg  { background: var(--cat-asg-solid); }
      .v6-statbar-fill.oos { background: var(--nord3); }
      .v6-statbar-fill.lm  { background: var(--nord10); }
      .v6-statbar-fill.nlm { background: var(--cat-oos-bc-solid); }

      /* category summary */
      .v6-cat-head {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin-bottom: 0.8rem;
      }
      .v6-cat-head .v6-headline { margin: 0; }
      .v6-sub-chev { font-size: 1.1rem; color: var(--nord4); }
      .v6-sub-mode {
        font-family: var(--font-mono);
        font-size: 0.66rem;
        color: var(--color-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .v6-yearhist { margin: 1rem 0 0.5rem; }
      .v6-yearhist-bars {
        display: flex;
        gap: 8px;
        align-items: flex-end;
        height: 110px;
      }
      .v6-yhc {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        justify-content: flex-end;
      }
      .v6-yhfill { width: 100%; min-height: 2px; border-radius: 1px; }
      .v6-yhfill.asg     { background: var(--cat-asg-solid); }
      .v6-yhfill.usg     { background: var(--cat-usg-solid); }
      .v6-yhfill.oos     { background: var(--nord3); }
      .v6-yhfill.oos-nse { background: var(--cat-oos-nse-solid); }
      .v6-yhfill.oos-bc  { background: var(--cat-oos-bc-solid); }
      .v6-yhfill.oos-bi  { background: var(--cat-oos-bi-solid); }
      .v6-yhnum { font-family: var(--font-mono); font-size: 0.62rem; color: var(--nord1); margin-top: 0.2rem; }
      .v6-yhlbl { font-family: var(--font-mono); font-size: 0.58rem; color: var(--color-muted); }

      /* incident detail */
      .v6-inc-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: var(--font-mono);
        font-size: 0.72rem;
        color: var(--nord2);
        margin-bottom: 0.5rem;
      }
      .v6-inc-year { font-weight: 700; color: var(--nord0); }
      .v6-inc-sep { color: var(--nord4); }
      .v6-inc-models { color: var(--color-muted); }
      .v6-inc-sys {
        font-weight: 700;
        font-size: 0.6rem;
        letter-spacing: 0.08em;
        padding: 1px 5px;
        border-radius: 2px;
        background: var(--nord5);
        color: var(--nord2);
      }

      .v6-inc-block {
        background: white;
        border-left: 3px solid var(--cat-asg-solid);
        padding: 0.7rem 0.85rem 0.75rem;
        margin-bottom: 0.7rem;
        border-radius: 0 4px 4px 0;
      }
      .v6-inc-block.actual { border-left-color: var(--cat-usg-solid); }
      .v6-inc-blbl {
        font-family: var(--font-mono);
        font-size: 0.58rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        color: var(--cat-asg-fg);
        margin-bottom: 0.3rem;
      }
      .v6-inc-blbl.actual { color: var(--cat-usg-fg); }
      .v6-inc-block p {
        margin: 0;
        font-family: var(--font-sans);
        font-size: 0.88rem;
        line-height: 1.55;
        color: var(--nord1);
        text-wrap: pretty;
      }

      .v6-inc-source {
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px dashed var(--nord4);
        display: flex;
        align-items: baseline;
        gap: 0.6rem;
      }
      .v6-inc-srclbl {
        font-family: var(--font-mono);
        font-size: 0.56rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        color: var(--color-muted);
      }
      .v6-inc-source a {
        font-family: var(--font-mono);
        font-size: 0.74rem;
        color: var(--color-accent);
        text-decoration: none;
      }
      .v6-inc-source a:hover { text-decoration: underline; }

      /* more incidents from this paper */
      .v6-siblings { margin-top: 1.4rem; }
      .v6-siblings-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }
      .v6-siblings-eyebrow {
        font-family: var(--font-mono);
        font-size: 0.56rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        color: var(--color-muted);
      }
      .v6-siblings-count {
        font-family: var(--font-mono);
        font-size: 0.62rem;
        color: var(--color-muted);
        font-variant-numeric: tabular-nums;
      }
      .v6-siblings-list {
        list-style: none;
        margin: 0;
        padding: 0;
        border-top: 1px solid var(--nord4);
      }
      .v6-siblings-item {
        padding: 0.55rem 0.4rem;
        margin: 0 -0.4rem;
        border-bottom: 1px dashed var(--nord4);
        cursor: pointer;
        border-radius: 2px;
        transition: background .08s;
      }
      .v6-siblings-item:hover {
        background: white;
      }
      .v6-siblings-meta {
        display: flex;
        align-items: baseline;
        gap: 0.45rem;
        font-family: var(--font-mono);
        font-size: 0.66rem;
        color: var(--color-muted);
        margin-bottom: 0.2rem;
      }
      .v6-siblings-year { font-weight: 700; color: var(--nord1); font-variant-numeric: tabular-nums; }
      .v6-siblings-models {
        color: var(--color-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 260px;
      }
      .v6-siblings-task {
        font-family: var(--font-sans);
        font-size: 0.8rem;
        line-height: 1.4;
        color: var(--nord0);
        text-wrap: pretty;
      }
      .v6-siblings-more {
        font-family: var(--font-mono);
        font-size: 0.66rem;
        color: var(--color-muted);
        font-style: italic;
        padding: 0.4rem 0 0;
      }

      /* embedded paper */
      .v6-paper { margin-top: 1.5rem; }
      .v6-paper-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 0.4rem;
      }
      .v6-paper-eyebrow {
        font-family: var(--font-mono);
        font-size: 0.56rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        color: var(--color-muted);
      }
      .v6-paper-open {
        font-family: var(--font-mono);
        font-size: 0.66rem;
        color: var(--color-accent);
        text-decoration: none;
      }
      .v6-paper-open:hover { text-decoration: underline; }
      .v6-paper-frame {
        position: relative;
        width: 100%;
        height: 620px;
        background: white;
        border: 1px solid var(--nord4);
        border-radius: 4px;
        overflow: hidden;
      }
      .v6-paper-frame iframe {
        width: 100%;
        height: 100%;
        border: 0;
        display: block;
      }
      .v6-paper-fallback {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        padding: 2rem;
        text-align: center;
        background: var(--nord6);
      }
      .v6-paper-fb-icon { font-size: 2.2rem; opacity: 0.5; }
      .v6-paper-fb-title {
        font-family: var(--font-sans);
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--nord0);
        max-width: 80%;
        text-wrap: pretty;
      }
      .v6-paper-fb-msg {
        font-family: var(--font-sans);
        font-size: 0.78rem;
        color: var(--color-muted);
        margin-bottom: 0.5rem;
      }
      .v6-paper-fb-cta {
        font-family: var(--font-mono);
        font-size: 0.72rem;
        color: white;
        background: var(--color-accent);
        text-decoration: none;
        padding: 0.4rem 0.9rem;
        border-radius: 3px;
      }
      .v6-paper-fb-cta:hover { background: var(--nord1); }

      /* ============ Mobile (.is-narrow) ============ */
      .is-narrow .v6-body {
        grid-template-columns: minmax(0, 1fr);
        height: auto;
        min-height: 0;
        max-width: 100%;
        margin: 0;
        border-left: 0;
        border-right: 0;
      }
      .is-narrow .v6-tree-pane {
        border-right: 0;
        height: auto;
        overflow: hidden;
        font-size: 0.92rem;
        padding-bottom: 1rem;
      }
      /* Tree rows on mobile: predictable layout, no random wrapping.
         Incident rows become two clean lines — a single truncated title,
         then a muted "year · model" line that also truncates (never a 3rd line). */
      .is-narrow .v6-row { align-items: center; }
      .is-narrow .v6-row-label {
        min-width: 0; flex: 1 1 auto;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .is-narrow .v6-row.v6-incident {
        flex-wrap: wrap;
        row-gap: 0.1rem;
        padding-top: 0.6rem;
        padding-bottom: 0.6rem;
      }
      .is-narrow .v6-row.v6-incident .v6-row-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.3;
      }
      .is-narrow .v6-row.v6-incident .v6-row-meta {
        flex: 1 1 100%;
        max-width: 100%;
        padding-left: 1.55rem;   /* align under the title, past icon + dot */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.66rem;
      }
      .is-narrow .v6-detail { height: auto; overflow: visible; }
      /* master → detail toggle: show one pane at a time */
      .is-narrow.show-tree .v6-detail { display: none; }
      .is-narrow.show-detail .v6-tree-pane { display: none; }
      /* roomier touch targets in the tree */
      .is-narrow .v6-row { padding-top: 0.55rem; padding-bottom: 0.55rem; }
      .is-narrow .v6-detail-inner { padding: 1.1rem 1.1rem 2.5rem; max-width: 100%; }
      .is-narrow .v6-back {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        margin-bottom: 1rem;
        padding: 0.5rem 0.85rem;
        background: var(--nord6);
        border: 1px solid var(--nord4);
        border-radius: 4px;
        font-family: var(--font-mono);
        font-size: 0.78rem;
        color: var(--nord1);
        cursor: pointer;
      }
      .is-narrow .v6-back:active { background: var(--nord5); }
      /* keep wide inner blocks from forcing horizontal scroll */
      .is-narrow .v6-headline { font-size: 1.5rem; }
      .is-narrow .v6-models-line,
      .is-narrow .v6-source-title { max-width: 100% !important; white-space: normal; }
      .is-narrow .v6-paper-fb-title { max-width: 100%; }
    `}</style>
  );
}

window.V6Tree = V6Tree;
window.IncidentDetail = IncidentDetail;
window.V6Styles = V6Styles;
window.embedUrlFor = embedUrlFor;
