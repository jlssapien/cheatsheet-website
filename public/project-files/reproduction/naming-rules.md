# Incident naming — rules and workflow

The naming step runs last, after each incident has its attributed `models` and its behaviour fields. It assigns each incident a short descriptive title. Unlike the other steps it is not an agent pipeline: titles are drafted directly from the row's own fields, reviewed by a human, and applied by script. Titles are derived from fields only; the papers are not consulted at this stage.

## Naming rules

Every incident name is a full sentence in subject-plus-verb form, sentence case.

The **subject is governed by the `models` field** (the attribution list), never by prose highlights. The `Behavior` and `Description` fields supply the verb and object only.

- Exactly one model attributed → that model is the subject ("GPT-4o echoes ...").
- Two attributed → name both when readable ("GPT-4 and Llama-3 hoard points ...").
- Three or more, or a family/sweep → an explicitly plural, scope-honest subject ("Multiple LLMs evade ...", "PPO agents block ..."). The class noun must cover exactly the attributed set and must not generalize beyond it.
- Empty or unparseable attribution → a generic fallback by the row's system-type field: "Model" for a language model, "Agent" for a non-language-model system.

The **verb and object** are derived from the row's own fields (`Intended goal`, `Behavior`, `Description`). Rows whose fields are too thin to support a confident name are flagged for the human reviewer, not guessed.

**Sentence case** throughout: first word capitalized, the rest lowercase except proper nouns and model names (CoinRun, GPT-4o). No trailing period; names display as titles.

**Replace artifact titles.** Any name that is a table/figure/appendix reference ("Table 2 finding on ...") is rewritten as a behaviour description. Sweep all names for artifact-style titles, not only the obvious ones.

**Length:** target about 10 words, with some room; concision is the goal. A lint check flags names over 12 words rather than auto-rejecting them.

## Why the subject is the attribution list

The title is a factual claim. Naming one model when several were attributed misattributes the finding; naming a broad class when only a few models were attributed overstates scope. That is why the subject is governed by the `models` field and the class noun must cover exactly the attributed set.

## Workflow (propose → review → apply)

1. **Dump (script).** Extract every row into a review file: the stable row id, the current name, the `models` field, the system-type field, and empty `proposed_name` / `flag` / `note` columns. The `Intended goal`, `Behavior`, and `Description` fields go to a side context file used only for drafting, not into the review deliverable.
2. **Propose (the only judgment step).** Draft a proposed name per row, in batches, per the rules above. Use the `flag` column for thin rows and for forced class nouns. Then a lint script mechanically checks each proposal: a single-attributed row's name starts with that model; a two-model row names both; a three-plus row does not lead with any single model name; the first letter is capitalized; no leading table/figure/appendix reference; over-12-word names flagged; no trailing period.
3. **Review (human).** The reviewer works from the review file with current name, proposed name, `models`, `flag`, and notes. Every row carries a proposed name — flagged rows get a best attempt plus the flag, never an empty cell. The reviewer edits proposed names directly. Nothing applies until the reviewer signs off.
4. **Apply + verify (scripts).** Take a dated backup first, then write the approved names into the dataset matched by the stable row id. A blank `proposed_name` is not a valid state; if one appears in the reviewed file the apply script aborts and reports the rows, writing nothing. A separate verification script confirms that the dataset names match the reviewed file exactly, that no unapproved row changed, and that no other column was touched.

Matching by a stable per-row id (assigned before this step) makes application safe under any rename.

## Note

An earlier version considered a gerund/label fragment style ("Deleting failing tests") and was rejected in favour of full subject-plus-verb sentences, on the grounds that fragments read as unnatural and one consistent form is preferable.
