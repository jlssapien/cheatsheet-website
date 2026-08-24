# About

## The Project

Specification gaming happens when an AI system does well measured narrowly by the letter of its objective while missing what the people who built it actually wanted. CheatSheet is a catalogue of these cases. It leans toward the surprising end of that behaviour — the kind that is harder to explain away as a banal system quirk.

The incidents are drawn from the research literature, each entry recording what the system was asked to do, what it actually did, the model involved, and a link back to the source paper. The [incidents page](/incidents) holds the full catalogue, browsable as a tree or a dashboard and filterable by category, year, model family, and source paper. Every entry links to the paper that reported it. How the corpus was built and classified is described on the [methods page](/methods), and the [rubric](/project-files/rubric) is published in full under project files, so any entry's classification can be checked against it.

This project builds on [Victoria Krakovna's specification gaming list](https://vkrakovna.wordpress.com/2018/04/02/specification-gaming-examples-in-ai/), extending coverage to work published since that list stopped being updated.

## Classification

Every incident is sorted against a published rubric into two major categories: attributed specification gaming and unattributed specification gaming. The split turns on whether something in the experimental setup makes the gaming foreseeable.

- **Attributed Specification Gaming (ASG)** — when something in the setup, such as the training data, the environment, or the way the system was evaluated, made the exploit foreseeable, so the behaviour is plausibly explained by the setup rather than the model.
- **Unattributed Specification Gaming (USG)** — when nothing in the setup obviously pointed to the exploit, which leaves the behaviour looking more like a property of the model than of the test.

## Scope & Caveats

These categories may be over-inclusive in some circumstances, in that they include similar and overlapping distinctions from adjacent literatures — reward hacking, goal misgeneralization, and so on. We flattened the cause-based labels from Krakovna's list, from which this work takes inspiration, as it split incidents by cause where ours splits them only by attributability.

We have also kept cases that we did not count as specification gaming proper, grouped under a set of out-of-scope categories: negative side effects, benign competence, benign incompetence, and a catch-all for incidents the rubric could not be applied to yet that turn up in searches for specification gaming. We include these in the interest of transparency about where lines were drawn, and because much of the classifying was produced through an AI-guided process using different models of Claude 4.x (mainly Opus and Sonnet). We have tried to verify the data through a number of sweeps, but there may still be mistakes, misattributions, and likely plenty of places where one might disagree. [We welcome your feedback.](mailto:jake@arbresearch.com)

## The Team

This project was conducted by [Arb Research](https://arbresearch.com/), a consulting firm specializing in forecasting, machine learning, and policy.

The team:

- Data masochists: Paul Crowe & Rory Švarc
- Mule and whip: Jacob Livingston Slosser
- All seeing eye: Gavin Leech

This dataset of AI systems gaming their objectives was itself built largely by AI systems. Language models read papers, split the incidents, argued with each other over which ones counted, attributed the models, wrote the descriptions, and proposed the titles. Humans did a fair amount of setting the initial categorising groundwork reading the initial large set of papers but worked mostly in settling disputes and correcting errors, and take the blame for whatever slipped through.

Yes, we are aware of the irony of enlisting language models to catalogue the ways language models cut corners, and yes, we watched them for exactly the behaviour documented here. Treat every field as AI-generated and human-checked rather than human-authored, and weight it accordingly.

## Funding

Arb wishes to thank the project's funders [Sage Future](https://sage-future.org/).

## License

This project is released into the public domain under [Creative Commons CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). No attribution is required, though citation back to Arb Research is appreciated.
