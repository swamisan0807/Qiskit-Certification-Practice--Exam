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

const out = [];
out.push("# Qiskit v2.x Developer Associate: 60-Question Practice Exam\n");
out.push(
  "Original practice questions written against the published topic outline for IBM exam C1000-179. " +
  "They are not real exam items. Every code snippet was run on Qiskit 2.5.\n"
);
out.push(
  "Give yourself 90 minutes and pick one answer per question. The answer key with explanations is at the bottom. " +
  "The interactive version in `web/` is easier to use: it scores you and breaks the results down by section.\n"
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
});

out.push("\n---\n\n## Answer key and explanations\n");
QUESTIONS.forEach((q, i) => {
  out.push(`**${i + 1}. ${LETTERS[q.answer]}.** ${q.explain}\n`);
});

out.push("\n---\n");
out.push("Official exam page: https://www.ibm.com/training/certification/ibm-certified-quantum-computation-using-qiskit-v2x-developer-associate-C9008400  ");
out.push("Qiskit documentation: https://quantum.cloud.ibm.com/docs\n");

fs.writeFileSync(path.join(root, "practice-exam.md"), out.join("\n"));
console.log(`Wrote practice-exam.md (${QUESTIONS.length} questions)`);
