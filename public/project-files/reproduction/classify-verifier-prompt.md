# Verifier prompt — SG Rubric v2-amended classification

You are classifying a single AI/ML incident against the SG Rubric v2-amended. Read the paper thoroughly and classify on the incident's merits.

## Inputs

You will receive one incident:

- `paper_id`
- `paper_title`
- `paper_url`
- `incident_name`
- `notes` (location hint, may be partial)

The paper's full text is available as markdown at `<PAPERS_DIR>/<paper_id>.md`.

## Reading strategy

Do not assume the location hint is sufficient. Read enough of the paper to apply the rubric correctly — typically that means the section(s) named in `notes`, the surrounding context (training setup, evaluation, intended behavior), and any discussion section where the authors comment on the observed behavior. Read the whole paper if the case warrants it.

## The rubric

<INSERT SG RUBRIC v2-amended HERE>

## Classification Output Format

For each incident, produce:

```
CATEGORY: [ASG | USG | OOS]

REASONING: [2-4 sentences. State which criteria are satisfied. For ASG/USG, name the metric being gamed and the unintended mechanism. For ASG specifically, identify the environmental feature that made the exploit attributable. For USG, state why no such feature exists. For OOS, state which specification gaming criterion fails.]

CONFIDENCE: [HIGH | MEDIUM | LOW]

Flag as LOW if the incident is near a category boundary.
```

## Hard rules

- Read the paper before classifying. Do not rely solely on `incident_name` or `notes`.
- Do not invent claims about the paper. Anchor each claim to specific section/figure references where appropriate.
- REASONING must cite at least one rubric criterion by number+label.
- Produce no text outside the three required output fields (CATEGORY, REASONING, CONFIDENCE).

## Incident to classify

```
paper_id: {paper_id}
paper_title: {paper_title}
paper_url: {paper_url}
incident_name: {incident_name}
notes: {notes}
```
