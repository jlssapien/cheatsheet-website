# Incident Extraction Prompt

You will read a research paper about an artificial system (a learned policy, an evolved program, a language model, a robot controller, a preference model, an automated monitor, a multi-agent setup, or any analogous artifact) and produce a list of distinct **incidents** documented in it. Your only job is to enumerate. Do not classify, score, rank, filter for importance, judge severity, or interpret motive.

The paper is a markdown file at `<PAPERS_DIR>/<paper_id>.md`, opening with a metadata header (title, authors, arxiv_id, url).

Read the paper end to end before writing — including appendices, figure captions, transcripts, footnotes, and tables. Strong cases may be outside the main results section.

---

## What counts as an incident

An incident is a concrete behavior that a system in the paper's own work *did* on identifiable inputs or in an identifiable setting, which the paper singles out as a discrete observation (a result, finding, example, anecdote, case study, transcript, named entry in a typology, captioned figure, or labeled subsection).

**Operational test.** Could you write a one-sentence description in the form *"On task/setting T, the system did X"*? If yes, it is a candidate. If the description has to be *"Across the corpus the model has property P"* or *"Models in general tend to do Q,"* it is a paper-level finding, not an incident, and should not be listed.

Exclude:

- Routine successful task completion the paper does not single out.
- Background descriptions of how the system was built, trained, or configured; methodology, prompt templates, benchmark construction, dataset curation, hyperparameters, scaffolds.
- Aggregate statistics or rates that are not tied to a specific behavior. If a statistic summarizes a behavior the paper has already named, the *behavior* is the incident; do not produce one row per percentage point or per model.
- Theoretical claims, related work, threat-model definitions, motivating examples drawn from prior literature, hypotheses the paper does not test on a real system.
- Behaviors mentioned only as something other researchers reported, unless the paper under review reproduces or directly examines them.
- Speculative future risks raised in discussion.
- Properties of training data or human-rater preferences as such. (But a learned scorer or preference model is itself a system: if the paper documents what it *did*, that qualifies.)
- Successful interventions whose only point is to suppress an underlying behavior. The intervention reducing the rate is not itself an incident — list the underlying behavior once.

When you cannot describe what the system *did* in a single short clause, leave it out. When in doubt about inclusion, prefer to include and use `notes` to flag uncertainty.

---

## How to split: the unit is the behavior, not the model and not the condition

Apply the **verb-and-object reader test**: would two careful readers describe the two cases with the same short verb-and-object phrase? If yes, they collapse to one incident. If no, they are separate.

- **Same behavior across multiple systems, model sizes, training runs, or evolved populations on the same task = ONE incident.** Multi-system observation can be flagged in `notes` if salient; do not produce one row per system.
- **Same behavior across multiple experimental conditions, prompts, scratchpad on/off, pressure levels, system instructions, or ablation cells = ONE incident.** Conditions are methodological variation on one behavior, not separate behaviors.
- **Same system exhibiting two qualitatively different behaviors = TWO incidents** (e.g., the same agent both modifying a test file *and* overloading comparison operators).
- **A causal chain of separately observed and separately analyzed steps = multiple incidents.** If the paper distinguishes an action, a description of the action, and a response when challenged about the action, treat each as its own incident. If the paper treats the chain as one indivisible event, list it once and note the components.
- **Persistence through an intervention = ONE incident, with a note.** A behavior that survives a training procedure is a property of the same behavior; record persistence in `notes`. **Exception:** if the intervention itself causes the system to acquire a *new and qualitatively different* behavior (e.g., better recognition of when to suppress the original behavior, or new outputs the system did not previously produce), that new behavior is its own incident.
- **Anecdote-collection structure.** If the paper is structured as a curated catalog of cases — each case has its own description, heading, labeled paragraph, typology slot, or comparable structural marker — extract one incident per case. The structural marker is what licenses inclusion. Do not treat passing prose references as cases when the paper is not of this form.
- **Engineered or deliberately induced behaviors count.** When the paper documents the *observed* behavior of a deliberately constructed or trained-in system (e.g., a backdoored model that, on receiving its trigger, produces a particular kind of output), the observed behavior is an incident. Note the engineered nature in `notes`. Do not extract every input variation, prompt the researchers tried, or ablation cell as its own incident — those are conditions on a single underlying behavior unless the behavior itself qualitatively changes.

When unsure whether two descriptions refer to one behavior or two, prefer to **split** and flag the alternative reading in `notes`. A downstream review can merge over-split rows; missed distinctions are harder to recover.

---

## Naming convention

Each `incident_name` must be:

- Approximately **5 words** (range 3–7).
- **Verb-and-object form** describing what the system did. Start with a verb when possible.
- Drawn from **the paper's own descriptive vocabulary** for the behavior and the objects involved wherever possible. Quote distinctive nouns and verbs.
- **Specific** enough that two distinct incidents in the same paper get clearly different names. Avoid generic placeholders like *"model misbehaves"* or *"system surprises researchers"*.

Do not include the model name, paper title, author name, or run number in the name.

### Loaded vocabulary banned in names — no exceptions

Do not use any of the following words, or close synonyms, in `incident_name`, even when the paper itself uses them as central technical terms. If the paper's only available phrasing relies on these, paraphrase the behavior into neutral, externally observable verb-and-object form.

Banned interpretive vocabulary: *gaming, hacking, cheating, exploit (as a noun), exploited, reward, reward hacking, misalignment, misaligned, deception, deceptive, sneaky, dishonest, scheming, manipulation, manipulating, subverting, sandbagging, sycophancy, sycophantic*.

Banned mental-state / intent-importing verbs: *hides, conceals, lies, pretends, fakes, tricks, fools*.

Permitted with care: the verb *"exploits"* in the form *verb against a specific target* (e.g., *"exploits collision-detection bug to fly"*) is acceptable; the noun *"exploit"* as a label for a behavior is not.

### Redirection examples

Names below use **invented systems unrelated to the corpus** to illustrate shape only.

- A recommender system that surfaces items the buyer already owns: *"recommender promotes only purchased items"*.
- A chess engine that offers a draw in a winning position: *"chess engine offers draw at win"*.
- A translation model leaving an untranslated token in output: *"translator inserts source-language word verbatim"*.
- An automated pricer underbidding to its own loss: *"pricing agent matches competitor below cost"*.
- A model parsing the input filename instead of the image: *"image classifier returns label from filename"*.

Names to avoid (loaded or vague): *"reward hacking by deleting tests"*, *"model is deceptive"*, *"surprising behavior"*, *"sycophantic feedback"*. Replace with what the system externally did, e.g., *"deletes failing unit test files"*, *"agrees with stated user belief"*.

If a paper describes a model "deceiving its manager about a trade," name the incident in terms of what the model did externally — e.g., *"reports trade as based on public information"* — not *"hid insider tip from manager"* or *"deceived manager"*.

If two incidents in the same paper would naturally have very similar names, differentiate them with a brief disambiguating clause.

---

## The notes field

Use `notes` to record where the incident is in the paper and to flag adjudication signals to the downstream reviewer, not to summarize the incident. Always include the location (e.g., "Section 3.2, Figure 4"); add adjudication flags after it when relevant. Notes should be terse — a clause or short sentence.

Use `notes` when:

- You were uncertain whether to split or merge and want to record the alternative reading.
- The behavior was observed across a sweep of models, conditions, or interventions and that fact is salient (e.g., observed in all five tested assistants; persisted through training intervention X; varies with prompt strictness).
- A detail needed to characterize the behavior is missing or thin (e.g., paper alludes to it without a transcript or example).
- The paper is unclear or self-contradictory about what the system actually did.
- Multiple sub-variants were folded into a single incident.
- The behavior was deliberately constructed, trained, prompted, or instructed rather than emergent.
- The paper replicates a prior result and you want that not double-counted.
- The behavior overlaps with another row and you want to note the boundary.

---

## Output

Reply with the total number of incidents, then a numbered list of incidents in order of first appearance in the paper. For each incident give its name, then in parentheses its location in the paper followed by any adjudication note. No preamble, no commentary outside the list.

If, after a thorough read, you identify no behaviors that meet the criteria, reply with `0 incidents` and nothing else. Do not invent incidents to avoid an empty result.

---

## Procedure

1. Read the paper end to end, including appendices, figure captions, tables, and footnotes.
2. List candidate behaviors. For each, apply the operational test: *Can I describe it as "On task/setting T, the system did X"?* If not, drop it.
3. Apply the splitting rules. Merge same-behavior across systems and across conditions. Split same-system different-behaviors and separately-analyzed steps in a chain. Treat persistence as one-incident-with-a-note, with the qualitatively-new-behavior exception. If the paper is an anecdote catalog, treat each curated case as its own incident.
4. Name each incident in ~5-word verb-and-object form using the paper's own descriptive language and avoiding every banned term in the name. Paraphrase if the paper's central terminology is on the banned list.
5. Append a brief adjudication note only where non-trivial.
6. Reply with the count and the numbered list.
