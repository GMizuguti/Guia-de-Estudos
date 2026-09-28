/* Índice de busca sobre o manual, as fichas, as questões, os casos, o treino e o simulado */
(function () {
  "use strict";

  function strip(html) {
    return String(html).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?»)\]])/g, "$1")   // el borrado de etiquetas deja huecos antes de la puntuación
      .replace(/([«(\[])\s+/g, "$1")
      .trim();
  }

  function fold(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function blockText(b, out) {
    if (!b) return;
    switch (b.t) {
      case "p": out.push(strip(b.html)); break;
      case "h": out.push(strip(b.text)); break;
      case "aside": out.push(strip(b.html)); break;
      case "ul": b.items.forEach(function (i) { out.push(strip(i)); }); break;
      case "steps":
        if (b.title) out.push(strip(b.title));
        b.items.forEach(function (i) { out.push(strip(i)); });
        break;
      case "cols":
        b.columns.forEach(function (c) {
          if (c.title) out.push(strip(c.title));
          (c.blocks || []).forEach(function (x) { blockText(x, out); });
        });
        break;
      case "table":
        if (b.caption) out.push(strip(b.caption));
        out.push(b.cols.map(strip).join(" · "));
        b.rows.forEach(function (r) { out.push(r.map(strip).join(" · ")); });
        break;
      case "callout":
        if (b.title) out.push(strip(b.title));
        (b.blocks || []).forEach(function (x) { blockText(x, out); });
        break;
      case "phrases": b.items.forEach(function (i) { out.push(strip(i)); }); break;
      case "case":
        var c = (window.BACT.cases || []).filter(function (x) { return x.id === b.ref; })[0];
        if (c) {
          out.push(strip(c.title)); out.push(strip(c.stem));
          c.questions.forEach(function (q) { out.push(strip(q.q) + " " + strip(q.a)); });
        }
        break;
    }
  }

  var index = [];

  function build() {
    index = [];
    var W = ((window.BACT || {}).meta || {}).words || {};
    var CH = W.chapter || "Capítulo", CHS = W.chapterShort || "Cap.";

    (window.BACT.chapters || []).forEach(function (ch) {
      index.push({
        kind: CH.toLowerCase(), icon: "ph-book-open-text",
        title: CH + " " + ch.num + " · " + ch.title,
        sub: ch.kicker,
        text: fold([ch.title, ch.kicker, ch.tocDesc, ch.intro, (ch.tags || []).join(" ")].map(strip).join(" ")),
        go: { view: "manual", chapter: ch.id, section: null },
        weight: 3
      });

      (ch.sections || []).forEach(function (sec) {
        var parts = [];
        (sec.blocks || []).forEach(function (b) { blockText(b, parts); });
        var body = parts.join("  ");
        index.push({
          kind: (W.sectionOne || "seção") + " " + sec.num, icon: "ph-text-align-left",
          title: sec.title,
          sub: CHS + " " + ch.num + " · " + ch.title + " — " + body.slice(0, 220),
          raw: body,
          text: fold(sec.num + " " + sec.title + " " + body),
          go: { view: "manual", chapter: ch.id, section: sec.id },
          weight: 2
        });
      });
    });

    (window.BACT.cards || []).forEach(function (c) {
      index.push({
        kind: "ficha", icon: "ph-cards",
        title: strip(c.front),
        sub: strip(c.back),
        text: fold(strip(c.front) + " " + strip(c.back)),
        go: { view: "manual", chapter: c.ch, section: c.sec },
        weight: 1
      });
    });

    (window.BACT.quiz || []).forEach(function (q) {
      index.push({
        kind: "questão", icon: "ph-question",
        title: strip(q.q),
        sub: "Resposta: " + strip(q.opts[q.a]) + " — " + strip(q.why),
        text: fold(strip(q.q) + " " + q.opts.map(strip).join(" ") + " " + strip(q.why)),
        go: { view: "manual", chapter: q.ch, section: q.sec },
        weight: 1
      });
    });

    (window.BACT.cases || []).forEach(function (c) {
      index.push({
        kind: "caso", icon: "ph-pencil-line",
        title: c.title,
        sub: strip(c.stem),
        text: fold(c.title + " " + strip(c.stem) + " " + c.questions.map(function (q) { return strip(q.q) + " " + strip(q.a); }).join(" ")),
        go: { view: "treino", focus: c.id },
        weight: 2
      });
    });

    // Exercícios do Treino que não vêm de um caso (os casos já entram acima)
    (window.BACT.drills || []).forEach(function (d) {
      if (d.case || !d.title) return;
      index.push({
        kind: "treino", icon: "ph-pencil-line",
        title: d.title,
        sub: strip(d.stem),
        text: fold(d.title + " " + strip(d.stem) + " " + strip(d.proposal || "") + " " + d.parts.map(function (p) { return strip(p.model); }).join(" ")),
        go: { view: "treino", focus: d.id },
        weight: 1
      });
    });

    // Simulado: só os enunciados, para a busca não entregar o gabarito
    ((window.BACT.simulado || {}).questions || []).forEach(function (q) {
      var body = strip(q.stem.join(" ") + " " + (q.quote || "") + " " + (q.after || ""));
      index.push({
        kind: "simulado", icon: "ph-clipboard-text",
        title: (window.BACT.simulado.homeTitle || "Simulado") + " · Questão " + q.n,
        sub: body,
        text: fold("simulado questao " + q.n + " " + body),
        go: { view: "simulado", focus: q.n },
        weight: 1
      });
    });

    (window.BACT.compare || []).forEach(function (a) {
      var vals = window.BACT.compareFields.map(function (f) { return strip(a[f.key] || ""); }).join(" ");
      index.push({
        kind: "comparador", icon: "ph-columns",
        title: a.name,
        sub: a.group + " — " + strip(a[(window.BACT.compareFields[0] || {}).key] || ""),
        text: fold(a.name + " " + a.group + " " + vals),
        go: { view: "comparador", agent: a.id },
        weight: 2
      });
    });
  }

  function query(q, limit) {
    var needle = fold(q).trim();
    if (!needle) return [];
    var terms = needle.split(/\s+/).filter(Boolean);
    var out = [];

    for (var i = 0; i < index.length; i++) {
      var it = index[i];
      var score = 0, ok = true;
      for (var t = 0; t < terms.length; t++) {
        var pos = it.text.indexOf(terms[t]);
        if (pos === -1) { ok = false; break; }
        score += 100 - Math.min(pos, 90) / 10;
        if (fold(strip(it.title)).indexOf(terms[t]) !== -1) score += 60;
      }
      if (!ok) continue;
      score += it.weight * 12;
      out.push({ item: it, score: score, first: terms[0] });
    }

    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, limit || 30).map(function (r) {
      return { item: r.item, excerpt: excerpt(r.item, terms) };
    });
  }

  function excerpt(item, terms) {
    var source = item.raw || strip(item.sub || "");
    var f = fold(source);
    var pos = -1;
    for (var i = 0; i < terms.length && pos === -1; i++) pos = f.indexOf(terms[i]);
    if (pos === -1) return source.slice(0, 160);
    var start = Math.max(0, pos - 60);
    var slice = source.slice(start, start + 200);
    return (start > 0 ? "…" : "") + slice + (start + 200 < source.length ? "…" : "");
  }

  function highlight(text, q) {
    var terms = fold(q).split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) return window.Render.esc(text);
    var safe = window.Render.esc(text);
    var folded = fold(safe);
    var marks = [];
    terms.forEach(function (t) {
      var from = 0, at;
      while ((at = folded.indexOf(t, from)) !== -1) {
        marks.push([at, at + t.length]);
        from = at + t.length;
      }
    });
    if (!marks.length) return safe;
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [], cur = marks[0];
    for (var i = 1; i < marks.length; i++) {
      if (marks[i][0] <= cur[1]) cur[1] = Math.max(cur[1], marks[i][1]);
      else { merged.push(cur); cur = marks[i]; }
    }
    merged.push(cur);
    var out = "", last = 0;
    merged.forEach(function (m) {
      out += safe.slice(last, m[0]) + "<mark>" + safe.slice(m[0], m[1]) + "</mark>";
      last = m[1];
    });
    return out + safe.slice(last);
  }

  window.SearchIndex = { build: build, query: query, highlight: highlight, strip: strip, fold: fold };
})();
