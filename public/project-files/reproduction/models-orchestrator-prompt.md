# Models step — orchestrator

Attribute model families to each incident in the incident list. For each incident, run three extractors and one verifier through the `Agent` tool, then record the verifier's result. Use the `Agent` tool for all sub-agents. Do not use any API or SDK. Do not let a sub-agent spawn another sub-agent.

## Files

- Incident list: `<INCIDENTS_CSV>`. One row is one incident. Key each incident by `<incident_id>`. Read-only input for this run; do not write to it.
- Paper text: `<PAPERS_DIR>/<paper_id>.md`.
- Extractor prompt: `models-extractor-prompt.md`. Placeholders `{paper_id}`, `{paper_title}`, `{incident_name}`, `{notes}`.
- Verifier prompt: `models-verifier-prompt.md`. Placeholders: the same four, plus `{extractor_1_output}`, `{extractor_2_output}`, `{extractor_3_output}`.
- Output folder: `<MODELS_OUT_DIR>/`.

## For each incident that has no packet

1. Fill the extractor prompt with the row's four fields. Spawn three extractors in one message with that filled prompt. Collect three JSON outputs.
2. Fill the verifier prompt with the row's four fields and the three extractor outputs. Spawn one verifier. Collect its JSON output.
3. Take the verifier's `confirmed_models` as the model list for the incident.
4. Write the packet `<MODELS_OUT_DIR>/packets/<incident_id>.json`: the row fields, the three extractor outputs, the verifier output, and `confirmed_models`.
5. Route the result. Do NOT write the CSV; a later merge step lands these results in it.
   - If the verifier set `open_queue_flag` true: append the incident, keyed by `<incident_id>`, to `<MODELS_OUT_DIR>/models_open_queue.json` with the open-queue reason.
   - Otherwise: record the incident, keyed by `<incident_id>`, in `<MODELS_OUT_DIR>/models_resolved.json` with `confirmed_models` as one comma-joined string of canonical family names (e.g. `GPT-4, Llama-3`; `custom RL agent` or `training algorithm` for non-LM cases; empty string when `confirmed_models` is empty).
6. Save `models_resolved.json` after each incident. Print one line: `paper_id`, `incident_name`, the models string or `OPEN-QUEUE`.

## Rules

- Run the three extractors blind: identical filled prompt, no shared state, no knowledge of each other.
- The verifier sets the final list. Pass it the three extractor outputs. Do not merge or majority-vote the extractor lists yourself.
- Run every sub-agent on the same strong model; do not substitute a smaller one.
- Checkpoint after each incident. On restart, resume at the first incident with no packet.
- Give every incident a packet and a route. A `confirmed_models` of `[]` is recorded as an empty models string in `models_resolved.json`, not skipped. Drop nothing.
- Do this step only. Do not re-extract incidents, classify, or write behaviour fields.

## Outputs

All under `<MODELS_OUT_DIR>/`:

- `models_resolved.json` — each resolved incident keyed by `<incident_id>` with its comma-joined `models` string. Merged into `<INCIDENTS_CSV>` in a later step, not during this run.
- `packets/<incident_id>.json` — per incident, the full extractor/verifier trail.
- `models_open_queue.json` — incidents needing human adjudication.

`<INCIDENTS_CSV>` is read-only input for this run.
