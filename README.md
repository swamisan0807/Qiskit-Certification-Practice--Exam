# Qiskit v2.x Certification Practice Exam

60 practice questions for the **IBM Certified Quantum Computation using Qiskit v2.X Developer – Associate** exam (C1000-179), with a small web app to take them in.

Most questions are built around a short code snippet, because that's how the real exam tests you. Every snippet was run against Qiskit 2.5, so the expected output in each answer is what Qiskit actually prints, not what we guessed it would. Each answer explains *why* it's right, and where it helps, why the tempting wrong answer is wrong.

## Using the web app

Open `web/index.html` in a browser. That's it: there's no build step, no install and no network needed.

If your browser is strict about local files, serve the folder instead:

```bash
python -m http.server -d web 8000
# then open http://localhost:8000
```

It runs as a **timed exam**: 90 minutes for all 60 questions, with no feedback until you submit. You can flag questions to come back to. Every attempt shuffles both the question order and the A–D order of the answers, so you can't remember answers by position. When you submit, you see your score per section and a review with every answer explained. You can then retake just the questions you missed.

In the review, every answer comes with an **animated walkthrough** that you can step through, pause and replay. Circuits run gate by gate on a small built-in simulator, so the amplitude bars, Bloch-sphere arrows and expectation values you see are calculated from the gates, not drawn by hand. Other questions animate the idea behind the answer: bitstrings read right to left, qubits mapped onto a device, Session vs job-mode timelines, PUB slots filling in, broadcasting shapes, and shots arriving one at a time.

Progress is saved in your browser, so if you close the tab you can pick up where you left off.

## What's covered

The split follows the weighting on the official exam page:

| # | Section | Questions |
|---|---|---:|
| 1 | Perform quantum operations | 10 |
| 2 | Visualize circuits, measurements, and states | 7 |
| 3 | Create quantum circuits | 11 |
| 4 | Run quantum circuits | 9 |
| 5 | Use the Sampler primitive | 7 |
| 6 | Use the Estimator primitive | 7 |
| 7 | Retrieve and analyze results | 6 |
| 8 | Operate with OpenQASM | 3 |
| | **Total** | **60** |

Many questions focus on what changed in Qiskit 2.x and trips people up: `c_if` replaced by `if_test`, the V1 primitives being gone, PUB shapes and broadcasting, ISA circuits and `apply_layout`, the `meas` vs `c` register names, and little-endian bit ordering.

## Repository layout

```
web/
  index.html, styles.css, app.js   the practice app
  anim.js                          animation player, scene types and statevector simulator
  questions.js                     the question bank, including each answer's animation
scripts/
  build-markdown.js                regenerates practice-exam.md from the bank
practice-exam.md                   all 60 questions as a printable document
docs/
  diagrams-and-concepts.md         circuit diagrams and workflow notes
  study-plan.md                    a 5-day revision plan
```

To add or fix a question, edit `web/questions.js`, then run:

```bash
node scripts/build-markdown.js
```

