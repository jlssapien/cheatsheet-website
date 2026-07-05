# Glossary

## Specification Gaming

A system achieves high performance on a specified objective in a way that satisfies the literal specification but violates the designer's intent. The system finds an unintended strategy that exploits a gap between what was specified and what was meant.

## Attributed Specification Gaming (ASG)

An incident where the system's behavior is identified and described as specification gaming (or a recognized synonym such as reward hacking, reward tampering, or goal misgeneralization) by the authors of the source paper. The attribution is explicit in the text.

## Unattributed Specification Gaming (USG)

An incident where the system's behavior meets the criteria for specification gaming, but the authors do not describe it as such. The behavior is specification gaming by our rubric's definition, even though the original authors used different framing or did not label it.

## Out of Scope (OOS)

An incident or paper that was flagged during screening but does not meet the rubric's criteria for specification gaming. Common reasons for OOS classification include: the behavior is an ordinary bug rather than an optimization-driven strategy, the system was not pursuing an objective, or the unintended behavior does not exploit a gap between specification and intent.

## Reward Hacking

A form of specification gaming where a system optimizes a proxy reward signal in ways that diverge from the intended objective. The reward function is technically satisfied but the underlying goal is not achieved.

## Goal Misgeneralization

A system learns a policy that performs well in training but pursues an unintended goal in deployment, because a spurious correlation in the training environment allowed the system to achieve high reward without learning the intended goal.

## Shortcut Learning

A supervised learning system achieves high accuracy by relying on spurious features (shortcuts) that correlate with labels in training data but are not causally related to the target concept. Common in image classifiers and NLP systems.

## Reward Tampering

A system interferes with its own reward signal rather than performing the intended task. This includes manipulating the reward function, influencing the evaluation process, or exploiting errors in how reward is computed.

## LM / Non-LM

The dataset distinguishes between language model systems (LM) and non-language-model systems (Non-LM). LM includes large language models, chatbots, and text generation systems. Non-LM includes reinforcement learning agents, classifiers, recommender systems, and other AI systems that are not primarily language models.

## Inter-Coder Agreement

The degree to which independent coders (human or LLM-based) assign the same classification to the same incident. Measured at both the category level (do coders agree on ASG/USG/OOS?) and the count level (do coders identify the same number of incidents in a paper?).

## Decision Tree

An earlier classification approach (versions 1-5) that used a branching series of yes/no questions to assign categories. Superseded by the criteria-based rubric, which proved more reliable for edge cases.
