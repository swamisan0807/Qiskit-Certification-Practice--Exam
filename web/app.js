(function () {
  "use strict";

  const QUESTIONS = window.QUESTIONS;
  const SECTIONS = window.SECTIONS;
  // v3: runs now store a shuffled option order, so older saves can't be resumed.
  const STORE_KEY = "qiskit-practice-exam:v3";
  const MINUTES_PER_QUESTION = 1.5; // 90 minutes for the full 60
  const PASS_MARK = 0.7;            // self-assessment line, not IBM's cut score
  const LETTERS = ["A", "B", "C", "D"];

  const $ = (id) => document.getElementById(id);
  let state = null;
  let timerId = null;

  // ---------- storage (best effort: private windows can throw) ----------
  // The in-progress run is kept per user, so two people sharing a browser
  // don't resume each other's exam.
  const storeKey = () => `${STORE_KEY}:${Auth.userId() || "anon"}`;
  function save() {
    try { localStorage.setItem(storeKey(), JSON.stringify(state)); } catch (_) {}
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(storeKey())); } catch (_) { return null; }
  }
  function clearSaved() {
    try { localStorage.removeItem(storeKey()); } catch (_) {}
  }

  // ---------- helpers ----------
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  // Questions use `backticks` for inline code; nothing fancier than that.
  function inline(text) {
    return escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>");
  }
  function sectionName(id) {
    return SECTIONS.find((s) => s.id === id).name;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function isCorrect(qi) {
    return state.answers[qi] === QUESTIONS[qi].answer;
  }
  // Answers are stored as the option's index in questions.js; `perm` says
  // which option sits at each on-screen position (A, B, C, D) in this attempt.
  function letterOf(qi, optionIndex) {
    return LETTERS[state.perm[qi].indexOf(optionIndex)];
  }
  function showView(name) {
    for (const v of ["auth", "start", "quiz", "results"]) $("view-" + v).hidden = v !== name;
    window.scrollTo(0, 0);
  }

  // ---------- start screen ----------
  function renderStart() {
    stopTimer();
    $("timer").hidden = true;

    $("start-summary").textContent =
      `${QUESTIONS.length} questions, ${Math.round(QUESTIONS.length * MINUTES_PER_QUESTION)} minutes`;
    $("welcome").textContent = `Welcome, ${Auth.displayName()}`;
    renderHistory();

    const saved = load();
    const resume = $("resume");
    if (saved && !saved.submitted && saved.order && saved.order.length) {
      const done = Object.keys(saved.answers).length;
      $("resume-text").textContent = `You have an unfinished exam: ${done} of ${saved.order.length} answered.`;
      resume.hidden = false;
    } else {
      resume.hidden = true;
    }

    state = null;
    showView("start");
  }

  // Every attempt gets a fresh question order and a fresh A–D order per question.
  function start(questionIndexes) {
    const order = shuffle(questionIndexes || QUESTIONS.map((_, i) => i));
    const perm = {};
    for (const qi of order) perm[qi] = shuffle(QUESTIONS[qi].options.map((_, i) => i));
    state = {
      order,
      perm,
      answers: {},
      flags: [],
      pos: 0,
      submitted: false,
      startedAt: Date.now(),
      deadline: Date.now() + order.length * MINUTES_PER_QUESTION * 60000,
    };
    save();
    enterQuiz();
  }

  function enterQuiz() {
    showView("quiz");
    startTimer();
    renderQuestion();
  }

  // ---------- timer ----------
  function startTimer() {
    stopTimer();
    $("timer").hidden = false;
    const tick = () => {
      const left = Math.max(0, state.deadline - Date.now());
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      $("timer").textContent = `${m}:${String(s).padStart(2, "0")}`;
      $("timer").classList.toggle("low", left < 5 * 60000);
      if (left === 0) submit(true);
    };
    tick();
    timerId = setInterval(tick, 1000);
  }
  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  // ---------- question view ----------
  function renderQuestion() {
    const qi = state.order[state.pos];
    const q = QUESTIONS[qi];
    const chosen = state.answers[qi];
    const flagged = state.flags.includes(qi);

    let html = `
      <div class="question-meta">
        <span class="tag"><strong>Question ${state.pos + 1}</strong> of ${state.order.length} · ${escapeHtml(sectionName(q.section))}</span>
        <button class="btn ghost small flag-btn" id="flag-btn" type="button" aria-pressed="${flagged}">${flagged ? "Flagged" : "Flag"}</button>
      </div>
      <p class="question-text">${inline(q.q)}</p>`;
    if (q.code) html += `<pre><code>${escapeHtml(q.code)}</code></pre>`;

    html += `<ul class="options">`;
    state.perm[qi].forEach((oi, pos) => {
      html += `<li><button class="option${oi === chosen ? " selected" : ""}" data-choice="${oi}" type="button">
        <span class="letter">${LETTERS[pos]}</span><span>${inline(q.options[oi])}</span></button></li>`;
    });
    html += `</ul>`;

    const last = state.pos === state.order.length - 1;
    html += `<div class="nav">
      <button class="btn ghost" id="prev-btn" type="button" ${state.pos === 0 ? "disabled" : ""}>Previous</button>
      ${last
        ? `<button class="btn" id="end-btn" type="button">Submit exam</button>`
        : `<button class="btn" id="next-btn" type="button">Next</button>`}
    </div>`;

    const card = $("question-card");
    card.innerHTML = html;
    card.querySelectorAll(".option").forEach((b) => (b.onclick = () => choose(Number(b.dataset.choice))));
    $("flag-btn").onclick = toggleFlag;
    $("prev-btn").onclick = () => go(state.pos - 1);
    if ($("next-btn")) $("next-btn").onclick = () => go(state.pos + 1);
    if ($("end-btn")) $("end-btn").onclick = () => submit(false);

    renderSidebar();
  }

  function renderSidebar() {
    const answered = Object.keys(state.answers).length;
    const total = state.order.length;
    $("progress-label").textContent = `${answered} / ${total} answered`;
    $("progress-bar").style.width = `${(answered / total) * 100}%`;

    const map = $("qmap");
    map.innerHTML = "";
    state.order.forEach((qi, pos) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = pos + 1;
      const classes = [];
      if (state.answers[qi] !== undefined) classes.push("answered");
      if (state.flags.includes(qi)) classes.push("flagged");
      if (pos === state.pos) classes.push("current");
      b.className = classes.join(" ");
      b.setAttribute("aria-label", `Question ${pos + 1}`);
      b.onclick = () => go(pos);
      map.appendChild(b);
    });
  }

  function choose(i) {
    state.answers[state.order[state.pos]] = i;
    save();
    renderQuestion();
  }

  function toggleFlag() {
    const qi = state.order[state.pos];
    const at = state.flags.indexOf(qi);
    at === -1 ? state.flags.push(qi) : state.flags.splice(at, 1);
    save();
    renderQuestion();
  }

  function go(pos) {
    if (pos < 0 || pos >= state.order.length) return;
    state.pos = pos;
    save();
    renderQuestion();
    if (window.innerWidth < 820) $("question-card").scrollIntoView({ block: "start" });
  }

  function submit(timeUp) {
    if (!timeUp) {
      const missing = state.order.length - Object.keys(state.answers).length;
      const flagged = state.flags.length;
      const parts = [];
      if (missing) parts.push(`${missing} unanswered`);
      if (flagged) parts.push(`${flagged} flagged`);
      if (parts.length && !confirm(`You still have ${parts.join(" and ")}. Submit anyway?`)) return;
    }
    stopTimer();
    state.submitted = true;
    state.timeUp = !!timeUp;
    save();
    renderResults();
    recordAttempt();
  }

  // ---------- saved results ----------
  async function recordAttempt() {
    const note = $("saved-note");
    if (Auth.isGuest()) {
      note.textContent = "You're not signed in, so this result isn't saved to an account.";
      note.hidden = false;
      return;
    }
    const sections = {};
    for (const s of SECTIONS) {
      const qs = state.order.filter((qi) => QUESTIONS[qi].section === s.id);
      if (qs.length) sections[s.id] = [qs.filter(isCorrect).length, qs.length];
    }
    note.textContent = "Saving your result…";
    note.hidden = false;
    const { saved } = await Auth.saveAttempt({
      score: state.order.filter(isCorrect).length,
      total: state.order.length,
      time_up: state.timeUp,
      duration_seconds: state.startedAt ? Math.round((Date.now() - state.startedAt) / 1000) : null,
      sections,
    });
    note.textContent = saved
      ? "✓ Saved to your account. You'll see it under Your recent attempts."
      : "Couldn't save this result to your account. Check your connection; your score above is still correct.";
  }

  async function renderHistory() {
    const box = $("history");
    if (Auth.isGuest()) { box.hidden = true; return; }
    const rows = await Auth.listAttempts(8);
    if (!rows.length) { box.hidden = true; return; }
    const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    const fmtTime = (s) => (s == null ? "–" : `${Math.floor(s / 60)} min ${s % 60} s`);
    $("history-list").innerHTML = `<table class="history-table">
      <thead><tr><th>Date</th><th>Score</th><th>Result</th><th>Time taken</th></tr></thead>
      <tbody>${rows.map((r) => {
        const pct = Math.round((r.score / r.total) * 100);
        return `<tr><td>${escapeHtml(fmtDate(r.created_at))}</td>
          <td>${r.score} / ${r.total} (${pct}%)</td>
          <td><span class="pill ${pct >= PASS_MARK * 100 ? "ok" : "weak"}">${pct >= PASS_MARK * 100 ? "Above 70%" : "Below 70%"}</span>${r.time_up ? ` <span class="pill">time ran out</span>` : ""}</td>
          <td>${fmtTime(r.duration_seconds)}</td></tr>`;
      }).join("")}</tbody></table>`;
    box.hidden = false;
  }

  // ---------- results ----------
  function renderResults() {
    $("timer").hidden = true;
    showView("results");

    const total = state.order.length;
    const right = state.order.filter(isCorrect).length;
    const pct = Math.round((right / total) * 100);

    $("result-mode").textContent = state.timeUp ? "Timed exam: time ran out" : "Timed exam";
    $("result-score").textContent = `${right} of ${total} correct (${pct}%)`;
    $("result-note").textContent = right / total >= PASS_MARK
      ? "That's above the 70% line we use as a rough benchmark. Check the weakest section below before you book the real exam."
      : "Below the 70% line we use as a rough benchmark. Work through the sections marked in red, then try again.";
    $("retry-wrong-btn").hidden = right === total;

    const breakdown = $("section-breakdown");
    breakdown.innerHTML = "";
    for (const s of SECTIONS) {
      const qs = state.order.filter((qi) => QUESTIONS[qi].section === s.id);
      if (!qs.length) continue;
      const ok = qs.filter(isCorrect).length;
      const ratio = ok / qs.length;
      const row = document.createElement("div");
      row.className = "sec-row";
      row.innerHTML = `<span>${s.id}. ${escapeHtml(s.name)}</span>
        <div class="bar"><span class="${ratio >= PASS_MARK ? "ok" : "weak"}" style="width:${ratio * 100}%"></span></div>
        <span class="num">${ok}/${qs.length}</span>`;
      breakdown.appendChild(row);
    }

    renderReview();
  }

  function renderReview() {
    const onlyWrong = $("only-wrong").checked;
    const list = $("review-list");
    list.innerHTML = "";
    const items = state.order.filter((qi) => !onlyWrong || !isCorrect(qi));
    if (!items.length) {
      list.innerHTML = `<p class="empty">Nothing to review. You got every one right.</p>`;
      return;
    }
    for (const qi of items) {
      const q = QUESTIONS[qi];
      const chosen = state.answers[qi];
      const pos = state.order.indexOf(qi) + 1;
      let html = `<div class="question-meta"><span class="tag"><strong>Question ${pos}</strong> · ${escapeHtml(sectionName(q.section))}</span>
        ${chosen === undefined ? `<span class="tag">Not answered</span>` : ""}</div>
        <p class="question-text">${inline(q.q)}</p>`;
      if (q.code) html += `<pre><code>${escapeHtml(q.code)}</code></pre>`;
      html += `<ul class="options">`;
      state.perm[qi].forEach((oi, pos) => {
        let cls = "option";
        if (oi === q.answer) cls += " correct";
        else if (oi === chosen) cls += " incorrect";
        html += `<li><div class="${cls}"><span class="letter">${LETTERS[pos]}</span><span>${inline(q.options[oi])}</span></div></li>`;
      });
      const verdict = isCorrect(qi) ? "You got it right." : chosen === undefined ? "Not answered." : `You picked ${letterOf(qi, chosen)}.`;
      html += `</ul><div class="explain ${isCorrect(qi) ? "" : "wrong"}">
        <p class="verdict">${verdict} Correct answer: ${letterOf(qi, q.answer)}. ${inline(q.options[q.answer])}</p>
        <p>${inline(q.explain)}</p></div>`;
      if (q.anim) html += `<div class="anim-host"></div>`;
      const card = document.createElement("article");
      card.className = "card review-item";
      card.innerHTML = html;
      if (q.anim) watchWhenVisible(card.querySelector(".anim-host"), q.anim);
      list.appendChild(card);
    }
  }

  // Start each animation when it scrolls into view, so a long review doesn't
  // play twenty of them at once.
  let observer = null;
  function watchWhenVisible(host, spec) {
    if (!("IntersectionObserver" in window)) { Anim.mount(host, spec); return; }
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          observer.unobserve(e.target);
          Anim.mount(e.target, e.target._spec);
        }
      }, { rootMargin: "0px 0px -20% 0px" });
    }
    host._spec = spec;
    observer.observe(host);
  }

  // ---------- wiring ----------
  $("start-btn").onclick = () => start();
  $("home-btn").onclick = () => {
    if (!$("view-auth").hidden) return;
    if (state && !state.submitted && Object.keys(state.answers).length &&
        !confirm("Leave this exam? Your progress is saved and you can resume it from the start screen.")) return;
    renderStart();
  };
  $("resume-btn").onclick = () => { state = load(); enterQuiz(); };
  $("discard-btn").onclick = () => { clearSaved(); renderStart(); };
  $("submit-btn").onclick = () => submit(false);
  $("only-wrong").onchange = renderReview;
  $("restart-btn").onclick = () => { clearSaved(); renderStart(); };
  $("retry-wrong-btn").onclick = () => {
    const missed = state.order.filter((qi) => !isCorrect(qi));
    if (missed.length) start(missed);
  };

  document.addEventListener("keydown", (e) => {
    if ($("view-quiz").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const idx = "1234".indexOf(k) !== -1 ? "1234".indexOf(k) : "abcd".indexOf(k);
    if (idx !== -1 && k.length === 1) { choose(state.perm[state.order[state.pos]][idx]); return; }
    if (k === "arrowright") go(state.pos + 1);
    else if (k === "arrowleft") go(state.pos - 1);
    else if (k === "f") toggleFlag();
  });

  // The login screen comes first. Once someone is signed in, pick up where they
  // left off if they reload after submitting.
  Auth.init({
    onSignedIn() {
      const saved = load();
      if (saved && saved.submitted) { state = saved; renderResults(); }
      else renderStart();
    },
    onSignedOut() {
      stopTimer();
      $("timer").hidden = true;
      state = null;
      showView("auth");
    },
  });
})();
