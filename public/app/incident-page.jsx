// incident-page.jsx — standalone permalink page for a single incident (/e/<incident_id>).
// Reuses the explorer's IncidentDetail component (from v6-tree.jsx) so the detail
// design has one source of truth. Load AFTER shared.jsx and v6-tree.jsx.

function IncidentCopyLink() {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (e) {
      // Fallback for older browsers / non-secure contexts
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
      } catch (e2) {
        window.prompt("Copy this link:", url);
      }
    }
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="cs-copylink" onClick={copy} type="button">
      {copied ? "copied ✓" : "copy link"}
    </button>
  );
}

function IncidentPage({ id }) {
  const data = useIncidents();

  if (!data) {
    return (
      <>
        <TopNav active="incidents" />
        <Loading label="Loading the incident…" />
      </>
    );
  }

  // Same row construction as the explorer: LM + Non-LM, tagged with system + uid.
  const allRows = [];
  for (const r of data.lm || [])     allRows.push({ ...r, system: "LM",     uid: allRows.length });
  for (const r of data.non_lm || []) allRows.push({ ...r, system: "Non-LM", uid: allRows.length });

  const row = allRows.find((r) => (r.incident_id || "").trim() === id);

  const goSibling = (uid) => {
    const t = allRows.find((r) => r.uid === uid);
    if (t && t.incident_id) window.location.href = csPermalink(t.incident_id);
  };

  return (
    <>
      <TopNav active="incidents" />
      <div className="cs-permapage">
        <div className="cs-permabar">
          <a className="cs-permaback" href="/incidents">← Browse the full catalogue</a>
          {row && <IncidentCopyLink />}
        </div>

        {row ? (
          <div className="cs-permacard">
            <IncidentDetail row={row} allRows={allRows} onSelectIncident={goSibling} permalinkHeadline={false} />
          </div>
        ) : (
          <div className="cs-permamissing">
            <div className="cs-permamissing-id">{id}</div>
            <p>No incident with this id exists in the current catalogue.</p>
            <p>
              It may have been withdrawn, or the link may be mistyped.
              The id format looks like <code>CS-0457</code>.
            </p>
            <a href="/incidents">Browse the full catalogue →</a>
          </div>
        )}
      </div>

      <V6Styles />
      <style>{`
        .cs-permapage {
          max-width: 860px;
          margin: 0 auto;
          padding: 4.4rem 1.5rem 4rem;
        }
        .cs-permabar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.9rem 0.2rem;
        }
        .cs-permaback {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: var(--color-muted);
          text-decoration: none;
        }
        .cs-permaback:hover { color: var(--color-accent); text-decoration: underline; text-underline-offset: 3px; }
        .cs-copylink {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--color-text);
          background: var(--nord6);
          border: 1px solid var(--nord4);
          border-radius: 3px;
          padding: 0.35rem 0.8rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .cs-copylink:hover { border-color: var(--color-accent); color: var(--color-accent); }
        .cs-permacard {
          border: 1px solid var(--nord4);
          background: white;
        }
        /* The reused detail pane fills the card; give the embedded paper more room. */
        .cs-permacard .v6-detail-inner { max-width: none; }
        .cs-permacard .v6-paper-frame iframe { min-height: 70vh; }
        .cs-permamissing {
          border: 1px dashed var(--nord4);
          padding: 2.5rem 2rem;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          line-height: 1.7;
          color: var(--color-text);
        }
        .cs-permamissing-id {
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
          color: var(--color-muted);
        }
        .cs-permamissing a { color: var(--color-accent); }
        .cs-permamissing code { background: var(--nord6); padding: 0.05rem 0.3rem; border-radius: 3px; }
        @media (max-width: 760px) {
          .cs-permapage { padding-top: 3.6rem; }
        }
      `}</style>
    </>
  );
}

window.IncidentPage = IncidentPage;
