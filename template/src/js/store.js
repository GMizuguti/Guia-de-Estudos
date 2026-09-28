/* Persistência local: progresso, fichas, notas, marcadores, treino, simulado e preferências.
   Funciona igual no Tauri (WebView2) e num navegador. */
(function () {
  "use strict";

  var KEY = "{{SLUG}}.v1";   // ÚNICO por matéria: evita que dois manuais se sobrescrevam no navegador

  var DEFAULTS = {
    read: {},            // sectionId -> true
    bookmarks: {},       // sectionId -> true
    notes: {},           // sectionId -> string
    srs: {},             // cardId -> { ease, interval, due, reps, lapses }
    quiz: { best: null, runs: 0, missed: {} },
    drills: {},          // drillKey -> { choice: {parte: valor}, text: {parte: texto}, self: {parte: {ev, li, de}}, done, at }
    exam: null,          // prova simulada: { ids: [...], started, submitted }
    checks: {},          // caixas marcadas no Mapa (lista de conferência etc.)
    sim: null,           // simulado do professor: { started, submitted, peek, nome, ans: {n: {choice, text}}, score: {n: "0.8"} }
    lastChapter: "c1",
    lastView: "home",
    prefs: {
      theme: "system",   // system | light | dark
      readFont: "sans",  // sans | serif
      readSize: 16,
      readLh: 1.68,
      measure: 74
    }
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function merge(base, patch) {
    var out = clone(base);
    Object.keys(patch || {}).forEach(function (k) {
      if (patch[k] && typeof patch[k] === "object" && !Array.isArray(patch[k]) && base[k] && typeof base[k] === "object") {
        out[k] = merge(base[k], patch[k]);
      } else if (patch[k] !== undefined) {
        out[k] = patch[k];
      }
    });
    return out;
  }

  var state;
  try {
    var raw = localStorage.getItem(KEY);
    state = raw ? merge(DEFAULTS, JSON.parse(raw)) : clone(DEFAULTS);
  } catch (e) {
    state = clone(DEFAULTS);
  }

  var saveTimer = null;
  function persist() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* modo privado: perde-se ao fechar */ }
    }, 180);
  }

  window.Store = {
    all: function () { return state; },
    prefs: function () { return state.prefs; },

    setPref: function (k, v) { state.prefs[k] = v; persist(); },

    isRead: function (id) { return !!state.read[id]; },
    setRead: function (id, on) {
      if (on) state.read[id] = true; else delete state.read[id];
      persist();
    },
    readCount: function (ids) {
      var n = 0;
      for (var i = 0; i < ids.length; i++) if (state.read[ids[i]]) n++;
      return n;
    },

    isBookmarked: function (id) { return !!state.bookmarks[id]; },
    toggleBookmark: function (id) {
      if (state.bookmarks[id]) delete state.bookmarks[id]; else state.bookmarks[id] = true;
      persist();
      return !!state.bookmarks[id];
    },
    bookmarks: function () { return Object.keys(state.bookmarks); },

    note: function (id) { return state.notes[id] || ""; },
    setNote: function (id, txt) {
      if (txt && txt.trim()) state.notes[id] = txt; else delete state.notes[id];
      persist();
    },
    noteCount: function () { return Object.keys(state.notes).length; },

    srs: function (id) { return state.srs[id] || null; },
    setSrs: function (id, rec) { state.srs[id] = rec; persist(); },
    srsAll: function () { return state.srs; },

    quiz: function () { return state.quiz; },
    recordQuiz: function (score, total, missedIds) {
      var q = state.quiz;
      q.runs += 1;
      var pct = total ? Math.round((score / total) * 100) : 0;
      if (q.best === null || pct > q.best) q.best = pct;
      missedIds.forEach(function (id) { q.missed[id] = (q.missed[id] || 0) + 1; });
      persist();
    },

    drill: function (key) { return state.drills[key] || null; },
    setDrill: function (key, rec) {
      if (rec) state.drills[key] = rec; else delete state.drills[key];
      persist();
    },
    drillsAll: function () { return state.drills; },

    exam: function () { return state.exam; },
    setExam: function (e) { state.exam = e; persist(); },

    sim: function () { return state.sim; },
    setSim: function (s) { state.sim = s; persist(); },

    check: function (k) { return !!state.checks[k]; },
    setCheck: function (k, on) {
      if (on) state.checks[k] = true; else delete state.checks[k];
      persist();
    },

    setLast: function (view, chapter) {
      if (view) state.lastView = view;
      if (chapter) state.lastChapter = chapter;
      persist();
    },
    last: function () { return { view: state.lastView, chapter: state.lastChapter }; },

    reset: function () {
      state = clone(DEFAULTS);
      try { localStorage.removeItem(KEY); } catch (e) {}
    },

    exportJson: function () {
      return JSON.stringify({ app: "{{SLUG}}", version: 1, exported: new Date().toISOString(), data: state }, null, 2);
    },
    importJson: function (text) {
      var parsed = JSON.parse(text);
      var payload = parsed && parsed.data ? parsed.data : parsed;
      if (!payload || typeof payload !== "object") throw new Error("Formato não reconhecido");
      state = merge(DEFAULTS, payload);
      persist();
    }
  };
})();
