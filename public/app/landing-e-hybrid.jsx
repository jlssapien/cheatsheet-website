// landing-e-hybrid.jsx — Hybrid landing page.
// HERO: about the catalogue (prominent). BELOW: specimen carousel.
// Footer: quiet category color strip.

// Easter egg: play the Law & Order "dun-dun" sound effect.
let _dunDunAudio = null;
function playDunDun() {
  if (!_dunDunAudio) _dunDunAudio = new Audio("dun-dun.mp3");
  _dunDunAudio.currentTime = 0;
  _dunDunAudio.play().catch(() => {});
}

function DunDunButton() {
  return (
    <button
      type="button"
      onClick={playDunDun}
      title="♪ dun dun"
      aria-label="Play the dun-dun"
      style={{
        background: "none", border: 0, padding: "0.15em", margin: "0 0 0 0.15em",
        cursor: "pointer", color: "rgba(255,255,255,0.38)",
        verticalAlign: "middle", lineHeight: 0, display: "inline-flex",
        transition: "color .12s, transform .08s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#e85d6d"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.38)"; }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.86)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.8 5.5a9 9 0 0 1 0 13" opacity="0.55" />
      </svg>
    </button>
  );
}

function LandingHybrid() {
  // Shuffle the specimen deck once per page load, then float the USG specimens
  // (the important signal) to the front so a highlight always leads with USG.
  const [deck] = React.useState(() => {
    const a = LP_FEATURED.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    const rank = (c) => (c === "USG" ? 0 : c === "ASG" ? 1 : 2);
    a.sort((x, y) => rank(x.cat) - rank(y.cat));
    return a;
  });
  const [specimen, setSpecimen] = React.useState(0);
  const specimenCount = deck.length;
  const hero = deck[specimen];
  const prevSpecimen = () => setSpecimen((specimen - 1 + specimenCount) % specimenCount);
  const nextSpecimen = () => setSpecimen((specimen + 1) % specimenCount);
  const pad2 = (n) => String(n).padStart(2, "0");
  const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const narrow = useIsNarrow();

  const prefaceLabel = {
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em",
    color: "#e85d6d", paddingTop: "0.5rem",
  };
  const prefaceP = {
    margin: "0 0 1.15rem",
    fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif",
    fontSize: "1.05rem", lineHeight: 1.68,
    color: "rgba(255,255,255,0.72)", fontWeight: 300,
    textWrap: "pretty",
  };
  const prefaceLink = {
    color: "white", textDecoration: "none",
    borderBottom: "1px solid #e85d6d", paddingBottom: "0.05rem",
  };
  const prefaceStrong = { color: "white", fontWeight: 600 };
  const prefaceBlock = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "180px minmax(0, 720px)",
    gap: narrow ? "0.6rem" : "2.5rem",
    padding: narrow ? "1.8rem 0" : "2.6rem 0",
  };

  return (
    <div style={{
      background: "#0a0a08",
      color: "white",
      width: "100%",
      minHeight: "100%",
      fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif",
    }}>
      <LPNav active="home" theme="dark" />

      {/* === HERO — About the catalogue (now prominent) ===================== */}
      <div style={{
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "1.3fr 1fr",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}>
        <div style={{
          padding: narrow ? "2.4rem 1.25rem 2rem" : "4.5rem 3rem 4rem",
          borderRight: narrow ? "none" : "1px solid rgba(255,255,255,0.12)",
          borderBottom: narrow ? "1px solid rgba(255,255,255,0.12)" : "none",
        }}>
          {/* SG6 mark with print-shop registration ticks — publisher's mark */}
          <div style={{
            position: "relative",
            width: 180, height: 196,
            marginBottom: "2.2rem",
          }}>
            {[[0, 0], [0, 1], [1, 0], [1, 1]].map((c, i) => (
              <div key={i} style={{
                position: "absolute",
                [c[0] ? "right" : "left"]: 0,
                [c[1] ? "bottom" : "top"]: 0,
                width: 14, height: 14,
                borderTop: c[1] ? "none" : "1px solid rgba(255,255,255,0.25)",
                borderBottom: c[1] ? "1px solid rgba(255,255,255,0.25)" : "none",
                borderLeft: c[0] ? "none" : "1px solid rgba(255,255,255,0.25)",
                borderRight: c[0] ? "1px solid rgba(255,255,255,0.25)" : "none",
              }} />
            ))}
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width={116} height={130} viewBox="0 0 80 90" aria-hidden="true">
                <line x1="40" y1="78" x2="40" y2="54" stroke="white" strokeWidth="5" strokeLinecap="round" />
                <line x1="40" y1="54" x2="40" y2="14" stroke="rgba(255,255,255,0.5)" strokeWidth="5"
                      strokeLinecap="round" strokeDasharray="7 8" />
                <path d="M 40 14 L 33 21 M 40 14 L 47 21"
                      stroke="rgba(255,255,255,0.5)" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M 40 54 L 70 34" stroke="#e85d6d" strokeWidth="5" strokeLinecap="round" />
                <path d="M 70 34 L 62 35 M 70 34 L 67 41"
                      stroke="#e85d6d" strokeWidth="5" strokeLinecap="round" fill="none" />
                <circle cx="40" cy="54" r="4" fill="white" />
              </svg>
            </div>
          </div>

          <div style={{
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em",
            color: "#e85d6d", marginBottom: "1.4rem",
          }}>
            CHEATSHEET
          </div>

          <p style={{
            margin: 0,
            fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif",
            fontSize: narrow ? "1.3rem" : "1.7rem", lineHeight: 1.35,
            color: "white",
            fontWeight: 300,
            letterSpacing: "-0.01em",
            maxWidth: 700, textWrap: "pretty",
          }}>
            <b style={{ color: "white", fontWeight: 600 }}>CHEATSHEET</b> catalogues <b style={{ color: "white", fontWeight: 600 }}>{LP_STATS.usg}</b> incidents
            of unattributed specification gaming — where the exploit looks like a property
            of the model rather than the setup — across {LP_STATS.papers} research papers
            published between {LP_STATS.years}. Every entry is classified against a public
            rubric, anchored to its source, and browsable by category, year, model family, or paper.
          </p>

          <div style={{
            marginTop: "2.6rem",
            display: "flex", gap: "2rem",
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            fontSize: "0.82rem",
          }}>
            <a href={CS_INCIDENTS_HREF}
               style={{
                 color: "white",
                 textDecoration: "none",
                 borderBottom: "1.5px solid #e85d6d",
                 paddingBottom: "0.2rem",
               }}>
              Browse the catalogue →
            </a>
            <a href="/methods"
               style={{
                 color: "rgba(255,255,255,0.6)", textDecoration: "none",
                 borderBottom: "1px solid rgba(255,255,255,0.2)",
                 paddingBottom: "0.2rem",
               }}>
              Methodology
            </a>
          </div>
        </div>

        {/* RIGHT — at-a-glance stats */}
        <aside style={{ padding: narrow ? "1.8rem 1.25rem 2.2rem" : "4.5rem 3rem 4rem" }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em",
            color: "rgba(255,255,255,0.5)", marginBottom: "1.4rem",
          }}>
            AT A GLANCE
          </div>
          {[
            { n: LP_STATS.usg + LP_STATS.asg, l: "Spec-gaming incidents" },
            { n: LP_STATS.usg, l: "unattributed", sub: true, dot: "#b8424f" },
            { n: LP_STATS.asg, l: "attributed", sub: true, dot: "#3b6ea5" },
            { n: LP_STATS.papers, l: "Source papers" },
            { n: LP_STATS.total - (LP_STATS.asg + LP_STATS.usg), l: "Out-of-scope entries", muted: true },
            { n: LP_STATS.years, l: "Years covered", isStr: true },
          ].map((s) => (
            <div key={s.l} style={{
              padding: s.sub ? "0.4rem 0" : "0.95rem 0",
              paddingLeft: s.sub ? "0.9rem" : 0,
              borderTop: s.sub ? "none" : "1px solid rgba(255,255,255,0.15)",
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
            }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                fontSize: s.sub ? "0.72rem" : "0.8rem",
                color: s.muted ? "rgba(255,255,255,0.42)" : (s.sub ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.75)"),
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
              }}>
                {s.dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block" }} />}
                {s.l}
              </span>
              <span style={{
                fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif",
                fontWeight: 400,
                fontSize: s.isStr ? "1.3rem" : (s.sub ? "1.05rem" : "1.8rem"),
                color: s.muted ? "rgba(255,255,255,0.48)" : (s.sub ? "rgba(255,255,255,0.82)" : "white"),
                fontVariantNumeric: "tabular-nums",
              }}>
                {s.n}
              </span>
            </div>
          ))}
        </aside>
      </div>

      {/* === Below: specimen carousel (now in the lower position) =========== */}
      <div style={{
        padding: narrow ? "2.2rem 1.25rem 2.2rem" : "3.5rem 3rem 3rem",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        position: "relative",
      }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.18em",
          color: "#e85d6d", marginBottom: "0.85rem",
        }}>
          SELECTED SPECIMENS · {pad2(specimen + 1)} / {pad2(specimenCount)}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "0.8rem", marginBottom: "1.6rem" }}>
          <LPBadge cat={hero.cat} />
          <span style={{
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            fontSize: "0.85rem", color: "rgba(255,255,255,0.55)",
          }}>
            {hero.year} · {hero.models}
          </span>
        </div>

        {/* Task — large but not the page hero anymore */}
        <h2 style={{
          margin: narrow ? "0 0 1.6rem" : "0 0 2.2rem",
          fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif",
          fontWeight: 400,
          fontSize: narrow ? "1.7rem" : "2.6rem",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "white",
          maxWidth: 1000,
          textWrap: "balance",
        }}>
          {hero.incident_id ? (
            <a href={`/e/${hero.incident_id}`} style={{ color: "inherit", textDecoration: "none" }}
               onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
               onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}>
              {titleCase(hero.task)}.
            </a>
          ) : (
            <>{titleCase(hero.task)}.</>
          )}
        </h2>

        {/* INTENDED → ACTUAL */}
        <div style={{
          display: "grid",
          gridTemplateColumns: narrow ? "1fr" : "1fr auto 1fr",
          gap: narrow ? "1.1rem" : "2rem",
          alignItems: "start",
          maxWidth: 1100,
        }}>
          <div>
            <div style={{
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.5)", marginBottom: "0.6rem",
            }}>
              INTENDED
            </div>
            <p style={{
              margin: 0,
              fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif",
              fontSize: "1.1rem", lineHeight: 1.5,
              color: "rgba(255,255,255,0.72)",
              textWrap: "pretty", fontWeight: 300,
            }}>
              {hero.intended}
            </p>
          </div>
          <div style={{
            fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif",
            fontStyle: "italic",
            fontSize: "1.3rem", color: "#e85d6d",
            paddingTop: "0.8rem",
            whiteSpace: "nowrap",
          }}>
            but —
          </div>
          <div>
            <div style={{
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em",
              color: "#e85d6d", marginBottom: "0.6rem",
            }}>
              ACTUAL
            </div>
            <p style={{
              margin: 0,
              fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif",
              fontSize: "1.1rem", lineHeight: 1.5,
              color: "white",
              fontWeight: 400,
              textWrap: "pretty",
            }}>
              {hero.actual}
            </p>
          </div>
        </div>

        {/* Source + spec counter */}
        <div style={{
          marginTop: narrow ? "1.6rem" : "2.4rem",
          paddingTop: "1.1rem",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          flexWrap: "wrap", gap: "0.8rem",
          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          fontSize: "0.74rem",
          color: "rgba(255,255,255,0.55)",
          maxWidth: 1100,
        }}>
          <span>cf. <a href={hero.source_link} target="_blank" rel="noopener noreferrer"
                       style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", borderBottom: "1px dotted rgba(255,255,255,0.4)" }}>
            {hero.source_title}
          </a> ↗</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.7rem" }}>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>a selection of {LP_STATS.asg + LP_STATS.usg}</span>
            <button onClick={prevSpecimen} aria-label="Previous specimen" style={{
              background: "none", border: 0, color: "rgba(255,255,255,0.7)",
              fontFamily: "inherit", fontSize: "1.1rem", cursor: "pointer", padding: 0, lineHeight: 1,
            }}>◂</button>
            <span style={{ color: "white", fontVariantNumeric: "tabular-nums" }}>
              {pad2(specimen + 1)} / {pad2(specimenCount)}
            </span>
            <button onClick={nextSpecimen} aria-label="Next specimen" style={{
              background: "none", border: 0, color: "#e85d6d",
              fontFamily: "inherit", fontSize: "1.1rem", cursor: "pointer", padding: 0, lineHeight: 1,
            }}>▸</button>
          </span>
        </div>
      </div>

      {/* === Quiet category color strip === */}
      <div style={{
        display: "grid",
        gridTemplateColumns: narrow ? "1fr 1fr" : "repeat(5, 1fr)",
      }}>
        {[
          { c: "USG",     fullCode: "Unattributed Specification Gaming", n: LP_STATS.usg,    color: "#b8424f" },
          { c: "ASG",     fullCode: "Attributed Specification Gaming",   n: LP_STATS.asg,    color: "#3b6ea5" },
          { c: "OOS-NSE", fullCode: "Negative side effects", n: LP_STATS.oosNse, color: "#9aa2b2", oos: true },
          { c: "OOS-BC",  fullCode: "Benign competence",     n: LP_STATS.oosBc,  color: "#7b8494", oos: true },
          { c: "OOS-BI",  fullCode: "Benign incompetence",   n: LP_STATS.oosBi,  color: "#5c6577", oos: true },
        ].map((row, i) => (
          <LPStripCard
            key={row.c}
            row={row}
            i={i}
            count={5}
            narrow={narrow}
            href={withMobileParam(CS_INCIDENTS_HREF)}
          />
        ))}
      </div>

      {/* === Editorial preface — about the catalogue ====================== */}
      <div style={{
        padding: narrow ? "0.5rem 1.25rem 3rem" : "1.5rem 3rem 5rem",
        borderTop: "1px solid rgba(255,255,255,0.12)",
      }}>
        {/* Block 1 — what it is */}
        <div style={prefaceBlock}>
          <div style={prefaceLabel}>WHAT IT IS</div>
          <div>
            <p style={prefaceP}>
              Specification gaming happens when an AI system does well measured narrowly
              by the letter of its objective while missing what the people who built it
              actually wanted. It may be that a model finds a shortcut, exploits a quirk
              in how it is scored, or satisfies the stated goal in a way nobody intended.
              Some of these cases are harmless. Others, however, may point to behaviour
              that is harder to explain away as a banal system quirk.
            </p>
            <p style={prefaceP}>
              The incidents are drawn from the research literature, each entry recording
              what the system was asked to do, what it actually did, the model involved,
              and a link back to the source paper. See more about how we did this{" "}
              <a href="/methods" style={prefaceLink}>here</a>.
            </p>
            <p style={{
              margin: "1.6rem 0",
              fontFamily: "Plain, ui-sans-serif, system-ui, sans-serif",
              fontSize: "1.45rem", lineHeight: 1.3, fontWeight: 400,
              color: "white", letterSpacing: "-0.01em", textWrap: "balance",
            }}>
              CheatSheet is a catalogue of these cases.<DunDunButton />
            </p>
            <p style={{ ...prefaceP, marginBottom: 0 }}>
              The{" "}
              <a href={withMobileParam(CS_INCIDENTS_HREF)} style={prefaceLink}>incidents page</a>{" "}
              holds the full catalogue, browsable as a tree or a dashboard and filterable
              by category, year, model family, and source paper. Every entry links to the
              paper that reported it. How the corpus was built and classified is described
              on the{" "}
              <a href="/methods" style={prefaceLink}>methods page</a>, and the{" "}
              <a href="/project-files/rubric" style={prefaceLink}>rubric</a>{" "}
              is published in full under project files, so any entry's classification can
              be checked against it.
            </p>
          </div>
        </div>

        {/* Block 2 — classification */}
        <div style={{ ...prefaceBlock, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={prefaceLabel}>CLASSIFICATION</div>
          <div>
            <p style={prefaceP}>
              Every incident is sorted against a published rubric classifying the
              incidents into two major categories: attributed specification gaming and
              unattributed specification gaming. When going through much of the research
              literature, incidents called specification gaming often didn't disambiguate
              themselves between behaviour that was likely produced due to the experimental
              set-up itself (and thus may not generalise as easily to behaviour in the wild)
              and those that were harder to explain.
            </p>
            <div style={{ display: "grid", gap: "1rem", marginTop: "1.6rem" }}>
              <div style={{ borderLeft: "3px solid #b8424f", paddingLeft: "1.1rem" }}>
                <p style={{ ...prefaceP, margin: 0 }}>
                  <b style={prefaceStrong}>Attributed Specification Gaming (ASG)</b> — when
                  something in the setup, such as the training data, the environment, or the
                  way the system was evaluated, made the exploit foreseeable, so the behaviour
                  can be traced to how the experiment was built.
                </p>
              </div>
              <div style={{ borderLeft: "3px solid #3b6ea5", paddingLeft: "1.1rem" }}>
                <p style={{ ...prefaceP, margin: 0 }}>
                  <b style={prefaceStrong}>Unattributed Specification Gaming (USG)</b> — when
                  nothing in the setup obviously pointed to the exploit, which leaves the
                  behaviour looking more like a property of the model than of the test.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Block 3 — scope & caveats */}
        <div style={{ ...prefaceBlock, borderTop: "1px solid rgba(255,255,255,0.1)", paddingBottom: 0 }}>
          <div style={prefaceLabel}>SCOPE &amp; CAVEATS</div>
          <div>
            <p style={prefaceP}>
              Some may notice that these categories may be over-inclusive in some
              circumstances, in that they include similar and overlapping distinctions
              found in the literature that we have flattened in our taxonomy. This includes
              reward hacking, reward gaming, reward misspecification, reward tampering, goal
              misgeneralization, etc. Similarly, we flattened the cause-based labels from{" "}
              <a href="https://vkrakovna.wordpress.com/2018/04/02/specification-gaming-examples-in-ai/"
                 target="_blank" rel="noopener noreferrer" style={prefaceLink}>Krakovna's list of
              specification gaming</a>, from which this work takes inspiration, as it split
              incidents by cause where ours splits them only by attributability.
            </p>
            <p style={{ ...prefaceP, marginBottom: 0 }}>
              We have also kept cases that we did not count as specification gaming proper.
              We grouped these under a set of out-of-scope categories: negative side effects,
              benign competence, benign incompetence, and a catch-all for incidents the rubric
              could not be applied to yet that pops up in searches for specification gaming.
              We've included these in an effort of transparency on where lines were drawn, and
              due to the fact that much of the classifying was produced through an AI-guided
              process, using different models of Claude 4.x (mainly Opus and Sonnet). We have
              tried to verify the data through a number of sweeps, but there may still be
              mistakes, misattributions, and likely plenty of places where one might disagree.
              {" "}<a href="mailto:jake@arbresearch.com" style={{ color: "inherit" }}>We welcome your feedback.</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

window.LandingHybrid = LandingHybrid;
