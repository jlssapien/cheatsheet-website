# Reproduction Bundle — specification-gaming incident pipeline

This is the reproduction bundle for [CheatSheet](https://cheats.arbresearch.com), a catalogue of specification-gaming incidents in AI systems. The same files are browsable individually on the site's [reproduction page](https://cheats.arbresearch.com/project-files/reproduction). Everything here is released under CC0. If you run the pipeline on new papers and want to propose a new incident or find issues with an existing one, send it to [jake@arbresearch.com](mailto:jake@arbresearch.com).

This folder collects the prompts used to build the incident dataset, genericized so they can be reused on a different paper corpus. It documents the method; it does not carry any data, papers, or run-specific scripts.

The pipeline takes a corpus of papers and produces, for each incident found, a category (ASG or USG), the model families that exhibited it, four description fields, and a title.

## Pipeline order

1. **Extraction** — enumerate the discrete incidents in each paper. Three blind extractors, one adversarial critic, one verifier per paper. Unanimous papers' incidents are written out; contested papers go to a human adjudication pass. Files: `extraction-prompt.md`, `extraction-critic-prompt.md`, `extraction-verifier-prompt.md`, `extraction-orchestrator-prompt.md`.
2. **Classify** — label each incident ASG, USG, or OOS against the rubric. Three blind screeners; if they agree confidently the row settles, otherwise a critic and an independent verifier decide, with genuinely contested rows going to a human queue. Only ASG and USG rows are carried forward; OOS rows stop here. Files: `classify-screener-prompt.md`, `classify-critic-prompt.md`, `classify-verifier-prompt.md`, `classify-orchestrator-prompt.md`.
3. **Models** — attribute the model family/families that exhibited each surviving incident. Three blind extractors, one verifier. Files: `models-extractor-prompt.md`, `models-verifier-prompt.md`, `models-orchestrator-prompt.md`.
4. **Behaviours** — write the four description fields (`Description`, `Intended goal`, `Misspecified goal / gamed metric`, `Behavior`) for each surviving incident. One writer, one adversarial critic, one verifier. Files: `behaviour-writer-prompt.md`, `behaviour-critic-prompt.md`, `behaviour-verifier-prompt.md`, `behaviour-orchestrator-prompt.md`.
5. **Naming** — assign each incident a title from its own fields. Not an agent pipeline; drafted, human-reviewed, and applied by script. File: `naming-rules.md`.

Models and behaviours are independent of each other and can run in parallel; each writes its own output and a later merge folds both into the incident list.

## Common design

Every agent step uses the same shape: independent blind workers, an adversarial critic that issues no verdict, and a verifier that makes the final call. Nothing is merged or resolved by majority vote in code; agreement is judged, not computed. Each step checkpoints per incident and can resume. Anything the automated pass cannot settle is routed to a human queue rather than dropped or guessed.

All sub-agents in a step run on the same strong model. (In the original run the models step used a mid-tier model and the behaviours step a top-tier one; the prompts here say only "a strong model" and leave the choice to you.)

## Placeholder tokens

Fill these in for your own setup before running:

- `<PAPERS_DIR>` — folder of paper markdown files, one per `paper_id`, named `<paper_id>.md`.
- `<INCIDENTS_CSV>` — the incident list the pipeline reads and writes. Extraction creates it; classify adds a `CATEGORY` column; models and behaviours read it and write their own sidecar outputs; a merge folds those back in.
- `<PACKETS_DIR>` — per-step folder holding the per-incident audit trail (`<paper_id>.json` or `<incident_id>.json`).
- `<MODELS_OUT_DIR>`, `<BEHAVIOURS_OUT_DIR>` — per-step output folders for the models and behaviours sidecar results and their packets.
- `<paper_id>` — identifier of a source paper.
- `<incident_id>` — stable per-incident key, assigned once and used by every step and the merge. Assign it before the classify step.

The two classify prompts embed a classification rubric. Both contain the marker `<INSERT SG RUBRIC v2-amended HERE>`; paste the rubric text in at that point. The rubric defines the ASG / USG / OOS categories and the five criteria the classifier applies. Its full text is included in this bundle as `SG-Rubric-v2-amended.md`; paste it in unchanged.

## Scope

This bundle reproduces the pipeline through the ASG/USG distinction. Incidents classified OOS are dropped at the classify step and carried no further, so no OOS sub-categorization is included. Auxiliary one-off passes from the original run (full-text retrieval for abstract-only papers, cleaning of location notes) are also excluded; they are corpus housekeeping, not part of the method.
