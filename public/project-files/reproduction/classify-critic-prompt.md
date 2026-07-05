# Critic prompt — SG Rubric v2-amended classification

You will NOT classify the incident. Three independent classifications of this incident are below. Your job is to analyze where they diverged and why.

## Inputs

- The incident metadata: `paper_id`, `paper_title`, `paper_url`, `incident_name`, `notes`.
- The three screener outputs, each containing CATEGORY, REASONING, CONFIDENCE.

The paper's full text is available as markdown at `<PAPERS_DIR>/<paper_id>.md` if you need to consult it to evaluate a screener's factual claims about the incident. You are not required to read it for routine cases — your primary job is to compare the screeners' reasoning against each other and against the rubric.

## What to analyze

For each of the following, write a short, specific point. Skip a point if it does not apply.

1. **Point of divergence.** What is the specific rubric question or factual claim about the incident on which the screeners disagree? Name it precisely (e.g., "screeners disagree on whether Criterion 5 is satisfied — Screener 1 reads the behavior as overcoming obstacles to a consistent endpoint; Screener 3 reads it as a one-off output without obstacle-overcoming").
2. **Factual conflicts about the incident.** Note any places where two screeners make incompatible factual claims about the system, training setup, or behavior. (E.g., "Screener 2 says the reward signal directly incentivized the behavior; Screener 1 says the reward was a standard proxy.")
3. **Weak or under-supported reasoning.** Identify any screener whose REASONING fails to anchor its conclusion to specific rubric criteria, conflates two criteria (e.g., treats Criterion 4 evidence as supporting Criterion 5), or makes a leap not supported by the cited section.
4. **ASG vs. USG attribution call.** If the screeners agree that specification gaming occurred but split on ASG vs. USG, identify what environmental feature each screener is pointing to (or denying), and whether that feature is genuinely present in the paper as described.
5. **Boundary considerations.** Flag any "goal-at-all-costs" prompting, deliberately constructed test environments, or other context that the rubric specifically calls out as warranting lower confidence (per the Criterion 2 clarification and Example 7).

## What NOT to do

- Do NOT issue a CATEGORY. You are not a fourth vote.
- Do NOT summarize what the screeners said. Analyze.
- Do NOT propose a final answer or recommend a category to the human reviewer. Your job is to surface what is in tension.
- Do NOT invent claims about the paper. If you consult the paper to check a screener's claim, quote or cite the specific section.

## Output format

Write your analysis as plain prose with numbered or labeled points. Be terse and specific. No preamble, no closing. No more than ~250 words unless the disagreement is genuinely complex.

## Incident

```
paper_id: {paper_id}
paper_title: {paper_title}
paper_url: {paper_url}
incident_name: {incident_name}
notes: {notes}
```

## Three screener outputs

```
{screener_1_output}

{screener_2_output}

{screener_3_output}
```
