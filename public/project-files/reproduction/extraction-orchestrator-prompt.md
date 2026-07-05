# Extraction Orchestrator Prompt

You orchestrate the incident-extraction run over the paper corpus. For each paper you run three blind extractors, then an adversarial critic, then a verifier, and you record everything. Papers where the extractors agree and the verifier confirms are unanimous and their incidents go to the incident CSV. Papers with any disagreement are held with their full trail for a later human pass.

You drive every sub-agent yourself via the `Agent` tool. Do not use the Anthropic SDK or any direct API call, and do not let a sub-agent spawn further sub-agents.

## Inputs

- **Keep-list**: a JSON file whose `papers` array holds the papers to process. Each entry gives at least `paper_id`, `title`, and a URL. These are the only papers to process. If the papers folder holds extra files (e.g. screening rejects not on the keep-list), ignore them.
- **Paper text**: `<PAPERS_DIR>/<paper_id>.md`.
- **Extraction prompt**: `extraction-prompt.md`. The verbatim instruction each extractor receives. Fill its `<paper_id>` placeholder with the current paper; change nothing else.
- **Critic prompt**: `extraction-critic-prompt.md`. The instruction the critic receives. Fill its `<paper_id>` and the three extractor-list placeholders.
- **Verifier prompt**: `extraction-verifier-prompt.md`. The instruction the verifier receives. Fill its `<paper_id>`, the three extractor-list placeholders, and the critic-reasoning placeholder.

## Roles

- **Extractor (×3, blind, identical).** Each receives the extraction prompt and returns its own list: a count, and per incident a name, a location, and any note. The three are independent, share no state, and see no prior-run output. An extractor writes no rationale; its list is its output.
- **Critic (adversarial by design).** Reads the paper and all three extractor lists. Its job is to argue against them, not to summarize: where the three disagree on the count or on which incidents, where a split is wrong under the incident-counting rules, where an incident was missed, where one is spurious. It writes its reasoning.
- **Verifier.** Reads the paper, the three lists, and the critic's reasoning. It decides, under the extraction prompt's incident-counting rules (the verb-and-object reader test and the splitting rules), whether the three extractors agree on both the number of incidents and which incidents they are by behaviour (wording need not be identical). It weighs the critic's challenges rather than taking the extractors at face value, casts its vote, and writes its reasoning.

Sameness of incidents is a judgment under the counting rules, not string matching; that judgment is the critic's and the verifier's, never a mechanical dedup by the orchestrator.

## Unanimity (per paper)

A paper is **unanimous** when all three extractors agree on the number of incidents and on which incidents they are by behaviour under the splitting rules, **and** the verifier confirms that agreement is correct. Anything else, a different count, a different set of behaviours, or the verifier finding the agreed list wrong, is **non-unanimous**.

## Per-paper procedure

For each keep-list paper, in order, that has no packet yet:

1. Spawn the three extractors in one message, each given `extraction-prompt.md` with `<paper_id>` filled. Collect the three lists.
2. Spawn the critic given `extraction-critic-prompt.md`, filled with `<paper_id>` and the three extractor lists. Collect its reasoning.
3. Spawn the verifier given `extraction-verifier-prompt.md`, filled with `<paper_id>`, the three extractor lists, and the critic's reasoning. Collect its vote and reasoning.
4. Write the packet `<PACKETS_DIR>/<paper_id>.json` holding: `paper_id`, `paper_url`, `paper_title` (from the keep-list entry); the three extractor lists with counts; the critic reasoning; the verifier vote and reasoning; and the resulting `unanimous` flag.
5. Route:
   - **Unanimous** → append the agreed incidents to `<INCIDENTS_CSV>` (`paper_id, paper_url, paper_title, incident_name, notes`; `notes` begins with the location), and record the paper in `unanimous.json`.
   - **Non-unanimous** → record the paper in `splits.json` (the adjudication queue, pointing to its packet). Write nothing to the CSV; the human pass decides its incidents later.
6. Save after every paper. Print one summary line (paper_id, the three counts, unanimous flag).

## Outputs

- `<PACKETS_DIR>/<paper_id>.json` — one per paper, the full trail.
- `unanimous.json` — papers whose incidents went straight to the CSV.
- `splits.json` — non-unanimous papers, the queue for the human-plus-agent pass.
- `<INCIDENTS_CSV>` — the populated rows so far (unanimous now; the human pass appends the rest). Columns: `paper_id, paper_url, paper_title, incident_name, notes`.

## Constraints

- Three blind, identical extractors. Nothing is merged, deduped, or resolved by majority vote. Each list stands on its own; agreement is judged, not computed.
- The critic is adversarial and issues no final list. The verifier issues the vote; it is the only step that judges agreement and correctness.
- Run all sub-agents on the same strong model; do not substitute a smaller one.
- Atomic checkpoints. Save after every paper. A fresh session resumes at the first keep-list paper with no packet. Multi-session execution is expected.
- No silent drops. Every paper ends with a packet and is routed to either the CSV (unanimous) or the splits queue (non-unanimous), including a paper all three agree has zero incidents.
- Do not classify. This run only enumerates incidents and their locations; it assigns no category and no behaviour fields. Those are later steps.

## End state

All keep-list papers have packets. Unanimous papers' incidents are in `<INCIDENTS_CSV>`; non-unanimous papers are queued in `splits.json` with their full extractor/critic/verifier trail, ready for the human-plus-agent pass that walks them one by one and populates the rest of the CSV.
