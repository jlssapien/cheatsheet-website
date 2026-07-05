# Models verifier — confirm per-incident model attribution

You receive three extractors' outputs for a single incident. Your job is to rule each candidate model IN or OUT and scan for any model the extractors may have missed.

## Inputs

- Same incident metadata as the extractors: `incident_name`, `paper_id`, `paper_title`, `notes`
- Paper text: available as markdown at `<PAPERS_DIR>/<paper_id>.md`
- The three extractors' JSON outputs side-by-side

## Reading strategy

Same as the extractors: read the section(s) cited in `notes` first. Expand to read more of the paper only if needed. Do NOT read the full paper as a default.

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

**Models not in the canonical list:** use the paper's name with normalization rules applied.

**Anonymous models** (paper uses placeholder like "Model A"): use the paper's label as-is.

**Custom RL agent / non-LLM policy network is the actor of the incident** (e.g., a ConvNet+V-MPO agent on a gridworld, an ES-trained policy on Atari, a PPO+LSTM agent on a control task): normalize to `custom RL agent`. Use this whenever the "model" exhibiting the behavior is a bespoke policy network trained from scratch and is not a foundation model from the canonical list. Distinguish from `training algorithm`: use `training algorithm` only when the incident is about the algorithm itself (the same incident would arise across model architectures) rather than about a specific policy network's behavior. If the extractors disagree between `custom RL agent` and `training algorithm`, the verifier picks based on the paper's framing of the incident.

**The verifier's normalized family name is the AUTHORITATIVE name for the row.**

## Procedure

1. Compute the union of all three extractors' model lists.
2. For each candidate model in the union, locate the cited paper section and verify:
   - Is the model attributed to the specific named incident in this section? → IN
   - Is the model only tested elsewhere in the paper without the named behavior? → OUT
   - Is the attribution ambiguous? → Flag for open queue
3. Scan the cited section(s) for model families not in the union but that the paper attributes to the incident. Add them.
4. **Granularity authority:** apply the canonical normalization rules to every model name. If your normalized name differs from how the extractors named the same model (e.g., extractor wrote `GPT-4o` and you determine canonical is `GPT-4`), use your normalized name.
5. **Granularity disagreement open-queue:** if your normalized family name does not match any of the three extractors' normalized names for the same underlying model (i.e., none of the extractors agree with your reading of which family the paper's model belongs to), flag the row for open queue rather than overriding silently.

## Output structure

Return a JSON object with exactly this structure:

```json
{
  "confirmed_models": ["Llama-3", "GPT-4"],
  "ruled_out": [
    {"family": "Claude-3", "reason": "tested in §5.1 unrelated sweep, no behavior attribution"}
  ],
  "added_by_verifier": [
    {"family": "Gemini-1.5", "reason": "Table 4 documents same behavior; extractors missed"}
  ],
  "open_queue_flag": false,
  "open_queue_reason": null
}
```

If unresolvable (ambiguous attribution OR granularity disagreement with all extractors), set `open_queue_flag: true` and explain in `open_queue_reason`.

## Incident to verify

```
paper_id: {paper_id}
paper_title: {paper_title}
incident_name: {incident_name}
notes: {notes}

Extractor 1 output:
{extractor_1_output}

Extractor 2 output:
{extractor_2_output}

Extractor 3 output:
{extractor_3_output}
```
