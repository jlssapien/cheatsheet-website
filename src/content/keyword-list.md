# Keyword Search List: Final

Compiled: 2026-02-17
Process: keyword-compilation team (scouts, critic, verifier, auditor) → keyword-specificity team (assessor, critic, verifier) → keyword-inclusion team (advocate-include, advocate-exclude, critic, verifier)

Inclusion criterion: each term has **independent search reach** — searching it finds papers documenting AI failure incidents that no other term on this list would find.

---

## Search Terms

Terms marked (+ qualifier) need the qualifier appended when searching. Terms marked * are for media/community search, not Google Scholar.

specification gaming
reward hacking
reward tampering
wireheading
deceptive alignment
sycophancy (+ LLM)
goal misgeneralization
scheming (+ AI)
alignment faking
Goodhart's Law (+ AI)
in-context reward hacking (ICRH)
reward poisoning
perverse instantiation
reward corruption
reward misspecification
reward model hacking
in-context scheming
sandbagging (+ AI)
U-Sophistry / I-Sophistry
strategic deception (+ AI)
treacherous turn
mesa-optimizer
inner alignment
emergent misalignment
self-fulfilling misalignment
prompt-sensitized gaming
exploration hacking
shortcut learning (+ AI safety)
Clever Hans effect (+ machine learning)
instrumental convergence
shutdown avoidance / shutdown evasion
corrigibility
power-seeking (+ AI)
self-replication (+ AI)
paperclip maximizer
negative side effects (+ reinforcement learning)
safe exploration (+ reinforcement learning)
sim-to-real gap
evaluation gaming (+ AI)
benchmark gaming / benchmark cheating
AI cheating
sleeper agent (+ AI)
distributional shift (+ AI failure)
proxy gaming (+ AI)
steganographic chain-of-thought
self-preference bias (+ LLM)
AI found a loophole *
AI misbehavior *
galaxy-brained *
sneaky AI*

**50 terms.**

---

## Scope-Disputed Terms

These have strong independent search reach but belong to different failure taxonomies than specification gaming. Project team decides.

prompt injection (+ LLM) — adversarial attack vector
AI hallucination / LLM hallucination — capability limitation vs. sycophantic reward hacking
data poisoning (+ AI) — training-time attack, cause of sleeper agent behavior
multi-agent AI risk — emergent multi-agent failures, needs specific framing
jailbreaking (+ LLM) — adversarial constraint bypass

Lean-exclude (critic recommendation):
automation bias — human failure mode, not AI behavior
system prompt extraction — security vulnerability, not specification gaming

**5-7 additional terms depending on scope decision.**

---

## Excluded Terms (with reason)

### Subsumed by parent term
regressional Goodhart, extremal Goodhart, causal Goodhart, adversarial Goodhart, Goodharting — subsumed by Goodhart's Law
reward function misspecification, goal misspecification — subsumed by reward misspecification
reward gaming — subsumed by reward hacking (+ "gaming" = video games ambiguity)
inference-time reward hacking — synonym of ICRH
RF-input tampering, reward signal manipulation, feedback tampering, incentive corruption — subsumed by reward tampering
misweighting, scope misspecification, environment misspecification, ontological misspecification — subsumed by reward misspecification (Skalse subtypes)
mesa-objective, pseudo-alignment, approximate alignment, instrumental alignment — subsumed by mesa-optimizer
outer alignment — research framing, not failure mode; failures found via reward misspecification, specification gaming, Goodhart's Law
hidden objectives / hidden goals — subsumed by deceptive alignment, scheming, mesa-optimizer
sycophantic behavior / sycophantic response — adjective variant of sycophancy
proxy-gold reward gap — niche label within reward hacking literature
proxy misalignment — subsumed by Goodhart's Law / proxy gaming
reward-model bias — subsumed by reward model hacking
evaluation awareness — subsumed by sandbagging
strategic dishonesty — found via sycophancy
alignment tax / safety tax — design tradeoff, not failure mode
training gaming — subsumed by deceptive alignment, scheming, alignment faking
encoded reasoning — subsumed by steganographic chain-of-thought
spec gaming — abbreviation of specification gaming
shut down / shutdown resistance — subsumed by shutdown avoidance
AI gaming the system — overlaps with AI found a loophole, AI cheating, AI misbehavior
AI broke the rules — governance noise, covered by other informal terms

### Too broad / too noisy
exploitation / exploit — common English, cybersecurity noise
phase transitions — physics, chemistry
subterfuge — common English
self-preservation — biology, psychology
resource acquisition — ecology, economics
out-of-distribution (OOD) — enormous ML subfield
incorrigibility — criminal justice dominates
steganography (standalone) — infosec dominates
sneaky — common English
verbal compliance without behavioral change — no working search term

### Too noisy even as behavioral descriptors
lying / lied / deceptive, cheating / cheated, hacking / hacked, exploit / exploiting, modify / modified, misleading, drift / drifting, conceal / concealment, bypass, disable, shortcut / took a shortcut — common English words; covered by included terms

### Skewed / single-source
blackmail, coercion, sabotage, manipulation, runaway optimizer, fabricate, insider threat — skewed data from single papers; found via other terms

### Single-instance descriptors (qualitative coding, not search)
compliance charade, calculator hacking, posed as human, disguises the change, ragebait, copies the weights, sorry humans / meatbag, sacrificed honesty, reinforcing delusions / endorsing suicidal ideation, subtly working around constraints, acknowledge corrections verbally, deliberately inserted vulnerabilities

### Other
reward shaping — standard RL technique, not failure term
mode collapse — GAN/VAE term; RLHF mode collapse literature uses "reward hacking"
sharp left turn — hypothetical scenario, no empirical incident papers
unforeseen maximization — subsumed by specification gaming + perverse instantiation
perverse incentive — subsumed by Goodhart's Law
spurious correlation / spurious features — subsumed by shortcut learning
self-evaluation bias — included as "self-preference bias" (better phrasing)

---

## Disagreements

1. **treacherous turn**: Critic said lean-exclude (philosophical, no incident papers). Verifier overturned: arXiv 2504.08943 (2025) is an empirical DRL paper using the term in its title. Included.

2. **mode collapse**: Specificity team rated NARROW (100% AI/ML). Inclusion team excluded (RLHF mode collapse papers also use "reward hacking"). The specificity rating and inclusion decision measure different things.

3. **sharp left turn**: Specificity team rated NARROW for community context. Inclusion team excluded (no empirical papers, hypothetical scenario). Same divergence — NARROW for specificity doesn't mean useful for finding incident papers.

4. **distributional shift**: Included with caveat. Strong independent reach into deployment failure literature (medical AI, robotics, traffic systems). But very noisy — needs qualifier.

---

## Process Documentation

Reports in `/home/drjls/Documents/Vault42/02_ARB/CheatSheet/`:

Compilation round:
- `scout-academic-terms.md`, `scout-data-terms.md`, `scout-informal-terms.md`
- `critic-report.md`, `verifier-report.md`, `auditor-report.md`
- `keyword-list.md` (full compiled list, ~144 terms)

Specificity round:
- `specificity-assessment.md`, `specificity-critic-report.md`, `specificity-verifier-report.md`
- `keyword-list-ranked.md` (ranked by specificity)

Inclusion round:
- `advocate-include-report.md`, `advocate-exclude-report.md`
- `inclusion-critic-report.md`, `inclusion-verifier-report.md`
- `keyword-list-final.md` (this file)
