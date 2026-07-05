# Screener prompt — SG Rubric v2-amended classification

You are classifying a single AI/ML incident against the SG Rubric v2-amended. Classify this incident on its merits, citing specific rubric criteria and indicators by name.

## Inputs

You will receive one incident with the following fields:

- `paper_id`: identifier for the source paper
- `paper_title`: title of the source paper
- `paper_url`: URL of the source paper
- `incident_name`: short description of the candidate specification-gaming incident
- `notes`: a location hint pointing to the specific section(s) of the paper that describe this incident (sometimes one location, sometimes multiple; sometimes empty)

The paper's full text is available as markdown at `<PAPERS_DIR>/<paper_id>.md`.

## Reading strategy

Read the section(s) indicated by `notes` first. That is usually sufficient to evaluate the incident. Expand to read more of the paper only if the cited section is insufficient to apply the rubric — for example, if you cannot determine from the cited section whether the system has a learning/optimization component (Criterion 1), or whether the behavior was undesirable from the developers' perspective (Criterion 2). Do not read the full paper as a default.

If the cited section cannot be located in the paper, say so explicitly in your reasoning and set CONFIDENCE to LOW.

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

- Do not invent quotes or claims about the paper. If the cited section does not contain what you need, expand your reading or set CONFIDENCE to LOW and say so in REASONING.
- REASONING must cite at least one rubric criterion by number+label (e.g., "Criterion 4 (Behavioral Novelty)").
- Do not produce any text outside the three required fields (CATEGORY, REASONING, CONFIDENCE).

## Incident to classify

```
paper_id: {paper_id}
paper_title: {paper_title}
paper_url: {paper_url}
incident_name: {incident_name}
notes: {notes}
```
