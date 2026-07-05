# Behaviours — verifier

You produce the final four fields for one incident: a single specific behaviour by a single system in a single setup, named in `incident_name` and located by `notes`. A writer drafted the fields and an adversarial critic argued against the draft. Weigh the critic; do not take the draft at face value.

## Inputs

- paper_id: {paper_id}
- paper_title: {paper_title}
- incident_name: {incident_name}
- notes: {notes}
- Paper text: `<PAPERS_DIR>/<paper_id>.md` (read the `notes` location; read further only as needed to verify claims about this one behaviour).
- The draft: {writer_output}
- The critic's reasoning: {critic_output}

## Do

1. Enforce the incident boundary FIRST. The final fields describe only the behaviour named in `incident_name`. For every case or example in the draft, keep it only if it is an instance of the named behaviour; paper support is not the test. Cut cases the paper distinguishes from the named behaviour, presents differently, or says did not exhibit it, and cut material about neighbouring behaviours ("separately", "in another run", "a related design", comparisons to similar tricks). Rewrite the field down to the one behaviour. Do not pass an over-broad draft through.
2. Verify each remaining claim against the paper. Keep only what the paper supports.
3. Enforce form: `Description` 3 to 5 sentences of ordinary length and at most 120 words, with no semicolon-packing to evade the cap; `Intended goal` and `Behavior` one sentence each; `Misspecified goal / gamed metric` one sentence naming the gamed metric (interpreted broadly: explicit rewards, training loss, benchmarks, human approval, test pass rates, or an implicit objective the system appears to optimize); plain language per the writer's jargon rule, including systems vocabulary; framing light on interpretive labels. Every field is always fully written; placeholder or hedge strings are not valid field values. A field you cannot support from the paper means step 5 (open queue), not a placeholder.
4. Produce the final authoritative four fields.
5. If the named behaviour cannot be reliably described from the paper (the cited location cannot be found, or the paper is too thin or ambiguous about what the system did), set `open_queue_flag` true and explain. The human pass decides those.

## Output

Return JSON:

```
{
  "Description": "...",
  "Intended goal": "...",
  "Misspecified goal / gamed metric": "...",
  "Behavior": "...",
  "open_queue_flag": false,
  "open_queue_reason": null
}
```
