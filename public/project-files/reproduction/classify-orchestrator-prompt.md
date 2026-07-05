# Classify (ASG/USG/OOS) — orchestrator

Classify each incident in the incident list as ASG, USG, or OOS. For each incident, run three blind screeners; if they agree confidently, settle; otherwise run a critic and an independent verifier and decide. Write the category to the CSV. Send genuinely contested incidents to a human queue. Use the `Agent` tool for all sub-agents. No API or SDK. No nested sub-agents.

## Files

- Incident list: `<INCIDENTS_CSV>`. One row is one incident, keyed by `<incident_id>`. Add a `CATEGORY` column if it does not already have one.
- Paper text: `<PAPERS_DIR>/<paper_id>.md`.
- Screener prompt: `classify-screener-prompt.md`. Placeholders `{paper_id}`, `{paper_title}`, `{paper_url}`, `{incident_name}`, `{notes}`.
- Critic prompt: `classify-critic-prompt.md`. The same five, plus `{screener_1_output}`, `{screener_2_output}`, `{screener_3_output}`.
- Verifier prompt: `classify-verifier-prompt.md`. The same incident placeholders as the screener.

## For each incident that has no packet

1. Fill the screener prompt with the row's fields. Spawn three screeners in one message. Collect three outputs (each `CATEGORY` / `REASONING` / `CONFIDENCE`).
2. If all three `CATEGORY` agree and none is `CONFIDENCE: LOW`: settle that category. Skip to step 5.
3. Otherwise escalate. Spawn in one message: the critic (given the three screener outputs) and the verifier (blind to the screeners, classifies independently). Collect both.
4. Decide using the verifier's category:
   - Verifier matches a unanimous screener category, or joins the majority of a 2-1 split: settle that category.
   - Verifier joins the lone minority, picks a third category, or dissents from a unanimous-but-LOW screener set: leave `CATEGORY` blank and send to the open queue.
5. Write the packet `<PACKETS_DIR>/<incident_id>.json`: the three screener outputs, and if escalated the critic and verifier outputs, plus the settled category or the open-queue flag.
6. Route:
   - Settled → write `CATEGORY` into `<INCIDENTS_CSV>` for that row.
   - Open queue → append to `classify_open_queue.json` and leave `CATEGORY` blank.
   Save after each incident. Print one line: `paper_id`, `incident_name`, the category or `OPEN-QUEUE`.

## Result

- `<INCIDENTS_CSV>` gains a `CATEGORY` for every settled incident.
- The survivors are the rows with `CATEGORY` of `ASG` or `USG`; behaviours and models run on those only. `OOS` rows stay in the CSV with their category and are carried no further.
- Open-queue incidents wait for one-by-one human adjudication before they count as kept or dropped.

## Rules

- Three blind, identical screeners. No merge or majority vote in code; escalation and the verifier decide.
- The critic issues no category. The verifier classifies independently, blind to the screeners.
- Same strong model for all sub-agents.
- Checkpoint after each incident; resume at the first incident with no packet.
- Every incident ends with a packet and a route. Drop nothing.
- Classify only. Do not re-extract incidents, write behaviour fields, or attribute models.
