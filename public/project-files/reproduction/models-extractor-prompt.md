# Models extractor — per-incident model family extraction

You will identify which model family/families the paper attributes to a specific named incident. NOT every model the paper tested — only those the paper shows exhibiting the named behavior.

## Inputs

- `incident_name`: the specific behavior to track
- `paper_id`, `paper_title`, `notes`: metadata. `notes` is a location hint pointing to the section(s) of the paper that describe this incident.
- Paper text: available as markdown at `<PAPERS_DIR>/<paper_id>.md`

## Reading strategy

Read the section(s) indicated by `notes` first. That is usually sufficient. Expand to read more of the paper only if the cited section is insufficient to identify which models the paper attributes the incident to. Do NOT read the full paper as a default. If the cited section cannot be located, say so in your output.

## Granularity — canonical model families

Use the model family, not micro-versions. Canonical family names (use these spellings):

- `GPT-2`, `GPT-3`, `GPT-3.5`, `GPT-4`, `GPT-4o` (separate from GPT-4), `GPT-5`, `o1`, `o3`, `o4`
- `Llama`, `Llama-2`, `Llama-3`, `Llama-4`
- `Claude-2`, `Claude-3`, `Claude-3.5`, `Claude-4`
- `Qwen`, `Qwen-2`, `Qwen-2.5`, `Qwen-3`
- `Gemini-1`, `Gemini-1.5`, `Gemini-2`
- `DeepSeek-V2`, `DeepSeek-V3`, `DeepSeek-R1` (R-series treated as separate family from V-series)
- `Mistral`, `Mixtral`, `Mistral-Nemo`
- `Phi`, `Phi-2`, `Phi-3`, `Phi-4`
- `Gemma`, `Gemma-2`, `Gemma-3`
- `T5`, `FLAN-T5`
- `Pythia`, `OPT`, `Vicuna`, `Falcon`, `MPT`, `BLOOM`

**Normalization rules** (apply when collapsing a paper's specific model name to a canonical family):
- Drop size suffixes: `-8B`, `-13B`, `-70B`, `-405B`, etc.
- Drop date suffixes: `-2024-11-20`, etc.
- Drop instruct/chat suffixes: `-Instruct`, `-chat`, `-base`, `-it`
- Drop quantization tags: `-Q4`, `-GGUF`, etc.
- Keep major version distinctions: `Llama-2` and `Llama-3` are distinct families; `Llama-3.1` collapses to `Llama-3`.

**Models not in the canonical list:** use the paper's name with normalization rules applied. Examples: paper says `DeepSeek-R1-Distill-Qwen-7B` → write `DeepSeek-R1`; paper says `Mistral-Nemo-Instruct-2407` → write `Mistral-Nemo`.

**Anonymous models** (paper uses placeholder like "Model A"): use the paper's label as-is.

## Special cases

- **No model attributed to this incident** (theoretical paper, dataset statistic, etc.): output `models: []`. Explain why in `no_model_reason`.
- **Custom RL agent / non-LLM policy network is the actor of the incident** (e.g., a ConvNet+V-MPO agent on a gridworld, an ES-trained policy on Atari, a PPO+LSTM agent on a control task): output `["custom RL agent"]`. Use this whenever the "model" exhibiting the behavior is a bespoke policy network trained from scratch and is not a foundation model from the canonical list.
- **Incident is fundamentally about a training method/algorithm, not a model** (e.g., "DPO overoptimizes proxy reward" where the model is incidental): output `["training algorithm"]`. Distinguish from `custom RL agent`: use `training algorithm` only when the incident is about the algorithm itself (the same incident would arise across model architectures) rather than about a specific policy network's behavior.

## Output structure

Return a JSON object with exactly this structure:

```json
{
  "incident_section": "Section 4.2 / Table 3",
  "models": [
    {"family": "Llama-3", "locator": "Section 4.2, p. 7"},
    {"family": "GPT-4", "locator": "Table 3"}
  ],
  "negative_set": [
    {"family": "Claude-3", "reason": "tested in §5 sweep but did not exhibit the named behavior"}
  ],
  "no_model_reason": null
}
```

For empty model cases, set `models: []` and `no_model_reason: "..."` explaining why no model is attributable.

## Incident to extract

```
paper_id: {paper_id}
paper_title: {paper_title}
incident_name: {incident_name}
notes: {notes}
```
