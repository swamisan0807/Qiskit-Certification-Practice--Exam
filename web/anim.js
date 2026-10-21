// Animated explanations.
//
// Every question in questions.js carries an `anim` spec. Anim.mount(host, spec)
// turns it into a small player: a stage, a one-line note per step, and
// Back / Play / Next / Replay controls. Each scene type below only has to say
// how many frames it has and how to show frame i; the player does the rest.
//
// The circuit scenes run a tiny statevector simulator (up to 3 qubits), so the
// amplitudes, Bloch vectors and expectation values on screen are computed from
// the gates, not typed in by hand.

(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const PI = Math.PI;
  const S2 = Math.SQRT1_2;
  const REDUCED = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ---------- DOM helpers ----------
  function h(tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function s(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function stext(parent, x, y, str, attrs) {
    const t = s("text", Object.assign({ x, y }, attrs || {}), parent);
    t.textContent = str;
    return t;
  }
  function esc(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function inline(t) {
    return esc(t).replace(/`([^`]+)`/g, "<code>$1</code>");
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // Object keys like "10" and "11" are integer-like, so JS lists them before
  // "00" and "01". Put bitstrings back in their natural order.
  const orderedKeys = (obj) => {
    const keys = Object.keys(obj);
    return keys.every((k) => /^[01]+$/.test(k)) ? keys.sort() : keys;
  };
  const fmt = (x) => (x < -0.005 ? "−" : "") + Math.abs(x).toFixed(2);

  // ---------- statevector simulator ----------
  // Amplitudes are [re, im] pairs; basis index bit k is qubit k (little-endian, like Qiskit).
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const abs2 = (a) => a[0] * a[0] + a[1] * a[1];

  function matrix(name, th) {
    const c = Math.cos((th || 0) / 2), sn = Math.sin((th || 0) / 2);
    switch (name) {
      case "x": return [[0, 0], [1, 0], [1, 0], [0, 0]];
      case "y": return [[0, 0], [0, -1], [0, 1], [0, 0]];
      case "z": return [[1, 0], [0, 0], [0, 0], [-1, 0]];
      case "h": return [[S2, 0], [S2, 0], [S2, 0], [-S2, 0]];
      case "s": return [[1, 0], [0, 0], [0, 0], [0, 1]];
      case "sdg": return [[1, 0], [0, 0], [0, 0], [0, -1]];
      case "t": return [[1, 0], [0, 0], [0, 0], [S2, S2]];
      case "sx": return [[0.5, 0.5], [0.5, -0.5], [0.5, -0.5], [0.5, 0.5]];
      case "rx": return [[c, 0], [0, -sn], [0, -sn], [c, 0]];
      case "ry": return [[c, 0], [-sn, 0], [sn, 0], [c, 0]];
      case "rz": return [[c, -sn], [0, 0], [0, 0], [c, sn]];
      default: return null;
    }
  }
  function apply1(a, q, m) {
    const bit = 1 << q;
    for (let i = 0; i < a.length; i++) {
      if (i & bit) continue;
      const x = a[i], y = a[i | bit];
      a[i] = cadd(cmul(m[0], x), cmul(m[1], y));
      a[i | bit] = cadd(cmul(m[2], x), cmul(m[3], y));
    }
  }
  function swapAmps(a, i, j) { const t = a[i]; a[i] = a[j]; a[j] = t; }

  function applyGate(g, st) {
    const name = g[0];
    const a = st.a;
    if (name === "barrier") return;
    if (name === "measure") {
      const q = g[1], bit = 1 << q;
      let p1 = 0;
      for (let i = 0; i < a.length; i++) if (i & bit) p1 += abs2(a[i]);
      const out = Math.random() < p1 ? 1 : 0;
      const norm = Math.sqrt(out ? p1 : 1 - p1) || 1;
      for (let i = 0; i < a.length; i++) {
        a[i] = ((i & bit) ? 1 : 0) === out ? [a[i][0] / norm, a[i][1] / norm] : [0, 0];
      }
      st.cl[g[2]] = out;
      return;
    }
    if (name === "if") {
      st.ran = st.cl[g[1]] === g[2];
      if (st.ran) applyGate(g[3], st);
      return;
    }
    if (name === "cx") {
      const c = 1 << g[1], t = 1 << g[2];
      for (let i = 0; i < a.length; i++) if ((i & c) && !(i & t)) swapAmps(a, i, i | t);
      return;
    }
    if (name === "cz") {
      const m = (1 << g[1]) | (1 << g[2]);
      for (let i = 0; i < a.length; i++) if ((i & m) === m) a[i] = [-a[i][0], -a[i][1]];
      return;
    }
    if (name === "swap") {
      const p = 1 << g[1], q = 1 << g[2];
      for (let i = 0; i < a.length; i++) if ((i & p) && !(i & q)) swapAmps(a, i, i ^ p ^ q);
      return;
    }
    if (name === "ccx") {
      const m = (1 << g[1]) | (1 << g[2]), t = 1 << g[3];
      for (let i = 0; i < a.length; i++) if ((i & m) === m && !(i & t)) swapAmps(a, i, i | t);
      return;
    }
    if (g[2] === null) return; // symbolic parameter: drawn, not simulated
    const m = matrix(name, g[2]);
    if (m) apply1(a, g[1], m);
  }

  function blochOf(a, n, q) {
    const bit = 1 << q;
    let x = 0, y = 0, z = 0;
    for (let i = 0; i < a.length; i++) {
      if (i & bit) continue;
      const a0 = a[i], a1 = a[i | bit];
      z += abs2(a0) - abs2(a1);
      x += 2 * (a0[0] * a1[0] + a0[1] * a1[1]);
      y += 2 * (a0[0] * a1[1] - a0[1] * a1[0]);
    }
    return [x, y, z];
  }

  function expectation(a, n, label) {
    const b = a.map((v) => v.slice());
    for (let p = 0; p < label.length; p++) {
      const ch = label[p];
      if (ch === "I") continue;
      apply1(b, n - 1 - p, matrix(ch.toLowerCase()));
    }
    let re = 0;
    for (let i = 0; i < a.length; i++) re += a[i][0] * b[i][0] + a[i][1] * b[i][1];
    return re;
  }

  // Bloch rotation for each single-qubit gate: [axis, angle].
  const AXIS = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1], h: [S2, 0, S2] };
  function rotationOf(g) {
    switch (g[0]) {
      case "x": return [AXIS.x, PI];
      case "y": return [AXIS.y, PI];
      case "z": return [AXIS.z, PI];
      case "h": return [AXIS.h, PI];
      case "s": return [AXIS.z, PI / 2];
      case "sdg": return [AXIS.z, -PI / 2];
      case "t": return [AXIS.z, PI / 4];
      case "sx": return [AXIS.x, PI / 2];
      case "rx": return g[2] === null ? null : [AXIS.x, g[2]];
      case "ry": return g[2] === null ? null : [AXIS.y, g[2]];
      case "rz": return g[2] === null ? null : [AXIS.z, g[2]];
      default: return null;
    }
  }
  function rotate(v, k, ang) {
    const c = Math.cos(ang), sn = Math.sin(ang);
    const kv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
    const cr = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
    return [0, 1, 2].map((j) => v[j] * c + cr[j] * sn + k[j] * kv * (1 - c));
  }

  // Oblique projection for the Bloch sphere: +X toward the viewer, +Y right, +Z up.
  const VIEW = { r: [-0.342, 0.94, 0], u: [-0.321, -0.117, 0.94], c: [0.883, 0.321, 0.342] };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function proj(v, cx, cy, R) { return [cx + R * dot(v, VIEW.r), cy - R * dot(v, VIEW.u)]; }

  // ---------- the player ----------
  const TITLES = {
    order: "Reading the label",
    circuit: "Step through it",
    steps: "How it fits together",
    map: "Where the qubits go",
    bars: "The numbers",
    timeline: "On the device's clock",
    matrix: "Density matrix, element by element",
    registers: "What happens to the registers",
    cancel: "What the optimiser sees",
    shape: "Array shapes",
    curve: "Error vs shots",
    stream: "Shot by shot",
  };

  // One line under each title that says how to read the picture.
  const HOW = {
    order: "Top row: the characters as written. Bottom row: the qubits (or bits). Each arrow shows which one a character belongs to.",
    steps: "Boxes appear one at a time, in order. Green ✓ is right, red ✗ is wrong, and blue marks the key step.",
    map: "Left: your qubits or terms. Right: where they end up. Blue links are where they really go, and red links are the wrong way.",
    bars: "Each bar's height is the number above it. Highlighted bars are the ones the answer depends on.",
    timeline: "Time runs left to right, and the moving line is the clock. Coloured blocks show what the device is doing at each moment.",
    matrix: "Each cell is one element of the density matrix, and a bigger square means a bigger value. The diagonal holds populations, the far corners hold coherences.",
    registers: "Single lines are qubits, and double lines are classical registers. The boxes on the right are the classical bits.",
    cancel: "Top row: no barrier. Bottom row: a barrier between the gates. Watch whether the two X gates can meet.",
    shape: "Each small square is one entry of an array. Watch how the input shapes combine into the result's shape.",
    curve: "The curve is the error falling as 1/√N. The dot shows the error at the current number of shots.",
    stream: "Each chip is one shot, in the order it was taken. Red chips are error outcomes.",
  };
  function howFor(spec) {
    if (spec.how) return spec.how;
    if (spec.type !== "circuit") return HOW[spec.type] || "";
    const views = [].concat(spec.view || "amps");
    const parts = ["The highlighted gate is the one being applied in this step."];
    if (views.includes("amps")) parts.push("Each bar is one basis state: its height is the probability, and the dial shows the phase (right = +, left = −).");
    if (views.includes("bloch")) parts.push("The arrow is the qubit's state: up is |0⟩, down is |1⟩, and on the equator is an equal superposition. The numbers underneath are ⟨X⟩, ⟨Y⟩ and ⟨Z⟩.");
    if (views.includes("expect")) parts.push("Each bar is an expectation value, from −1 at the left end to +1 at the right end.");
    if (spec.flip) return "The two steps show the same circuit, drawn two ways.";
    return parts.join(" ");
  }

  function mount(host, spec, opts) {
    opts = opts || {};
    host.innerHTML = "";
    const box = h("div", "anim", host);
    const head = h("div", "anim-head", box);
    h("span", "anim-title", head, esc(spec.title || TITLES[spec.type] || "Animation"));
    const counter = h("span", "anim-counter", head);
    const how = howFor(spec);
    if (how) h("p", "anim-how", box, `<b>How to read it:</b> ${inline(how)}`);
    const stage = h("div", "anim-stage anim-" + spec.type, box);
    const note = h("p", "anim-note", box);
    const bar = h("div", "anim-ctrls", box);
    const mk = (label, title) => {
      const b = h("button", "btn ghost small", bar, label);
      b.type = "button";
      b.title = title;
      return b;
    };
    const backBtn = mk("◀ Back", "Previous step");
    const playBtn = mk("Play", "Play / pause");
    const nextBtn = mk("Next ▶", "Next step");
    const replayBtn = mk("↻ Replay", "Start again");

    let scene, i = 0, timer = null, playing = false;

    function build() {
      stage.innerHTML = "";
      scene = SCENES[spec.type](stage, spec);
    }
    function noteFor(k) {
      if (scene.note) return scene.note(k);
      return (spec.notes && spec.notes[k]) || "";
    }
    function show(k, animate) {
      const last = scene.frames - 1;
      i = clamp(k, 0, last);
      scene.show(i, animate && !REDUCED);
      note.innerHTML = inline(noteFor(i));
      counter.textContent = `Step ${i + 1} of ${scene.frames}`;
      backBtn.disabled = i === 0;
      nextBtn.disabled = i === last;
    }
    function stop() {
      playing = false;
      clearTimeout(timer);
      playBtn.textContent = i === scene.frames - 1 ? "Play again" : "Play";
    }
    function tick() {
      clearTimeout(timer);
      if (!box.isConnected) return stop();
      if (i >= scene.frames - 1) return stop();
      timer = setTimeout(() => {
        if (!box.isConnected) return stop();
        show(i + 1, true);
        tick();
      }, spec.speed || scene.delay || 2200);
    }
    function play() {
      if (i >= scene.frames - 1) { build(); show(0, false); }
      playing = true;
      playBtn.textContent = "Pause";
      tick();
    }

    backBtn.onclick = () => { stop(); show(i - 1, false); };
    nextBtn.onclick = () => { stop(); show(i + 1, true); };
    playBtn.onclick = () => (playing ? stop() : play());
    replayBtn.onclick = () => { stop(); build(); show(0, false); play(); };

    build();
    if (REDUCED || opts.autoplay === false) {
      show(REDUCED ? scene.frames - 1 : 0, false);
      stop();
    } else {
      show(0, false);
      play();
    }
  }

  const SCENES = {};

  // ---------- order: which character belongs to which qubit ----------
  SCENES.order = function (stage, spec) {
    const text = spec.text;
    const n = text.length;
    const gap = 64, W = Math.max(n * gap + 40, 260), H = spec.segments ? 190 : 170;
    const top = spec.segments ? 52 : 34, bottom = H - 34;
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "anim-svg" }, stage);
    const x0 = (W - (n - 1) * gap) / 2;
    const charX = (p) => x0 + p * gap;
    const qubitX = (q) => x0 + q * gap;
    const highlight = new Set(spec.highlight || []);

    if (spec.segments) {
      for (const seg of spec.segments) {
        const a = charX(seg.from) - 20, b = charX(seg.to) + 20;
        s("path", { d: `M${a} 30 v-6 H${b} v6`, class: "seg" }, svg);
        stext(svg, (a + b) / 2, 16, seg.label, { class: "seg-label", "text-anchor": "middle" });
      }
    }
    const chars = [], links = [], targets = [];
    for (let p = 0; p < n; p++) {
      const q = n - 1 - p;
      const g = s("g", { class: "ord-char" + (highlight.has(q) ? " hl" : "") }, svg);
      s("rect", { x: charX(p) - 20, y: top - 20, width: 40, height: 40, rx: 6 }, g);
      stext(g, charX(p), top + 6, text[p], { "text-anchor": "middle", class: "big" });
      stext(g, charX(p), top + 34, `[${p}]`, { "text-anchor": "middle", class: "tiny" });
      chars[q] = g;
    }
    for (let q = 0; q < n; q++) {
      const g = s("g", { class: "ord-target" }, svg);
      s("rect", { x: qubitX(q) - 28, y: bottom - 14, width: 56, height: 28, rx: 14 }, g);
      stext(g, qubitX(q), bottom + 5, (spec.targets && spec.targets[q]) || `qubit ${q}`, { "text-anchor": "middle", class: "small" });
      targets[q] = g;
      const p = n - 1 - q;
      const path = s("path", {
        d: `M${charX(p)} ${top + 40} C${charX(p)} ${(top + bottom) / 2}, ${qubitX(q)} ${(top + bottom) / 2}, ${qubitX(q)} ${bottom - 16}`,
        class: "ord-link", pathLength: 1,
      }, svg);
      links[q] = path;
    }
    return {
      frames: n + 1,
      delay: 1900,
      show(i) {
        for (let q = 0; q < n; q++) {
          const on = q < i, cur = q === i - 1;
          links[q].classList.toggle("on", on);
          links[q].classList.toggle("cur", cur);
          chars[q].classList.toggle("cur", cur);
          targets[q].classList.toggle("on", on);
          targets[q].classList.toggle("cur", cur);
        }
      },
    };
  };

  // ---------- circuit: diagram + live state ----------
  const GATE_LABEL = { h: "H", x: "X", y: "Y", z: "Z", s: "S", sdg: "S†", t: "T", sx: "√X", rx: "RX", ry: "RY", rz: "RZ" };

  function gateQubits(g, n) {
    switch (g[0]) {
      case "cx": case "cz": case "swap": return [g[1], g[2]];
      case "ccx": return [g[1], g[2], g[3]];
      case "measure": return [g[1]];
      case "if": return gateQubits(g[3], n);
      case "barrier": return Array.from({ length: n }, (_, k) => k);
      default: return [g[1]];
    }
  }

  SCENES.circuit = function (stage, spec) {
    const n = spec.n;
    const ncl = spec.clbits || 0;
    const gates = spec.gates;
    const views = [].concat(spec.view || "amps");

    // Drawing columns: a gate sits in the first column free on every wire it spans.
    const clWire = n;
    const level = new Array(n + 1).fill(0);
    const cols = gates.map((g) => {
      const qs = gateQubits(g, n);
      let lo = Math.min(...qs), hi = Math.max(...qs);
      if (g[0] === "measure" || g[0] === "if") hi = clWire;
      const span = [];
      for (let w = lo; w <= hi; w++) span.push(w);
      const c = Math.max(...span.map((w) => level[w]));
      span.forEach((w) => (level[w] = c + 1));
      return c;
    });
    const ncols = Math.max(1, ...level);

    // Which gates each frame applies.
    let groups;
    if (spec.groups) groups = spec.groups;
    else if (spec.byLayer) {
      const dl = new Array(n + ncl).fill(0);
      const layerOf = gates.map((g) => {
        const ws = gateQubits(g, n);
        const L = Math.max(...ws.map((w) => dl[w])) + 1;
        ws.forEach((w) => (dl[w] = L));
        return L;
      });
      groups = [];
      layerOf.forEach((L, gi) => (groups[L - 1] = (groups[L - 1] || []).concat(gi)));
    } else groups = gates.map((_, gi) => [gi]);

    // Simulate once per build (measurements are random, so Replay gives a new shot).
    const st = { a: Array.from({ length: 1 << n }, (_, k) => (k === 0 ? [1, 0] : [0, 0])), cl: new Array(ncl).fill(0), ran: null };
    const dl = new Array(n + ncl).fill(0);
    let size = 0;
    const params = new Set();
    const snap = (rot) => ({
      a: st.a.map((v) => v.slice()),
      cl: st.cl.slice(),
      ran: st.ran,
      depth: Math.max(0, ...dl),
      size,
      params: params.size,
      rot,
      bloch: Array.from({ length: n }, (_, q) => blochOf(st.a, n, q)),
    });
    const frames = [snap(null)];
    for (const grp of groups) {
      const rot = {};
      let allRot = true;
      for (const gi of grp) {
        const g = gates[gi];
        applyGate(g, st);
        if (g[0] !== "barrier") {
          size++;
          const ws = gateQubits(g, n).concat(g[0] === "measure" ? [n + g[2]] : g[0] === "if" ? [n + g[1]] : []);
          const L = Math.max(...ws.map((w) => dl[w])) + 1;
          ws.forEach((w) => (dl[w] = L));
        }
        if (g[2] === null && g[3]) params.add(g[3]);
        const r = rotationOf(g);
        if (r && !(g[1] in rot)) rot[g[1]] = r;
        else allRot = false;
      }
      frames.push(snap(allRot ? rot : null));
    }

    // ----- diagram -----
    const colW = 58, rowH = 48, x0 = 52, y0 = 30;
    const wrap = h("div", "circ-wrap", stage);
    let svg, gateEls;

    function drawDiagram(flipped) {
      if (svg) svg.remove();
      const W = x0 + ncols * colW + 16;
      const H = y0 + (n - 1) * rowH + (ncl ? rowH : 0) + 30;
      svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "anim-svg circ" + (flipped ? " flip-in" : "") }, wrap);
      svg.style.maxWidth = W * 1.25 + "px";
      const wy = (q) => y0 + (flipped ? n - 1 - q : q) * rowH;
      const cy = y0 + n * rowH - 8;
      for (let q = 0; q < n; q++) {
        s("line", { x1: x0 - 8, x2: W - 8, y1: wy(q), y2: wy(q), class: "wire" }, svg);
        stext(svg, 8, wy(q) + 5, `q${q}`, { class: "small" });
      }
      if (ncl) {
        s("line", { x1: x0 - 8, x2: W - 8, y1: cy - 2, y2: cy - 2, class: "cwire" }, svg);
        s("line", { x1: x0 - 8, x2: W - 8, y1: cy + 2, y2: cy + 2, class: "cwire" }, svg);
        stext(svg, 8, cy + 5, "c", { class: "small" });
      }
      gateEls = gates.map((g, gi) => {
        const x = x0 + cols[gi] * colW + colW / 2;
        const grp = s("g", { class: "gate" }, svg);
        drawGate(grp, g, x, wy, cy);
        return grp;
      });
    }

    function box(grp, x, y, label, sub) {
      s("rect", { x: x - 18, y: y - 18, width: 36, height: 36, rx: 5, class: "gbox" }, grp);
      stext(grp, x, sub ? y + 1 : y + 5, label, { "text-anchor": "middle", class: sub ? "glabel sm" : "glabel" });
      if (sub) stext(grp, x, y + 13, sub, { "text-anchor": "middle", class: "gparam" });
    }
    function ctrl(grp, x, y) { s("circle", { cx: x, cy: y, r: 4.5, class: "gdot" }, grp); }
    function targ(grp, x, y) {
      s("circle", { cx: x, cy: y, r: 11, class: "gtarg" }, grp);
      s("line", { x1: x - 11, x2: x + 11, y1: y, y2: y, class: "gline" }, grp);
      s("line", { x1: x, x2: x, y1: y - 11, y2: y + 11, class: "gline" }, grp);
    }
    function drawGate(grp, g, x, wy, cy) {
      const name = g[0];
      if (name === "barrier") {
        s("line", { x1: x, x2: x, y1: wy(0) - 20, y2: wy(n - 1) + 20, class: "gbarrier" }, grp);
        return;
      }
      if (name === "cx" || name === "cz" || name === "ccx" || name === "swap") {
        const qs = gateQubits(g, n);
        const ys = qs.map(wy);
        s("line", { x1: x, x2: x, y1: Math.min(...ys), y2: Math.max(...ys), class: "gline" }, grp);
        if (name === "cx") { ctrl(grp, x, wy(g[1])); targ(grp, x, wy(g[2])); }
        if (name === "cz") { ctrl(grp, x, wy(g[1])); ctrl(grp, x, wy(g[2])); }
        if (name === "ccx") { ctrl(grp, x, wy(g[1])); ctrl(grp, x, wy(g[2])); targ(grp, x, wy(g[3])); }
        if (name === "swap") {
          for (const y of ys) {
            s("line", { x1: x - 7, x2: x + 7, y1: y - 7, y2: y + 7, class: "gline" }, grp);
            s("line", { x1: x - 7, x2: x + 7, y1: y + 7, y2: y - 7, class: "gline" }, grp);
          }
        }
        return;
      }
      if (name === "measure") {
        const y = wy(g[1]);
        s("line", { x1: x - 2, x2: x - 2, y1: y + 18, y2: cy - 6, class: "cwire" }, grp);
        s("line", { x1: x + 2, x2: x + 2, y1: y + 18, y2: cy - 6, class: "cwire" }, grp);
        s("path", { d: `M${x - 5} ${cy - 9} L${x} ${cy - 2} L${x + 5} ${cy - 9}`, class: "gline" }, grp);
        s("rect", { x: x - 18, y: y - 18, width: 36, height: 36, rx: 5, class: "gbox" }, grp);
        s("path", { d: `M${x - 11} ${y + 6} A12 12 0 0 1 ${x + 11} ${y + 6}`, class: "gline" }, grp);
        s("line", { x1: x, x2: x + 8, y1: y + 6, y2: y - 8, class: "gline" }, grp);
        stext(grp, x + 9, cy + 16, String(g[2]), { class: "tiny" });
        return;
      }
      if (name === "if") {
        const inner = g[3];
        const y = wy(inner[1]);
        s("rect", { x: x - 25, y: y - 26, width: 50, height: 52, rx: 6, class: "gif" }, grp);
        stext(grp, x, y - 30, `if c[${g[1]}]==${g[2]}`, { "text-anchor": "middle", class: "tiny" });
        s("line", { x1: x, x2: x, y1: y + 26, y2: cy - 2, class: "gifline" }, grp);
        drawGate(grp, inner, x, wy, cy);
        return;
      }
      const sub = g[3] || null;
      box(grp, x, wy(g[1]), GATE_LABEL[name] || name.toUpperCase(), sub);
    }

    drawDiagram(false);

    // ----- live panels -----
    const panels = h("div", "circ-panels", stage);
    const counters = h("div", "circ-counters", stage);
    let ampEls = null, blochEls = null, expEls = null;

    if (views.includes("amps")) {
      const p = h("div", "amps", panels);
      ampEls = [];
      for (let k = 0; k < 1 << n; k++) {
        const col = h("div", "amp", p);
        const pct = h("span", "amp-pct", col);
        const track = h("div", "amp-track", col);
        const fill = h("div", "amp-fill", track);
        const dial = s("svg", { viewBox: "-12 -12 24 24", class: "amp-dial" }, col);
        s("circle", { r: 10, class: "dial-ring" }, dial);
        const hand = s("line", { x1: 0, y1: 0, x2: 9, y2: 0, class: "dial-hand" }, dial);
        const val = h("span", "amp-val", col);
        h("span", "amp-label", col, k.toString(2).padStart(n, "0"));
        ampEls.push({ pct, fill, hand, val, dial });
      }
    }
    if (views.includes("bloch")) {
      const p = h("div", "blochs", panels);
      blochEls = [];
      for (let q = 0; q < n; q++) blochEls.push(makeBloch(p, n > 1 ? `qubit ${q}` : ""));
    }
    if (views.includes("expect")) {
      const p = h("div", "expects", panels);
      expEls = (spec.observables || []).map((ob) => {
        const row = h("div", "exp-row", p);
        h("code", "exp-label", row, esc(ob));
        const track = h("div", "exp-track", row);
        h("span", "exp-zero", track);
        const fill = h("div", "exp-fill", track);
        const val = h("span", "exp-val", row);
        return { ob, fill, val };
      });
    }

    let shownBloch = frames[0].bloch.map((v) => v.slice());
    let raf = null, settle = null;

    function setAmps(f) {
      f.a.forEach((amp, k) => {
        const e = ampEls[k];
        const p = abs2(amp);
        e.fill.style.height = `${p * 100}%`;
        e.pct.textContent = p > 0.0005 ? `${Math.round(p * 100)}%` : "";
        const ang = Math.atan2(amp[1], amp[0]);
        e.hand.style.transform = `rotate(${(-ang * 180) / PI}deg)`;
        e.dial.style.opacity = p > 0.0005 ? 1 : 0.15;
        const re = amp[0], im = amp[1];
        e.val.textContent = p < 0.0005 ? "0" :
          Math.abs(im) < 0.005 ? fmt(re) :
          Math.abs(re) < 0.005 ? fmt(im) + "i" :
          `${fmt(re)}${im < 0 ? "−" : "+"}${Math.abs(im).toFixed(2)}i`;
        const neg = Math.abs(ang) > 2.4;
        e.fill.classList.toggle("neg", neg);
        e.fill.classList.toggle("imag", !neg && Math.abs(ang) > 0.3);
      });
    }

    function animateBloch(from, f, animate) {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      const to = f.bloch;
      shownBloch = to.map((v) => v.slice());
      if (!animate) {
        blochEls.forEach((b, q) => { b.set(to[q]); b.trail([]); });
        return;
      }
      const t0 = performance.now(), dur = 1100;
      const trails = to.map(() => []);
      const step = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        blochEls.forEach((b, q) => {
          let v;
          if (f.rot && f.rot[q]) {
            v = rotate(from[q], f.rot[q][0], f.rot[q][1] * e);
            trails[q].push(v);
            b.trail(trails[q]);
          } else {
            v = from[q].map((x, j) => x + (to[q][j] - x) * e);
          }
          b.set(v);
        });
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      // Browsers pause rAF in background tabs; make sure the arrow still lands.
      clearTimeout(settle);
      settle = setTimeout(() => {
        cancelAnimationFrame(raf);
        blochEls.forEach((b, q) => b.set(to[q]));
      }, dur + 100);
    }

    let prevIndex = 0;
    return {
      frames: spec.flip ? 2 : frames.length,
      delay: 2400,
      note(i) {
        const raw = (spec.notes && spec.notes[i]) || "";
        const f = frames[Math.min(i, frames.length - 1)];
        return raw
          .replace(/\{c(\d)\}/g, (_, k) => String(f.cl[+k]))
          .replace("{ran}", f.ran ? "fired" : "was skipped");
      },
      show(i, animate) {
        if (spec.flip) {
          drawDiagram(i === 1);
          gateEls.forEach((g) => g.setAttribute("class", "gate done"));
          return;
        }
        const f = frames[i];
        const applied = new Set();
        for (let k = 0; k < i; k++) groups[k].forEach((gi) => applied.add(gi));
        const current = new Set(i > 0 ? groups[i - 1] : []);
        gateEls.forEach((el, gi) => {
          el.setAttribute("class", "gate " + (current.has(gi) ? "cur" : applied.has(gi) ? "done" : "todo"));
        });
        if (ampEls) setAmps(f);
        if (blochEls) animateBloch(shownBloch, f, animate && i === prevIndex + 1);
        if (expEls) {
          let energy = 0;
          expEls.forEach((e, k) => {
            const v = expectation(f.a, n, e.ob);
            const w = spec.weights ? spec.weights[k] : 1;
            energy += w * v;
            e.fill.style.left = v >= 0 ? "50%" : `${50 + v * 50}%`;
            e.fill.style.width = `${Math.abs(v) * 50}%`;
            e.fill.classList.toggle("neg", v < -0.005);
            e.val.textContent = fmt(v);
          });
        }
        const bits = [];
        if (spec.counts) bits.push(`<span>depth <b>${f.depth}</b></span><span>size <b>${f.size}</b></span>`);
        if (views.includes("params")) bits.push(`<span>parameters <b>${f.params}</b></span>`);
        if (ncl) bits.push(f.cl.map((v, k) => `<span>c[${k}] = <b>${i > 0 && gates.some((g, gi) => applied.has(gi) && g[0] === "measure" && g[2] === k) ? v : "–"}</b></span>`).join(""));
        counters.innerHTML = bits.join("");
        counters.hidden = !bits.length;
        prevIndex = i;
      },
    };
  };

  function makeBloch(parent, label) {
    const wrap = h("div", "bloch", parent);
    const R = 62, cx = 86, cy = 82;
    const svg = s("svg", { viewBox: "0 0 172 170", class: "anim-svg" }, wrap);
    s("circle", { cx, cy, r: R, class: "b-sphere" }, svg);
    // Equator, split into the front (solid) and back (dashed) halves. A new
    // subpath starts whenever the curve crosses from one half to the other.
    const eq = { front: "", back: "" };
    let side = null;
    for (let k = 0; k <= 72; k++) {
      const t = (k / 72) * 2 * PI;
      const v = [Math.cos(t), Math.sin(t), 0];
      const [x, y] = proj(v, cx, cy, R);
      const now = dot(v, VIEW.c) >= 0 ? "front" : "back";
      eq[now] += (now === side ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      side = now;
    }
    s("path", { d: eq.back, class: "b-eq back" }, svg);
    s("path", { d: eq.front, class: "b-eq" }, svg);
    const axes = [[[0, 0, 1], "|0⟩"], [[0, 0, -1], "|1⟩"], [[1, 0, 0], "|+⟩"], [[0, 1, 0], "|+i⟩"]];
    for (const [v, lab] of axes) {
      const [x1, y1] = proj(v.map((c) => -c), cx, cy, R);
      const [x2, y2] = proj(v, cx, cy, R);
      if (lab !== "|1⟩") s("line", { x1, y1, x2, y2, class: "b-axis" }, svg);
      const [lx, ly] = proj(v.map((c) => c * 1.2), cx, cy, R);
      stext(svg, lx, ly + 4, lab, { "text-anchor": "middle", class: "tiny b-lab" });
    }
    const trail = s("polyline", { points: "", class: "b-trail" }, svg);
    const arrow = s("line", { x1: cx, y1: cy, x2: cx, y2: cy - R, class: "b-arrow" }, svg);
    const tip = s("circle", { cx, cy: cy - R, r: 5, class: "b-tip" }, svg);
    s("circle", { cx, cy, r: 2.5, class: "b-center" }, svg);
    const read = h("div", "b-read", wrap);
    if (label) h("div", "b-name", wrap, label);
    return {
      set(v) {
        const [x, y] = proj(v, cx, cy, R);
        arrow.setAttribute("x2", x);
        arrow.setAttribute("y2", y);
        tip.setAttribute("cx", x);
        tip.setAttribute("cy", y);
        const len = Math.hypot(v[0], v[1], v[2]);
        tip.style.opacity = len < 0.05 ? 0 : 1;
        read.innerHTML = `<span>⟨X⟩ ${fmt(v[0])}</span><span>⟨Y⟩ ${fmt(v[1])}</span><span>⟨Z⟩ ${fmt(v[2])}</span>`;
      },
      trail(pts) {
        trail.setAttribute("points", pts.map((v) => proj(v, cx, cy, R).map((c) => c.toFixed(1)).join(",")).join(" "));
      },
    };
  }

  // ---------- steps: boxes that appear one at a time ----------
  SCENES.steps = function (stage, spec) {
    const layout = spec.layout || "row";
    const list = h("div", "steps steps-" + layout, stage);
    const els = spec.items.map((it, k) => {
      if (layout === "row" && k > 0) h("span", "step-arrow", list, "→");
      const e = h("div", "step" + (it.mark ? " " + it.mark : ""), list);
      if (it.k) h("span", "step-k", e, inline(it.k));
      h("span", "step-t", e, inline(it.t));
      if (it.s) h("span", "step-s", e, inline(it.s));
      if (it.mark === "ok") h("span", "step-mark", e, "✓");
      if (it.mark === "bad") h("span", "step-mark", e, "✗");
      return e;
    });
    const arrows = list.querySelectorAll(".step-arrow");
    return {
      frames: els.length,
      delay: 2000,
      show(i) {
        els.forEach((e, k) => {
          e.classList.toggle("in", k <= i);
          e.classList.toggle("cur", k === i);
        });
        arrows.forEach((a, k) => a.classList.toggle("in", k < i));
      },
    };
  };

  // ---------- map: virtual items linked onto a device or another circuit ----------
  SCENES.map = function (stage, spec) {
    const L = spec.left, Rt = spec.right;
    const grid = !!Rt.cols;
    const count = grid ? Rt.count : Rt.items.length;
    const cols = grid ? Rt.cols : 1;
    const rows = Math.ceil(count / cols);
    const leftW = 120, gapX = 90;
    const cell = grid ? 34 : 0;
    const rightX = leftW + gapX;
    const W = grid ? rightX + cols * cell + 10 : rightX + 120;
    const leftH = L.items.length * 40;
    const rightH = grid ? rows * cell : Rt.items.length * 40;
    const H = Math.max(leftH, rightH) + 46;
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "anim-svg map" }, stage);
    svg.style.maxWidth = W * 1.3 + "px";
    stext(svg, 10, 16, L.title, { class: "small strong" });
    stext(svg, rightX, 16, Rt.title, { class: "small strong" });
    const lTop = 34 + (Math.max(leftH, rightH) - leftH) / 2;
    const leftPos = L.items.map((_, k) => [leftW, lTop + k * 40 + 14]);
    L.items.forEach((lab, k) => {
      s("rect", { x: 10, y: lTop + k * 40, width: leftW - 10, height: 28, rx: 6, class: "map-l" }, svg);
      stext(svg, 10 + (leftW - 10) / 2, lTop + k * 40 + 19, lab, { "text-anchor": "middle", class: "small" });
    });
    const nodes = [], rightPos = [];
    const rTop = 34 + (Math.max(leftH, rightH) - rightH) / 2;
    if (grid) {
      for (let k = 0; k < count; k++) {
        const c = k % cols, r = Math.floor(k / cols);
        const x = rightX + c * cell + cell / 2, y = rTop + r * cell + cell / 2;
        rightPos.push([x, y]);
        if (c > 0) s("line", { x1: x - cell, y1: y, x2: x, y2: y, class: "map-edge" }, svg);
        if (r > 0 && (c % 4 === (r % 2 ? 2 : 0))) s("line", { x1: x, y1: y - cell, x2: x, y2: y, class: "map-edge" }, svg);
      }
      rightPos.forEach(([x, y], k) => {
        const g = s("g", { class: "map-node" }, svg);
        s("circle", { cx: x, cy: y, r: 11 }, g);
        stext(g, x, y + 3.5, String(k), { "text-anchor": "middle", class: "tiny" });
        nodes.push(g);
      });
    } else {
      Rt.items.forEach((lab, k) => {
        const y = rTop + k * 40;
        const g = s("g", { class: "map-node box" }, svg);
        s("rect", { x: rightX, y, width: 110, height: 28, rx: 6 }, g);
        stext(g, rightX + 55, y + 19, lab, { "text-anchor": "middle", class: "small" });
        rightPos.push([rightX, y + 14]);
        nodes.push(g);
      });
    }
    const links = spec.links.map((ln) => {
      const [x1, y1] = leftPos[ln.from];
      let [x2, y2] = rightPos[ln.to];
      if (grid) x2 -= 11;
      const mx = (x1 + x2) / 2;
      const p = s("path", { d: `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, class: "map-link" + (ln.bad ? " bad" : ""), pathLength: 1 }, svg);
      return { p, ln };
    });
    return {
      frames: links.length + 1,
      delay: 2000,
      note(i) {
        if (spec.notes && spec.notes[i]) return spec.notes[i];
        if (i === 0) return "";
        const ln = spec.links[i - 1];
        return `${L.items[ln.from]} → ${grid ? "physical qubit " + ln.to : Rt.items[ln.to]}`;
      },
      show(i) {
        nodes.forEach((nd) => nd.classList.remove("on", "bad"));
        links.forEach(({ p, ln }, k) => {
          const on = k < i;
          p.classList.toggle("on", on);
          p.classList.toggle("cur", k === i - 1);
          if (on) nodes[ln.to].classList.add(ln.bad ? "bad" : "on");
        });
      },
    };
  };

  // ---------- bars: histograms, error rates, live sampling ----------
  SCENES.bars = function (stage, spec) {
    const series = spec.series || [];
    const labels = orderedKeys(spec.sample ? spec.sample.probs : series[0].data);
    const format = (v) =>
      spec.format === "pct" ? (v * 100).toFixed(1) + "%" :
      spec.format === "fixed2" ? v.toFixed(2) : String(Math.round(v));

    // Live sampling: precompute cumulative counts per batch.
    let batches = null;
    if (spec.sample) {
      const { probs, shots } = spec.sample;
      const nb = spec.sample.batches || 8;
      const counts = Object.fromEntries(labels.map((l) => [l, 0]));
      batches = [Object.assign({}, counts)];
      for (let b = 1; b <= nb; b++) {
        const target = Math.round((shots * b) / nb), prev = Math.round((shots * (b - 1)) / nb);
        for (let k = prev; k < target; k++) {
          let r = Math.random(), acc = 0;
          for (const l of labels) { acc += probs[l]; if (r < acc) { counts[l]++; break; } }
        }
        batches.push(Object.assign({}, counts));
      }
    }
    const max = spec.max || (spec.sample
      ? spec.sample.shots * Math.max(...Object.values(spec.sample.probs)) * 1.15
      : Math.max(...series.flatMap((sr) => labels.map((l) => sr.data[l] + ((spec.err && spec.err[l]) || 0)))) * 1.1);

    const chart = h("div", "bars", stage);
    const groups = labels.map((l) => {
      const g = h("div", "bar-group", chart);
      const cols = h("div", "bar-cols", g);
      const bars = (spec.sample ? [{ name: "" }] : series).map((sr, k) => {
        const col = h("div", "bar-col s" + k, cols);
        const val = h("span", "bar-val", col);
        const fill = h("div", "bar-fill", col);
        let whisk = null;
        if (spec.err) whisk = h("div", "bar-err", col);
        return { col, val, fill, whisk };
      });
      h("span", "bar-label", g, esc(l));
      return { l, g, bars };
    });
    if (series.length > 1) {
      const leg = h("div", "bar-legend", stage);
      series.forEach((sr, k) => h("span", "", leg, `<i class="sw s${k}"></i>${esc(sr.name)}`));
    }
    const total = spec.sample ? h("div", "bar-total", stage) : null;
    const hl = new Set(spec.highlight || []);
    const frames = spec.sample ? batches.length : hl.size ? 3 : 2;

    return {
      frames,
      delay: spec.sample ? 1100 : 2200,
      note(i) {
        const raw = spec.notes || [];
        if (spec.sample) {
          const shots = Object.values(batches[i]).reduce((a, b) => a + b, 0);
          const txt = i === 0 ? raw[0] : i === frames - 1 ? raw[raw.length - 1] : (spec.noteMid || "{shots} shots so far.");
          return (txt || "").replace("{shots}", shots);
        }
        return raw[i] || "";
      },
      show(i) {
        groups.forEach(({ l, g, bars }) => {
          bars.forEach((b, k) => {
            const v = spec.sample ? batches[i][l] : i === 0 ? 0 : series[k].data[l];
            b.fill.style.height = `${(v / max) * 100}%`;
            b.val.textContent = i === 0 && !spec.sample ? "" : format(v);
            if (b.whisk) {
              const e = i === 0 ? 0 : spec.err[l];
              b.whisk.style.bottom = `${((v - e) / max) * 100}%`;
              b.whisk.style.height = `${((2 * e) / max) * 100}%`;
              b.whisk.style.opacity = i === 0 ? 0 : 1;
            }
          });
          g.classList.toggle("hl", hl.has(l) && i >= frames - 1 && !spec.sample);
          g.classList.toggle("dim", hl.size > 0 && !hl.has(l) && i >= frames - 1 && !spec.sample);
        });
        if (total) total.textContent = `shots: ${Object.values(batches[i]).reduce((a, b) => a + b, 0)} / ${spec.sample.shots}`;
      },
    };
  };

  // ---------- timeline: jobs on a QPU clock ----------
  SCENES.timeline = function (stage, spec) {
    const T = spec.total;
    const box = h("div", "tl", stage);
    const lanes = spec.lanes.map((ln) => {
      const row = h("div", "tl-row", box);
      h("span", "tl-name", row, esc(ln.name));
      const track = h("div", "tl-track", row);
      const blocks = ln.blocks.map((b) => {
        const e = h("div", "tl-block " + b.k, track);
        e.style.left = `${(b.s / T) * 100}%`;
        return { e, b };
      });
      const cursor = h("div", "tl-cursor", track);
      return { blocks, cursor };
    });
    const leg = h("div", "tl-legend", stage);
    for (const [k, lab] of Object.entries(spec.legend || {})) h("span", "", leg, `<i class="tl-sw ${k}"></i>${esc(lab)}`);
    const F = (spec.notes || []).length || 6;
    return {
      frames: F,
      delay: 1900,
      show(i) {
        const t = (T * i) / (F - 1);
        lanes.forEach(({ blocks, cursor }) => {
          cursor.style.left = `${(t / T) * 100}%`;
          blocks.forEach(({ e, b }) => {
            e.style.width = `${(clamp(t - b.s, 0, b.l) / T) * 100}%`;
          });
        });
      },
    };
  };

  // ---------- matrix: a density matrix losing its coherences ----------
  SCENES.matrix = function (stage, spec) {
    const labs = spec.labels, n = labs.length;
    const grid = h("div", "mx", stage);
    grid.style.gridTemplateColumns = `auto repeat(${n}, 1fr)`;
    h("span", "", grid);
    labs.forEach((l) => h("span", "mx-head", grid, l));
    const cells = [];
    labs.forEach((l, r) => {
      h("span", "mx-head", grid, l);
      for (let c = 0; c < n; c++) {
        const cell = h("div", "mx-cell" + (r === c ? " diag" : ""), grid);
        const sq = h("div", "mx-sq", cell);
        cells.push({ r, c, sq, v: spec.values[r][c] });
      }
    });
    const decay = spec.decay || [1, 0.55, 0.15];
    const F = 1 + decay.length;
    const max = Math.max(...spec.values.flat().map(Math.abs));
    return {
      frames: F,
      delay: 2300,
      show(i) {
        cells.forEach(({ r, c, sq, v }) => {
          const f = i === 0 ? 0 : r === c ? 1 : decay[i - 1];
          const m = Math.abs(v * f) / max;
          sq.style.width = sq.style.height = `${Math.sqrt(m) * 100}%`;
          sq.classList.toggle("neg", v < 0);
          sq.title = (v * f).toFixed(2);
        });
      },
    };
  };

  // ---------- registers: what measure_all() adds ----------
  SCENES.registers = function (stage, spec) {
    const n = spec.qubits;
    const cregs = spec.cregs || [];
    const add = spec.add;
    const rowH = 36, y0 = 26, W = 420;
    const qY = (q) => y0 + q * rowH;
    const regY = (k) => y0 + n * rowH + 10 + k * 44;
    const H = regY(cregs.length + 1) + 6;
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "anim-svg regs" }, stage);
    svg.style.maxWidth = "560px";
    for (let q = 0; q < n; q++) {
      s("line", { x1: 44, x2: 300, y1: qY(q), y2: qY(q), class: "wire" }, svg);
      stext(svg, 10, qY(q) + 5, `q${q}`, { class: "small" });
      s("rect", { x: 70, y: qY(q) - 13, width: 26, height: 26, rx: 4, class: "gbox" }, svg);
      stext(svg, 83, qY(q) + 5, "…", { "text-anchor": "middle", class: "small" });
    }
    function reg(k, name, size, cls) {
      const g = s("g", { class: cls }, svg);
      const y = regY(k);
      s("line", { x1: 44, x2: 300, y1: y - 2, y2: y - 2, class: "cwire" }, g);
      s("line", { x1: 44, x2: 300, y1: y + 2, y2: y + 2, class: "cwire" }, g);
      stext(g, 10, y + 5, name, { class: "small strong" });
      const cells = [];
      for (let b = 0; b < size; b++) {
        const cg = s("g", { class: "bitcell" }, g);
        s("rect", { x: 316 + b * 30, y: y - 13, width: 26, height: 26, rx: 4 }, cg);
        cells.push(stext(cg, 329 + b * 30, y + 5, "0", { "text-anchor": "middle", class: "small" }));
      }
      return { g, cells };
    }
    const existing = cregs.map((c, k) => reg(k, c.name, c.size, "reg old"));
    const barrier = s("line", { x1: 130, x2: 130, y1: qY(0) - 16, y2: qY(n - 1) + 16, class: "gbarrier reg-barrier" }, svg);
    const added = reg(cregs.length, add.name, add.size, "reg new");
    const meas = s("g", { class: "reg-meas" }, svg);
    for (let q = 0; q < n; q++) {
      const x = 170 + q * 40, y = qY(q), cy = regY(cregs.length);
      s("line", { x1: x, x2: x, y1: y + 13, y2: cy - 6, class: "cwire" }, meas);
      s("rect", { x: x - 13, y: y - 13, width: 26, height: 26, rx: 4, class: "gbox" }, meas);
      stext(meas, x, y + 5, "M", { "text-anchor": "middle", class: "small" });
    }
    const total = cregs.reduce((a, c) => a + c.size, 0) + add.size;
    const counter = h("div", "circ-counters", stage);
    return {
      frames: 5,
      delay: 2100,
      show(i) {
        barrier.classList.toggle("in", i >= 1);
        added.g.classList.toggle("in", i >= 2);
        meas.classList.toggle("in", i >= 3);
        added.cells.forEach((c) => (c.textContent = i >= 3 ? "?" : "0"));
        existing.forEach((r) => r.g.classList.toggle("stale", i >= 4));
        counter.innerHTML = i >= 4
          ? `<span>num_clbits <b>${total}</b></span>` + cregs.map((c) => `<span>${c.name}: never written</span>`).join("")
          : `<span>num_clbits <b>${cregs.reduce((a, c) => a + c.size, 0) + (i >= 2 ? add.size : 0)}</b></span>`;
      },
    };
  };

  // ---------- cancel: X·X with and without a barrier ----------
  SCENES.cancel = function (stage) {
    const svg = s("svg", { viewBox: "0 0 500 170", class: "anim-svg cancel" }, stage);
    svg.style.maxWidth = "620px";
    const lane = (y, title, withBarrier) => {
      stext(svg, 10, y - 24, title, { class: "small strong" });
      s("line", { x1: 30, x2: 300, y1: y, y2: y, class: "wire" }, svg);
      stext(svg, 8, y + 5, "q0", { class: "small" });
      if (withBarrier) s("line", { x1: 165, x2: 165, y1: y - 22, y2: y + 22, class: "gbarrier in" }, svg);
      const mkX = (x) => {
        const g = s("g", { class: "cx-gate" }, svg);
        g.style.transformOrigin = `${x}px ${y}px`;
        s("rect", { x: x - 16, y: y - 16, width: 32, height: 32, rx: 5, class: "gbox" }, g);
        stext(g, x, y + 5, "X", { "text-anchor": "middle", class: "glabel" });
        return g;
      };
      const out = stext(svg, 316, y + 5, "", { class: "small mono" });
      return { a: mkX(90), b: mkX(240), out };
    };
    const A = lane(50, "No barrier", false);
    const B = lane(135, "With a barrier", true);
    return {
      frames: 3,
      delay: 2200,
      show(i) {
        A.a.style.transform = i >= 1 ? "translateX(57px)" : "";
        A.b.style.transform = i >= 1 ? "translateX(-56px)" : "";
        A.a.style.opacity = A.b.style.opacity = i >= 2 ? 0 : 1;
        B.a.style.transform = i >= 1 ? "translateX(53px)" : "";
        B.b.style.transform = i >= 1 ? "translateX(-53px)" : "";
        A.out.textContent = i >= 2 ? "{}" : "";
        B.out.textContent = i >= 2 ? "{'x': 2, 'barrier': 1}" : "";
      },
    };
  };

  // ---------- shape: PUB broadcasting ----------
  SCENES.shape = function (stage, spec) {
    const row = h("div", "shp-row", stage);
    const mkGrid = (parent, g, cls) => {
      const w = h("div", "shp " + (cls || ""), parent);
      h("span", "shp-label", w, esc(g.label));
      const grid = h("div", "shp-grid", w);
      grid.style.gridTemplateColumns = `repeat(${g.cols}, 1fr)`;
      grid.style.maxWidth = `${g.cols * 18}px`;
      const cells = [];
      for (let k = 0; k < g.rows * g.cols; k++) {
        const c = h("span", "shp-cell", grid);
        c.style.transitionDelay = `${(k % g.cols) * 25 + Math.floor(k / g.cols) * 120}ms`;
        cells.push(c);
      }
      h("span", "shp-cap", w, inline(g.caption));
      return { w, cells };
    };
    spec.inputs.forEach((g, k) => {
      if (k) h("span", "shp-op", row, "×");
      mkGrid(row, g, "in");
    });
    const arrow = h("span", "shp-op shp-arrow", row, "→");
    const out = mkGrid(row, spec.output, "out");
    return {
      frames: 3,
      delay: 2300,
      show(i) {
        arrow.classList.toggle("in", i >= 1);
        out.w.classList.toggle("in", i >= 1);
        out.cells.forEach((c) => c.classList.toggle("on", i >= 2));
      },
    };
  };

  // ---------- curve: 1/sqrt(N) ----------
  SCENES.curve = function (stage, spec) {
    const W = 420, H = 200, L = 52, B = 160, T = 16, Rr = 400;
    const xmax = spec.xmax, ymax = spec.ymax;
    const X = (N) => L + (N / xmax) * (Rr - L);
    const Y = (sg) => B - (sg / ymax) * (B - T);
    const sig = (N) => spec.c / Math.sqrt(N);
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "anim-svg curve" }, stage);
    svg.style.maxWidth = "560px";
    s("line", { x1: L, x2: Rr, y1: B, y2: B, class: "axis" }, svg);
    s("line", { x1: L, x2: L, y1: T, y2: B, class: "axis" }, svg);
    stext(svg, (L + Rr) / 2, H - 8, "shots", { "text-anchor": "middle", class: "small" });
    stext(svg, 14, (T + B) / 2, "error", { class: "small", transform: `rotate(-90 14 ${(T + B) / 2})`, "text-anchor": "middle" });
    for (const tk of spec.xticks) {
      s("line", { x1: X(tk), x2: X(tk), y1: B, y2: B + 4, class: "axis" }, svg);
      stext(svg, X(tk), B + 16, tk.toLocaleString("en"), { "text-anchor": "middle", class: "tiny" });
    }
    for (const tk of spec.yticks) {
      s("line", { x1: L - 4, x2: L, y1: Y(tk), y2: Y(tk), class: "axis" }, svg);
      stext(svg, L - 7, Y(tk) + 3, tk.toFixed(2), { "text-anchor": "end", class: "tiny" });
    }
    let d = "";
    for (let N = spec.xmin; N <= xmax; N += (xmax - spec.xmin) / 120) d += (d ? "L" : "M") + X(N).toFixed(1) + " " + Y(sig(N)).toFixed(1);
    s("path", { d, class: "curve-line" }, svg);
    const guide = s("line", { class: "curve-guide" }, svg);
    const dotEl = s("circle", { r: 6, class: "curve-dot" }, svg);
    const label = stext(svg, 0, 0, "", { class: "small strong" });
    return {
      frames: spec.points.length,
      delay: 2300,
      show(i) {
        const N = spec.points[i], x = X(N), y = Y(sig(N));
        dotEl.setAttribute("cx", x); dotEl.setAttribute("cy", y);
        guide.setAttribute("x1", x); guide.setAttribute("x2", x);
        guide.setAttribute("y1", y); guide.setAttribute("y2", B);
        const leftSide = x > (L + Rr) / 2;
        label.setAttribute("x", leftSide ? x - 10 : x + 10);
        label.setAttribute("y", y - 12);
        label.setAttribute("text-anchor", leftSide ? "end" : "start");
        label.textContent = `N = ${N.toLocaleString("en")}, σ ≈ ${sig(N).toFixed(3)}`;
      },
    };
  };

  // ---------- stream: shots in order, then collapsed into counts ----------
  SCENES.stream = function (stage, spec) {
    const shots = spec.shots, chunk = spec.chunk || 8;
    const good = new Set(spec.good || []);
    const tape = h("div", "tape", stage);
    const chips = shots.map((b, k) => {
      const c = h("span", "chip-shot" + (good.has(b) ? "" : " err"), tape, `<i>${k + 1}</i>${esc(b)}`);
      return c;
    });
    const counts = h("div", "tape-counts", stage);
    const nChunks = Math.ceil(shots.length / chunk);
    const tally = {};
    shots.forEach((b) => (tally[b] = (tally[b] || 0) + 1));
    const countsText = "{" + orderedKeys(tally).map((b) => `'${b}': ${tally[b]}`).join(", ") + "}";
    return {
      frames: nChunks + 2,
      delay: 1900,
      show(i) {
        chips.forEach((c, k) => {
          c.classList.toggle("in", k < i * chunk);
          c.classList.toggle("faded", i === nChunks + 1);
        });
        counts.classList.toggle("in", i === nChunks + 1);
        counts.innerHTML = i === nChunks + 1
          ? "get_counts() → <code>" + esc(countsText) + "</code>"
          : "";
      },
    };
  };

  window.Anim = { mount };
})();
