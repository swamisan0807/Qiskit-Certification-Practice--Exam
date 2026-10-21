// Regenerates practice-exam.md from web/questions.js.
// Run from the repo root:  node scripts/build-markdown.js

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "web", "questions.js"), "utf8"), sandbox);
const { QUESTIONS, SECTIONS } = sandbox.window;

const LETTERS = ["A", "B", "C", "D"];
const sectionName = (id) => SECTIONS.find((s) => s.id === id).name;
const fence = (code, lang) => "```" + lang + "\n" + code + "\n```\n";
const langFor = (code) => (code.trimStart().startsWith("OPENQASM") ? "qasm" : "python");

// The animation's step notes, as plain text. In the app they're shown one step
// at a time; here they become a numbered walkthrough. Box-style scenes without
// notes fall back to the text of their boxes.
function walkthrough(anim) {
  if (!anim) return [];
  let steps = anim.notes || [];
  if (!steps.length && anim.items) {
    steps = anim.items.map((it) => {
      const mark = it.mark === "ok" ? " ✓" : it.mark === "bad" ? " ✗" : "";
      return `${it.k ? it.k + ": " : ""}\`${it.t}\`${it.s ? ": " + it.s : ""}${mark}`;
    });
  }
  // Notes for the live dynamic-circuit scene depend on a random shot.
  return steps.map((s) => s
    .replace(/c\[0\] = \{c0\}/g, "c[0] = 0 or 1")
    .replace("This time the X {ran}", "The X only fires when c[0] is 1")
    .replace(/\{shots\}/g, "1024")
    // Drop references to the player's buttons, which don't exist on paper.
    .replace(/ ?(Press|Replay and)[^.]*Replay[^.]*\.|( Replay and the numbers change\.)/g, "")
    .replace(/ \(watch its dial swing to −\)/, ""));
}

const out = [];
out.push("# Qiskit v2.x Developer Associate: 60-Question Practice Exam\n");
out.push(
  "Original practice questions written against the published topic outline for IBM exam C1000-179. " +
  "They are not real exam items. Every code snippet was run on Qiskit 2.5.\n"
);
out.push(
  "Each question is followed straight away by its answer, the reason it's right, and a step-by-step walkthrough. " +
  "If you want to test yourself first, use the timed exam in `web/` instead: it hides the answers until you submit.\n"
);
out.push("> This file is generated from `web/questions.js`. Edit that file, then run `node scripts/build-markdown.js`.\n");

let current = 0;
QUESTIONS.forEach((q, i) => {
  if (q.section !== current) {
    current = q.section;
    out.push(`\n## Section ${current}: ${sectionName(current)}\n`);
  }
  out.push(`### ${i + 1}. ${q.q}\n`);
  if (q.code) out.push(fence(q.code, langFor(q.code)));
  q.options.forEach((o, j) => out.push(`- **${LETTERS[j]}.** ${o}`));
  out.push("");
  out.push(`**Answer: ${LETTERS[q.answer]}.** ${q.options[q.answer]}\n`);
  out.push(`**Why:** ${q.explain}\n`);
  const steps = walkthrough(q.anim);
  if (steps.length) {
    out.push("**Step by step:**\n");
    steps.forEach((s, k) => out.push(`${k + 1}. ${s}`));
    out.push("");
  }
  out.push("---\n");
});

out.push("Official exam page: https://www.ibm.com/training/certification/ibm-certified-quantum-computation-using-qiskit-v2x-developer-associate-C9008400  ");
out.push("Qiskit documentation: https://quantum.cloud.ibm.com/docs\n");

fs.writeFileSync(path.join(root, "practice-exam.md"), out.join("\n"));
console.log(`Wrote practice-exam.md (${QUESTIONS.length} questions)`);
