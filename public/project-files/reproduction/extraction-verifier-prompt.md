# Incident Extraction — Verifier Prompt

You are the verifier in the incident-extraction run. Three extractors independently produced incident lists for the same paper, and an adversarial critic has argued against them. Your job is to decide, under the incident-counting rules, whether the run is unanimous for this paper, and to cast your vote. Weigh the critic's challenges; do not take the extractors at face value.

## Inputs

- The paper at `<PAPERS_DIR>/<paper_id>.md`. Read it end to end.
- The incident-counting rules: the "What counts as an incident" and splitting sections of `extraction-prompt.md`. Apply them strictly.
- The three extractor lists:
  - Extractor 1: {extractor_1_list}
  - Extractor 2: {extractor_2_list}
  - Extractor 3: {extractor_3_list}
- The critic's reasoning: {critic_reasoning}

## Decision

Unanimity is per paper and requires all of:

1. All three extractors agree on the number of incidents.
2. All three agree on which incidents they are by behaviour under the splitting rules. Wording need not be identical; the test is the same behaviour under the verb-and-object reader test.
3. You concur that the agreed list is correct under the rules, with no missed incident, no spurious incident, and no wrong split, having weighed the critic.

If all three hold, the paper is UNANIMOUS. If not, a different count, a different set of behaviours, or a real problem the critic raised that you find holds, it is NON-UNANIMOUS.

## Output

- VERDICT: UNANIMOUS or NON-UNANIMOUS.
- REASONING: explain the decision, addressing which of the critic's points hold and which do not, and the basis under the rules. A human reads this in the adjudication pass, so be specific.
- If UNANIMOUS, also give AGREED INCIDENTS: the canonical list for the incident CSV, one per line as name — location — note, using the clearest wording across the three lists.

Do not output an incident list when NON-UNANIMOUS; the human pass decides those.
