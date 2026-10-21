// Accounts: sign in, sign up, forgot / reset password, and saved results.
// Uses Supabase Auth (email + password) and one `attempts` table.
// app.js calls Auth.init() with two hooks and never talks to Supabase directly.

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const cfg = window.APP_CONFIG || {};
  const configured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  // Grab this before the client reads (and clears) the URL hash.
  const arrivedFromResetLink = /type=recovery/.test(window.location.hash);
  // Real accounts when Supabase is configured; otherwise a local stand-in with
  // the same interface, so the login page always works.
  const localMode = !(configured && window.supabase);
  const client = localMode
    ? localClient()
    : window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  let user = null;
  let recovering = arrivedFromResetLink && !localMode;

  // ---------- local mode ----------
  // Accounts live only in this browser's storage. Passwords are salted and
  // hashed (SHA-256); nothing is stored in the code or sent anywhere.
  function localClient() {
    const USERS = "qpe-local-users";
    const SESSION = "qpe-local-session";
    const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (_) { return d; } };
    const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
    const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    async function hash(password, salt) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + password));
      return hex(new Uint8Array(buf));
    }
    const publicUser = (u) => ({ id: u.id, email: u.email, user_metadata: { full_name: u.name } });
    function current() {
      const s = read(SESSION, null);
      const u = s && read(USERS, {})[s.email];
      return u ? publicUser(u) : null;
    }
    const fail = (message) => ({ data: {}, error: { message } });
    const attemptsKey = () => "qpe-local-attempts:" + (current() || {}).id;
    // There's no mailbox to prove ownership through in local mode, but the
    // account only exists in this browser anyway, so "forgot password" goes
    // straight to choosing a new one.
    let pendingReset = null;

    return {
      auth: {
        onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
        async getSession() {
          const u = current();
          return { data: { session: u ? { user: u } : null } };
        },
        async signInWithPassword({ email, password }) {
          const u = read(USERS, {})[email.toLowerCase()];
          if (!u || (await hash(password, u.salt)) !== u.hash) return fail("Invalid login credentials");
          write(SESSION, { email: u.email });
          return { data: { user: publicUser(u) }, error: null };
        },
        async signUp({ email, password, options }) {
          const key = email.toLowerCase();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(key)) return fail("Enter a valid email address.");
          const users = read(USERS, {});
          if (users[key]) return fail("An account with this email already exists. Sign in instead.");
          const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
          users[key] = {
            id: "local-" + hex(crypto.getRandomValues(new Uint8Array(8))),
            email: key,
            name: (options.data && options.data.full_name) || key,
            salt,
            hash: await hash(password, salt),
          };
          write(USERS, users);
          write(SESSION, { email: key });
          const pu = publicUser(users[key]);
          return { data: { user: pu, session: { user: pu } }, error: null };
        },
        async resetPasswordForEmail(email) {
          const key = email.toLowerCase();
          if (!read(USERS, {})[key]) {
            return { error: { message: "No account found with that email. Check the spelling, or create an account." } };
          }
          pendingReset = key;
          return { error: null, localReset: true };
        },
        async updateUser({ password }) {
          const users = read(USERS, {});
          const key = pendingReset || (read(SESSION, null) || {}).email;
          const u = key && users[key];
          if (!u) return fail("Start again from \"Forgot password?\".");
          u.salt = hex(crypto.getRandomValues(new Uint8Array(16)));
          u.hash = await hash(password, u.salt);
          write(USERS, users);
          write(SESSION, { email: key });
          pendingReset = null;
          return { data: { user: publicUser(u) }, error: null };
        },
        async signOut() { try { localStorage.removeItem(SESSION); } catch (_) {} },
      },
      from() {
        return {
          async insert(record) {
            const list = read(attemptsKey(), []);
            list.push(Object.assign({ created_at: new Date().toISOString() }, record));
            write(attemptsKey(), list);
            return { error: null };
          },
          select() { return this; },
          order() { return this; },
          async limit(n) {
            return { data: read(attemptsKey(), []).slice().reverse().slice(0, n), error: null };
          },
        };
      },
    };
  }
  let hooks = { onSignedIn() {}, onSignedOut() {} };

  const FORMS = ["signin", "signup", "forgot", "reset"];
  const TITLES = {
    signin: ["Sign in", "Welcome back. Sign in to take the exam and see your past results."],
    signup: ["Create your account", "Your results are saved to your account, so you can track your progress."],
    forgot: ["Reset your password", localMode
      ? "Enter the email you registered with and choose a new password."
      : "Enter your email and we'll send you a link to choose a new password."],
    reset: ["Choose a new password", "Pick a new password for your account."],
  };

  // ---------- password rules ----------
  // Every new password must meet all of these. Applied on sign-up and on both
  // reset forms, with a live checklist under each password box.
  const PASSWORD_RULES = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "An uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
    { label: "A lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
    { label: "A number (0–9)", test: (p) => /[0-9]/.test(p) },
    { label: "A special character (e.g. ! @ # $ %)", test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];
  function passwordProblem(p) {
    const missing = PASSWORD_RULES.filter((r) => !r.test(p));
    if (!missing.length) return null;
    return "Your password needs: " + missing.map((r) => r.label[0].toLowerCase() + r.label.slice(1)).join(", ") + ".";
  }
  function attachRuleChecklists() {
    document.querySelectorAll("input[data-rules]").forEach((input) => {
      const list = h("ul", "pw-rules");
      const items = PASSWORD_RULES.map((r) => h("li", "", list, r.label));
      input.closest("label").after(list);
      const update = () => PASSWORD_RULES.forEach((r, k) => items[k].classList.toggle("met", r.test(input.value)));
      input.addEventListener("input", update);
      input.form.addEventListener("reset", () => setTimeout(update, 0));
    });
  }
  function h(tag, cls, parent, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---------- UI helpers ----------
  function showForm(name) {
    for (const f of FORMS) $("form-" + f).hidden = f !== name;
    $("auth-title").textContent = TITLES[name][0];
    $("auth-sub").textContent = TITLES[name][1];
    message("");
    const first = $("form-" + name).querySelector("input");
    if (first) first.focus();
  }
  function message(text, kind) {
    const el = $("auth-msg");
    el.textContent = text;
    el.className = "auth-msg" + (kind ? " " + kind : "");
    el.hidden = !text;
  }
  function busy(form, on) {
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = "Please wait…"; }
    else if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
  function redirectUrl() {
    return window.location.origin + window.location.pathname;
  }
  function displayName() {
    if (!user) return "";
    return (user.user_metadata && user.user_metadata.full_name) || user.email;
  }
  function renderUserChip() {
    $("user-chip").hidden = !user;
    $("user-name").textContent = displayName();
  }

  // ---------- session changes ----------
  function setUser(next) {
    const changed = (next && next.id) !== (user && user.id);
    user = next;
    renderUserChip();
    if (!changed) return;
    if (user) hooks.onSignedIn(user);
    else hooks.onSignedOut();
  }

  // ---------- form handlers ----------
  async function onSignIn(e) {
    e.preventDefault();
    const form = e.target;
    busy(form, true);
    const { data, error } = await client.auth.signInWithPassword({
      email: form.email.value.trim(),
      password: form.password.value,
    });
    busy(form, false);
    if (error) return message(error.message, "err");
    form.reset();
    setUser(data.user);
  }

  async function onSignUp(e) {
    e.preventDefault();
    const form = e.target;
    const weak = passwordProblem(form.password.value);
    if (weak) return message(weak, "err");
    if (form.password.value !== form.confirm.value) return message("The two passwords don't match.", "err");
    busy(form, true);
    const { data, error } = await client.auth.signUp({
      email: form.email.value.trim(),
      password: form.password.value,
      options: { data: { full_name: form.name.value.trim() }, emailRedirectTo: redirectUrl() },
    });
    busy(form, false);
    if (error) return message(error.message, "err");
    form.reset();
    if (data.session) return setUser(data.user);
    // Email confirmation is on (the Supabase default): no session until they click the link.
    showForm("signin");
    message("Account created. Check your inbox and click the confirmation link, then sign in.", "ok");
  }

  async function onForgot(e) {
    e.preventDefault();
    const form = e.target;
    // Local mode resets in one step, right here: email + new password.
    if (localMode) {
      const weak = passwordProblem(form.password.value);
    if (weak) return message(weak, "err");
      if (form.password.value !== form.confirm.value) return message("The two passwords don't match.", "err");
    }
    busy(form, true);
    const { error, localReset } = await client.auth.resetPasswordForEmail(form.email.value.trim(), { redirectTo: redirectUrl() });
    if (error) { busy(form, false); return message(error.message, "err"); }
    if (localReset) {
      const res = await client.auth.updateUser({ password: form.password.value });
      busy(form, false);
      if (res.error) return message(res.error.message, "err");
      form.reset();
      return setUser(res.data.user);
    }
    busy(form, false);
    form.reset();
    // Same message whether or not the address has an account, so it can't be used to probe emails.
    message("If that email has an account, a reset link is on its way. Check your inbox (and spam folder).", "ok");
  }

  async function onReset(e) {
    e.preventDefault();
    const form = e.target;
    const weak = passwordProblem(form.password.value);
    if (weak) return message(weak, "err");
    if (form.password.value !== form.confirm.value) return message("The two passwords don't match.", "err");
    busy(form, true);
    const { data, error } = await client.auth.updateUser({ password: form.password.value });
    busy(form, false);
    if (error) return message(error.message, "err");
    form.reset();
    recovering = false;
    history.replaceState(null, "", redirectUrl());
    user = null; // force the signed-in hook to run now that recovery is over
    setUser(data.user);
  }

  async function signOut() {
    await client.auth.signOut();
    setUser(null);
    showForm("signin");
  }

  // ---------- saved results ----------
  async function saveAttempt(record) {
    if (!user) return { saved: false };
    const { error } = await client.from("attempts").insert(record);
    return { saved: !error, error };
  }
  async function listAttempts(limit) {
    if (!user) return [];
    const { data, error } = await client
      .from("attempts")
      .select("created_at, score, total, time_up, duration_seconds")
      .order("created_at", { ascending: false })
      .limit(limit || 10);
    return error ? [] : data;
  }

  // ---------- start up ----------
  async function init(h) {
    hooks = h;
    $("link-signup").onclick = () => showForm("signup");
    $("link-forgot").onclick = () => showForm("forgot");
    document.querySelectorAll(".link-signin").forEach((b) => (b.onclick = () => showForm("signin")));
    $("form-signin").onsubmit = onSignIn;
    $("form-signup").onsubmit = onSignUp;
    $("form-forgot").onsubmit = onForgot;
    $("form-reset").onsubmit = onReset;
    $("signout-btn").onclick = signOut;
    attachRuleChecklists();
    if (!localMode) {
      // With Supabase the new password is chosen from the emailed link instead.
      $("forgot-submit").textContent = "Send reset link";
      $("forgot-new-password").hidden = true;
    }

    client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        recovering = true;
        hooks.onSignedOut();
        showForm("reset");
        return;
      }
      if (recovering) return;
      // Supabase calls back inside its own lock; defer so our hooks can query safely.
      setTimeout(() => setUser(session ? session.user : null), 0);
    });

    if (recovering) {
      hooks.onSignedOut();
      showForm("reset");
      return;
    }
    const { data } = await client.auth.getSession();
    showForm("signin");
    if (data.session) setUser(data.session.user);
    else hooks.onSignedOut();
  }

  window.Auth = {
    init,
    saveAttempt,
    listAttempts,
    displayName,
    userId: () => (user ? user.id : null),
    isGuest: () => !user,
  };
})();
