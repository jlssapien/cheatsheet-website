# Behaviours step — orchestrator

Write the four description fields for each incident. For each incident, run one writer, then a critic, then a verifier through the `Agent` tool, and record the verifier's fields. Use the `Agent` tool for all sub-agents. No API or SDK. No nested sub-agents.

## Files

- Incident list: `<INCIDENTS_CSV>`. One row is one incident, identified by its `<incident_id>`. Read-only input for this run; do not write to it.
- Paper text: `<PAPERS_DIR>/<paper_id>.md`.
- Writer prompt: `behaviour-writer-prompt.md`. Placeholders `{paper_id}`, `{paper_title}`, `{incident_name}`, `{notes}`.
- Critic prompt: `behaviour-critic-prompt.md`. The same four, plus `{writer_output}`.
- Verifier prompt: `behaviour-verifier-prompt.md`. The same four, plus `{writer_output}` and `{critic_output}`.
- Output folder: `<BEHAVIOURS_OUT_DIR>/`.

## For each incident that has no packet

1. Fill the writer prompt with the row's four fields. Spawn one writer. Collect its JSON output.
2. Fill the critic prompt with the row's four fields and the writer output. Spawn one critic. Collect its reasoning.
3. Fill the verifier prompt with the row's four fields, the writer output, and the critic output. Spawn one verifier. Collect its JSON output.
4. Write the packet `<BEHAVIOURS_OUT_DIR>/packets/<incident_id>.json`: the row fields, the writer output, the critic output, and the verifier output.
5. Route the result. Do NOT write the CSV; a later merge step lands these results in it.
   - If the verifier set `open_queue_flag` true: append the incident, keyed by `<incident_id>`, to `<BEHAVIOURS_OUT_DIR>/behaviours_open_queue.json` with the reason.
   - Otherwise: record the incident, keyed by `<incident_id>`, in `<BEHAVIOURS_OUT_DIR>/behaviours_resolved.json` with the verifier's four fields (`Description`, `Intended goal`, `Misspecified goal / gamed metric`, `Behavior`).
6. Save `behaviours_resolved.json` after each incident. Print one line: `paper_id`, `incident_name`, `resolved` or `OPEN-QUEUE`.

## Rules

- The critic issues no fields. The verifier sets the final fields; pass it the writer output and the critic output.
- Run every sub-agent on the same strong model; do not substitute a smaller one.
- PAUSE after the first 10 incidents: stop dispatching, report the 10 results, and wait for the reviewer to inspect them and say to continue. Do not process incident 11 onward without that go-ahead.
- Checkpoint after each incident. On restart, resume at the first incident with no packet.
- Give every incident a packet and a route. Drop nothing.
- Do this step only. Do not re-extract incidents, classify, or attribute models.

## Outputs

All under `<BEHAVIOURS_OUT_DIR>/`:

- `behaviours_resolved.json` — each resolved incident keyed by `<incident_id>` with its four fields. Merged into `<INCIDENTS_CSV>` in a later step, not during this run.
- `packets/<incident_id>.json` — per incident, the full writer/critic/verifier trail.
- `behaviours_open_queue.json` — incidents needing human adjudication.

`<INCIDENTS_CSV>` is read-only input for this run.
