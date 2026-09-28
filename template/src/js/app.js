/* Controlador da aplicação (genérico — não precisa ser editado por matéria) */
(function () {
  "use strict";

  var B = window.BACT;
  var M = B.meta || {};

  // Vocabulário do material (meta.words). `doc` precisa ser substantivo masculino: manual, guia, resumo.
  var W = M.words || {};
  var CH = W.chapter || "Capítulo";
  var CHS = W.chapterShort || "Cap.";
  var DOC = W.doc || "manual";
  var SECS = W.sections || "seções";
  var SECS_READ = W.sectionsRead || "seções lidas";
  function chLabel(ch, short) { return ch.isAnnex ? "Anexo" : (short ? CHS : CH) + " " + ch.num; }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var state = {
    view: "home",
    chapter: "c1",
    deck: "due",
    fcQueue: [],
    fcIndex: 0,
    fcFlipped: false,
    quizPool: [],
    quizIndex: 0,
    quizScore: 0,
    quizMissed: [],
    quizAnswered: false,
    quizScope: "all",
    quizLen: 10,
    cmpSel: [],
    palIndex: 0,
    palResults: []
  };

  /* ---------------------------------------------------------
     Utilidades
     --------------------------------------------------------- */

  function chapterById(id) {
    return B.chapters.filter(function (c) { return c.id === id; })[0] || B.chapters[0];
  }
  function sectionIds(ch) { return (ch.sections || []).map(function (s) { return s.id; }); }
  function allSectionIds() {
    return B.chapters.reduce(function (a, c) { return a.concat(sectionIds(c)); }, []);
  }

  var toastTimer = null;
  function toast(msg, icon) {
    var el = $("#toast");
    el.innerHTML = '<i class="ph ' + (icon || "ph-check-circle") + '" aria-hidden="true"></i><span></span>';
    $("span", el).textContent = msg;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2400);
  }

  /* ---------------------------------------------------------
     Preferencias / tema
     --------------------------------------------------------- */

  function applyPrefs() {
    var p = Store.prefs();
    var root = document.documentElement;

    if (p.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", p.theme);

    root.style.setProperty("--read-font", p.readFont === "serif" ? "var(--font-serif)" : "var(--font-sans)");
    root.style.setProperty("--read-size", p.readSize + "px");
    root.style.setProperty("--read-lh", String(p.readLh));
    root.style.setProperty("--read-measure", p.measure + "ch");

    var icon = p.theme === "dark" ? "ph-moon" : p.theme === "light" ? "ph-sun" : "ph-circle-half";
    $("#themeBtn").innerHTML = '<i class="ph ' + icon + '" aria-hidden="true"></i>';
    $("#themeBtn").setAttribute("title", "Tema: " + ({ system: "do sistema", light: "claro", dark: "escuro" })[p.theme]);
  }

  function cycleTheme() {
    var order = ["system", "light", "dark"];
    var p = Store.prefs();
    Store.setPref("theme", order[(order.indexOf(p.theme) + 1) % 3]);
    applyPrefs();
    syncSettingsUI();
  }

  /* ---------------------------------------------------------
     Navegación
     --------------------------------------------------------- */

  function setView(view, opts) {
    opts = opts || {};
    state.view = view;
    $$(".view").forEach(function (v) { v.classList.toggle("is-active", v.id === "view-" + view); });
    $$(".nav__btn").forEach(function (b) {
      if (b.dataset.view === view) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });

    var showSidebar = view === "manual";
    $("#sidebar").hidden = !showSidebar;
    $("#bodyGrid").classList.toggle("body--wide", !showSidebar);
    $("#sidebar").classList.remove("is-open");

    if (view === "manual") {
      if (opts.chapter) state.chapter = opts.chapter;
      renderChapter(state.chapter, opts.section);
    } else if (view === "home") {
      renderHome();
    } else if (view === "fichas") {
      renderFlashcards();
    } else if (view === "test") {
      renderQuizIntro();
    } else if (view === "treino") {
      Treino.render(opts);
    } else if (view === "mapa") {
      Mapa.render();
    } else if (view === "simulado") {
      Simulado.render(opts);
    } else if (view === "comparador") {
      if (opts.agent && state.cmpSel.indexOf(opts.agent) === -1) {
        if (state.cmpSel.length >= 4) state.cmpSel.shift();
        state.cmpSel.push(opts.agent);
      }
      renderCompare();
    }

    Store.setLast(view, state.chapter);
    if (!opts.section) $("#main").scrollTop = 0;
  }

  function goto(target) {
    if (!target) return;
    setView(target.view, target);
  }

  /* ---------------------------------------------------------
     Barra lateral (capítulos)
     --------------------------------------------------------- */

  function ringSvg(pct, done) {
    var r = 8, c = 2 * Math.PI * r;
    return '<svg class="ring' + (done ? " ring--done" : "") + '" viewBox="0 0 22 22" aria-hidden="true">' +
      '<circle class="ring__bg" cx="11" cy="11" r="' + r + '"></circle>' +
      '<circle class="ring__fg" cx="11" cy="11" r="' + r + '" stroke-dasharray="' + c.toFixed(2) +
      '" stroke-dashoffset="' + (c * (1 - pct)).toFixed(2) + '"></circle></svg>';
  }

  function renderSidebar() {
    var all = allSectionIds();
    var readAll = Store.readCount(all);
    var pct = all.length ? readAll / all.length : 0;

    $("#sideProgress").innerHTML =
      '<div class="side-progress__top">' +
        '<span class="side-progress__label">Progresso de leitura</span>' +
        '<span class="side-progress__pct">' + Math.round(pct * 100) + "%</span>" +
      "</div>" +
      '<div class="bar"><span style="width:' + (pct * 100) + '%"></span></div>' +
      '<div class="side-progress__meta">' + readAll + " de " + all.length + " " + SECS_READ + "</div>";

    $("#chapList").innerHTML = B.chapters.map(function (ch) {
      var ids = sectionIds(ch);
      var n = Store.readCount(ids);
      var p = ids.length ? n / ids.length : 0;
      return '<button class="chap" data-chapter="' + ch.id + '"' +
        (ch.id === state.chapter && state.view === "manual" ? ' aria-current="true"' : "") + ">" +
        '<span class="chap__num">' + (ch.isAnnex ? "Ax" : ch.num) + "</span>" +
        '<span class="chap__t"><span class="chap__name">' + ch.title + "</span>" +
        '<span class="chap__desc">' + ch.tocDesc + "</span></span>" +
        ringSvg(p, p >= 1) +
        "</button>";
    }).join("");
  }

  /* ---------------------------------------------------------
     Lector
     --------------------------------------------------------- */

  function renderChapter(chId, scrollToSection) {
    var ch = chapterById(chId);
    state.chapter = ch.id;

    var idx = B.chapters.indexOf(ch);
    var prev = B.chapters[idx - 1], next = B.chapters[idx + 1];

    var html =
      '<div class="reader">' +
        '<article class="reader__main">' +
          '<header class="chapter-head">' +
            '<span class="chapter-head__eyebrow"><i class="ph ph-bookmark-simple" aria-hidden="true"></i>' +
              (ch.isAnnex ? "Anexo final" : CH + " " + ch.num) + " · pág. " + ch.page + "</span>" +
            "<h1>" + ch.title + "</h1>" +
            '<p class="chapter-head__kicker">' + ch.kicker + "</p>" +
            '<div class="chapter-head__intro prose">' + ch.intro + "</div>" +
            (ch.tags ? '<div class="tags">' + ch.tags.map(function (t) { return '<span class="tag">' + t + "</span>"; }).join("") + "</div>" : "") +
          "</header>" +
          ch.sections.map(sectionHtml).join("") +
          '<nav class="pager">' +
            '<button class="pager__btn" data-chapter="' + (prev ? prev.id : "") + '"' + (prev ? "" : " disabled") + '>' +
              '<i class="ph ph-arrow-left" aria-hidden="true"></i>' +
              '<span><span class="pager__dir">Anterior</span>' +
              '<span class="pager__name">' + (prev ? prev.title : "Início do " + DOC) + "</span></span>" +
            "</button>" +
            '<button class="pager__btn pager__btn--next" data-chapter="' + (next ? next.id : "") + '"' + (next ? "" : " disabled") + '>' +
              '<i class="ph ph-arrow-right" aria-hidden="true"></i>' +
              '<span><span class="pager__dir">Próxima</span>' +
              '<span class="pager__name">' + (next ? next.title : "Fim do " + DOC) + "</span></span>" +
            "</button>" +
          "</nav>" +
        "</article>" +
        '<aside class="rail" aria-label="Índice da seção">' +
          '<div class="rail__h">Nesta seção</div>' +
          '<div class="rail__list" id="railList">' +
            ch.sections.map(function (s) {
              return '<button class="rail__item' + (Store.isRead(s.id) ? " is-read" : "") + '" data-jump="' + s.id + '">' +
                '<span class="dot"></span><span>' + s.num + " " + s.title + "</span></button>";
            }).join("") +
          "</div>" +
        "</aside>" +
      "</div>";

    $("#view-manual").innerHTML = '<div class="wrap">' + html + "</div>";
    Figures.hydrate($("#view-manual"));
    renderSidebar();
    observeSections();

    if (scrollToSection) {
      var el = document.getElementById(scrollToSection);
      if (el) {
        requestAnimationFrame(function () {
          $("#main").scrollTop = el.offsetTop - 16;
        });
      }
    }
  }

  function sectionHtml(sec) {
    var read = Store.isRead(sec.id);
    var marked = Store.isBookmarked(sec.id);
    var note = Store.note(sec.id);
    return '<section class="section" id="' + sec.id + '" data-section="' + sec.id + '">' +
      '<div class="section__head">' +
        '<span class="section__num">' + sec.num + "</span>" +
        '<h2 class="section__title">' + sec.title + "</h2>" +
        '<div class="section__tools">' +
          '<button class="stool stool--read" data-toggle-read="' + sec.id + '" aria-pressed="' + read + '" title="Marcar como lido"><i class="ph ph-check" aria-hidden="true"></i></button>' +
          '<button class="stool" data-toggle-mark="' + sec.id + '" aria-pressed="' + marked + '" title="Salvar nos marcadores"><i class="ph ph-bookmark-simple" aria-hidden="true"></i></button>' +
          '<button class="stool" data-toggle-note="' + sec.id + '" aria-pressed="' + (!!note) + '" title="Nota pessoal"><i class="ph ph-note-pencil" aria-hidden="true"></i></button>' +
        "</div>" +
      "</div>" +
      '<div class="prose">' + Render.blocks(sec.blocks) + "</div>" +
      '<div class="note" data-note-for="' + sec.id + '"' + (note ? "" : " hidden") + '>' +
        '<div class="note__label"><i class="ph ph-note-pencil" aria-hidden="true"></i>Sua nota</div>' +
        '<textarea placeholder="Escreva aqui o que quiser lembrar desta parte…">' + Render.esc(note) + "</textarea>" +
      "</div>" +
      "</section>";
  }

  var sectionObserver = null;
  function observeSections() {
    if (sectionObserver) sectionObserver.disconnect();
    var items = $$("#railList .rail__item");
    if (!items.length) return;

    sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        items.forEach(function (b) { b.classList.toggle("is-active", b.dataset.jump === id); });
      });
    }, { root: $("#main"), rootMargin: "-10% 0px -75% 0px", threshold: 0 });

    $$(".section").forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------------------------------------------------------
     Inicio
     --------------------------------------------------------- */

  function dueCount() {
    var now = Date.now(), n = 0;
    B.cards.forEach(function (c) {
      var r = Store.srs(c.id);
      if (!r || r.due <= now) n++;
    });
    return n;
  }

  function renderHome() {
    var all = allSectionIds();
    var readN = Store.readCount(all);
    var pct = all.length ? Math.round((readN / all.length) * 100) : 0;
    var last = Store.last();
    var lastCh = chapterById(last.chapter);
    var q = Store.quiz();
    var tp = Treino.progress();

    var html =
      '<section class="hero">' +
        "<div>" +
          '<span class="hero__eyebrow"><i class="ph ph-graduation-cap" aria-hidden="true"></i>' + M.heroEyebrow + "</span>" +
          "<h1>" + M.heroTitle + (M.heroEmphasis ? " <i>" + M.heroEmphasis + "</i>" : "") + "</h1>" +
          '<p class="hero__lead">' + M.heroLead + "</p>" +
          '<div class="hero__cta">' +
            '<button class="btn btn--primary" data-go-chapter="' + lastCh.id + '">' +
              '<i class="ph ph-book-open-text" aria-hidden="true"></i>' +
              (readN > 0 ? "Continuar: " + chLabel(lastCh) : "Começar a ler") +
            "</button>" +
            (Treino.count() ? '<button class="btn btn--ghost" data-view="treino"><i class="ph ph-pencil-line" aria-hidden="true"></i>Treinar com resposta escrita</button>' : "") +
            '<button class="btn btn--ghost" data-view="fichas"><i class="ph ph-cards" aria-hidden="true"></i>Revisar ' + dueCount() + " fichas</button>" +
          "</div>" +
        "</div>" +
        '<div class="statgrid">' +
          '<div class="stat stat--accent"><div class="stat__v">' + pct + '%</div><div class="stat__l">Manual lido · ' + readN + " de " + all.length + " " + SECS + "</div></div>" +
          (tp.items
            ? '<div class="stat"><div class="stat__v">' + tp.done + " / " + tp.items + '</div><div class="stat__l">Exercícios do treino corrigidos</div></div>' +
              '<div class="stat"><div class="stat__v">' + (tp.parts ? Math.round((tp.right / tp.parts) * 100) + "%" : "—") + '</div><div class="stat__l">Escolhas certas no treino</div></div>'
            : '<div class="stat"><div class="stat__v">' + B.cards.length + '</div><div class="stat__l">Fichas de revisão</div></div>' +
              '<div class="stat"><div class="stat__v">' + B.quiz.length + '</div><div class="stat__l">Questões de múltipla escolha</div></div>') +
          '<div class="stat"><div class="stat__v">' + (q.best === null ? "—" : q.best + "%") + '</div><div class="stat__l">Melhor rodada de questões · ' + q.runs + " rodadas</div></div>" +
        "</div>" +
      "</section>" +

      Mapa.todayCard() +

      '<div class="sec-h"><h2>Ferramentas de estudo</h2></div>' +
      '<div class="actiongrid">' +
        (B.simulado ? action("simulado", "ph-clipboard-text", B.simulado.homeTitle || "Simulado", B.simulado.homeDesc || "Prova simulada com relógio, gabarito comentado e autoavaliação") : "") +
        (B.mapa ? action("mapa", "ph-map-trifold", B.mapa.title || "Mapa de revisão", B.mapa.homeDesc || "O essencial do material em uma tela") : "") +
        (Treino.count() ? action("treino", "ph-pencil-line", "Treino com resposta escrita", Treino.count() + " exercícios com resposta-modelo e autoavaliação" + (B.drillExam ? " · prova aleatória de " + B.drillExam.minutes + " minutos" : "")) : "") +
        action("fichas", "ph-cards", "Fichas de revisão", dueCount() + " pendentes hoje · repetição espaçada sobre " + B.cards.length + " fichas") +
        action("test", "ph-exam", "Questões de múltipla escolha", B.quiz.length + " questões com explicação e link para o trecho de origem") +
        ((B.compare || []).length ? action("comparador", "ph-columns", "Comparador", "Até quatro " + (W.compareNoun || "perfis") + " lado a lado, campo a campo") : "") +
      "</div>" +

      (M.howToUse || M.legend
        ? '<div class="sec-h"><h2>Como usar este aplicativo</h2></div>' +
          (M.howToUse
            ? '<p style="margin:-6px 0 16px;max-width:70ch;color:var(--text-2);font-size:14.5px;line-height:1.6">' + M.howToUse + "</p>"
            : "") +
          (M.legend
            ? '<div class="legend">' + M.legend.map(function (l) { return legend(l.kind, l.name, l.desc); }).join("") + "</div>"
            : "")
        : "") +

      '<div class="sec-h"><h2>Conteúdo do ' + DOC + "</h2><p>" + B.chapters.length + " " + (W.chapters || "capítulos") + "</p></div>" +
      '<div class="tiles">' + B.chapters.map(function (ch) {
        var ids = sectionIds(ch);
        var n = Store.readCount(ids);
        var p = ids.length ? Math.round((n / ids.length) * 100) : 0;
        return '<button class="tile" data-go-chapter="' + ch.id + '">' +
          '<div class="tile__top"><span class="tile__num">' + (ch.isAnnex ? "ANEXO" : String(ch.num).padStart(2, "0")) + "</span>" +
          '<span class="tile__num">' + p + "%</span></div>" +
          '<div class="tile__name">' + ch.title + "</div>" +
          '<div class="tile__desc">' + ch.tocDesc + "</div>" +
          '<div class="tile__bar"><span style="width:' + p + '%"></span></div>' +
          "</button>";
      }).join("") + "</div>" +

      bookmarksSection();

    $("#view-home").innerHTML = '<div class="wrap">' + html + "</div>";
  }

  function legend(kind, name, desc) {
    var meta = Render.calloutMeta[kind];
    return '<div class="legend__item legend__item--' + kind + '">' +
      '<i class="ph ' + meta.icon + '" aria-hidden="true"></i>' +
      '<div><div class="legend__n">' + name + "</div>" +
      '<div class="legend__d">' + desc + "</div></div></div>";
  }

  function action(view, icon, name, desc) {
    return '<button class="action" data-view="' + view + '">' +
      '<span class="action__ic"><i class="ph ' + icon + '" aria-hidden="true"></i></span>' +
      '<span><span class="action__n">' + name + '</span><span class="action__d">' + desc + "</span></span>" +
      "</button>";
  }

  function bookmarksSection() {
    var marks = Store.bookmarks();
    var notes = Store.all().notes;
    var noteIds = Object.keys(notes);
    if (!marks.length && !noteIds.length) return "";

    var lookup = {};
    B.chapters.forEach(function (ch) {
      ch.sections.forEach(function (s) { lookup[s.id] = { ch: ch, sec: s }; });
    });

    var items = [];
    marks.forEach(function (id) { if (lookup[id]) items.push({ id: id, kind: "marcador", icon: "ph-bookmark-simple", extra: "" }); });
    noteIds.forEach(function (id) {
      if (!lookup[id]) return;
      if (marks.indexOf(id) !== -1) {
        items.filter(function (i) { return i.id === id; })[0].extra = notes[id];
        items.filter(function (i) { return i.id === id; })[0].kind = "marcador e nota";
      } else {
        items.push({ id: id, kind: "nota", icon: "ph-note-pencil", extra: notes[id] });
      }
    });
    if (!items.length) return "";

    return '<div class="sec-h"><h2>Seus marcadores e notas</h2><p>' + items.length + " " + SECS + "</p></div>" +
      '<div class="tiles">' + items.map(function (it) {
        var e = lookup[it.id];
        return '<button class="tile" data-go-section="' + it.id + '" data-go-chapter-of="' + e.ch.id + '">' +
          '<div class="tile__top"><span class="tile__num"><i class="ph ' + it.icon + '" aria-hidden="true"></i> ' + it.kind + "</span>" +
          '<span class="tile__num">' + e.sec.num + "</span></div>" +
          '<div class="tile__name">' + e.sec.title + "</div>" +
          '<div class="tile__desc">' + (it.extra ? Render.esc(it.extra).slice(0, 130) : CHS + " " + e.ch.num + " · " + e.ch.title) + "</div>" +
          "</button>";
      }).join("") + "</div>";
  }

  /* ---------------------------------------------------------
     Fichas (SM-2 simplificado)
     --------------------------------------------------------- */

  var DAY = 86400000;

  function buildDeck() {
    var now = Date.now();
    var pool = B.cards.filter(function (c) {
      if (state.deck === "all") return true;
      if (state.deck === "due") { var r = Store.srs(c.id); return !r || r.due <= now; }
      return c.ch === state.deck;
    });
    // barajar de forma estable dentro de la sesión
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    state.fcQueue = pool;
    state.fcIndex = 0;
    state.fcFlipped = false;
  }

  function gradeCard(card, grade) {
    var r = Store.srs(card.id) || { ease: 2.5, interval: 0, due: 0, reps: 0, lapses: 0 };
    if (grade === 0) {
      r.lapses += 1; r.reps = 0; r.interval = 0;
      r.ease = Math.max(1.3, r.ease - 0.2);
      r.due = Date.now() + 6 * 60000;
    } else {
      r.reps += 1;
      if (grade === 1) { r.ease = Math.max(1.3, r.ease - 0.15); r.interval = r.interval ? Math.max(1, r.interval * 1.2) : 1; }
      else if (grade === 2) { r.interval = r.reps === 1 ? 1 : r.reps === 2 ? 4 : r.interval * r.ease; }
      else { r.ease = Math.min(3.0, r.ease + 0.15); r.interval = r.reps === 1 ? 3 : r.reps === 2 ? 7 : r.interval * r.ease * 1.25; }
      r.interval = Math.min(r.interval, 365);
      r.due = Date.now() + Math.round(r.interval * DAY);
    }
    Store.setSrs(card.id, r);
    return r;
  }

  function intervalLabel(card, grade) {
    var r = Store.srs(card.id) || { ease: 2.5, interval: 0, reps: 0 };
    if (grade === 0) return "6 min";
    var reps = r.reps + 1, iv = r.interval;
    if (grade === 1) iv = iv ? Math.max(1, iv * 1.2) : 1;
    else if (grade === 2) iv = reps === 1 ? 1 : reps === 2 ? 4 : iv * r.ease;
    else iv = reps === 1 ? 3 : reps === 2 ? 7 : iv * r.ease * 1.25;
    iv = Math.min(Math.round(iv), 365);
    return iv < 1 ? "1 d" : iv >= 30 ? Math.round(iv / 30) + (iv >= 60 ? " meses" : " mês") : iv + " d";
  }

  function renderFlashcards(keepQueue) {
    if (!keepQueue) buildDeck();

    var opts = '<option value="due">Pendentes hoje (' + dueCount() + ")</option>" +
      '<option value="all">Todas as fichas (' + B.cards.length + ")</option>" +
      B.chapters.map(function (ch) {
        var n = B.cards.filter(function (c) { return c.ch === ch.id; }).length;
        if (!n) return "";
        return '<option value="' + ch.id + '">' + chLabel(ch, true) + " · " + ch.title + " (" + n + ")</option>";
      }).join("");

    var bar =
      '<div class="fc-bar">' +
        '<select class="select" id="deckSel" aria-label="Baralho">' + opts + "</select>" +
        '<button class="btn btn--ghost btn--sm" id="shuffleBtn"><i class="ph ph-shuffle" aria-hidden="true"></i>Embaralhar</button>' +
        '<span class="fc-counter" id="fcCounter"></span>' +
      "</div>";

    var body;
    if (!state.fcQueue.length) {
      body = '<div class="empty"><i class="ph ph-confetti" aria-hidden="true"></i>' +
        "<h3>Nada pendente</h3>" +
        "<p>Você revisou todas as fichas deste baralho. Escolha outro baralho ou volte mais tarde: as fichas reaparecem conforme o calendário de repetição espaçada.</p>" +
        '<button class="btn btn--ghost" data-deck="all"><i class="ph ph-cards" aria-hidden="true"></i>Revisar todas mesmo assim</button></div>';
    } else {
      var card = state.fcQueue[state.fcIndex];
      var ch = chapterById(card.ch);
      body =
        '<div class="card3d" id="card3d" data-flip="' + (state.fcFlipped ? 1 : 0) + '">' +
          '<div class="card3d__inner">' +
            '<div class="card3d__face">' +
              '<span class="card3d__tag"><i class="ph ph-question" aria-hidden="true"></i>Pergunta</span>' +
              '<div class="card3d__q">' + card.front + "</div>" +
              '<div class="card3d__src"><i class="ph ph-book-open-text" aria-hidden="true"></i>' +
                chLabel(ch, true) + " · " + ch.title + "</div>" +
            "</div>" +
            '<div class="card3d__face card3d__face--back">' +
              '<span class="card3d__tag"><i class="ph ph-lightbulb-filament" aria-hidden="true"></i>Resposta</span>' +
              '<div class="card3d__a">' + card.back + "</div>" +
              '<div class="card3d__src"><i class="ph ph-arrow-square-out" aria-hidden="true"></i>' +
                '<button data-goto-sec="' + card.sec + '" data-goto-ch="' + card.ch + '">Ver no ' + DOC + '</button></div>' +
            "</div>" +
          "</div>" +
        "</div>" +
        (state.fcFlipped
          ? '<div class="fc-actions">' +
              grade(0, "De novo", "again", card) +
              grade(1, "Difícil", "hard", card) +
              grade(2, "Bom", "good", card) +
              grade(3, "Fácil", "easy", card) +
            "</div>" +
            '<p class="fc-hint"><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> para avaliar</p>'
          : '<button class="btn btn--primary" id="flipBtn" style="width:100%;justify-content:center;height:48px"><i class="ph ph-arrows-clockwise" aria-hidden="true"></i>Mostrar resposta</button>' +
            '<p class="fc-hint">Aperte <kbd>espaço</kbd> para virar a ficha</p>');
    }

    $("#view-fichas").innerHTML = '<div class="wrap wrap--narrow"><div class="fc-shell">' + bar + body + "</div></div>";
    var sel = $("#deckSel");
    if (sel) sel.value = state.deck;
    var counter = $("#fcCounter");
    if (counter) counter.textContent = state.fcQueue.length ? (state.fcIndex + 1) + " / " + state.fcQueue.length : "0 / 0";
  }

  function grade(g, label, cls, card) {
    return '<button class="grade grade--' + cls + '" data-grade="' + g + '">' +
      '<span class="grade__k">' + label + "</span>" +
      '<span class="grade__s">' + intervalLabel(card, g) + "</span></button>";
  }

  function advanceCard(g) {
    var card = state.fcQueue[state.fcIndex];
    if (!card) return;
    gradeCard(card, g);
    state.fcIndex += 1;
    state.fcFlipped = false;
    if (state.fcIndex >= state.fcQueue.length) {
      state.fcQueue = [];
      renderFlashcards(true);
      toast("Baralho concluído", "ph-confetti");
    } else {
      renderFlashcards(true);
    }
  }

  /* ---------------------------------------------------------
     Test
     --------------------------------------------------------- */

  function renderQuizIntro() {
    var q = Store.quiz();
    var scopes = '<option value="all">Todo o ' + DOC + " (" + B.quiz.length + " questões)</option>" +
      B.chapters.map(function (ch) {
        var n = B.quiz.filter(function (x) { return x.ch === ch.id; }).length;
        if (!n) return "";
        return '<option value="' + ch.id + '">' + chLabel(ch, true) + " · " + ch.title + " (" + n + ")</option>";
      }).join("");

    var missedIds = Object.keys(q.missed);
    $("#view-test").innerHTML = '<div class="wrap wrap--narrow"><div class="quiz-shell">' +
      '<div class="qcard">' +
        '<h2 style="margin:0 0 8px;font-size:22px;letter-spacing:-.02em">Questões de múltipla escolha</h2>' +
        '<p style="margin:0 0 22px;color:var(--text-2);font-size:14.5px;line-height:1.55">Questões de múltipla escolha montadas só com o conteúdo do ' + DOC + ', com explicação e link para o trecho de origem. Aqui você treina o reconhecimento' + (Treino.count() ? '; a resposta escrita se treina no Treino.' : '.') + '</p>' +
        '<div style="display:grid;gap:16px">' +
          '<div><label class="field__label" for="quizScope">Conteúdo</label><select class="select" id="quizScope" style="width:100%">' + scopes + "</select></div>" +
          '<div><label class="field__label" for="quizLen">Número de questões: <span id="quizLenVal">' + state.quizLen + '</span></label>' +
            '<input type="range" id="quizLen" min="5" max="50" step="5" value="' + state.quizLen + '"></div>' +
          (missedIds.length ? '<label style="display:flex;gap:9px;align-items:center;font-size:13.5px;color:var(--text-2)"><input type="checkbox" id="onlyMissed"> Só as ' + missedIds.length + " que errei antes</label>" : "") +
        "</div>" +
        '<div style="margin-top:22px"><button class="btn btn--primary" id="startQuiz" style="width:100%;justify-content:center;height:46px"><i class="ph ph-play" aria-hidden="true"></i>Começar</button></div>' +
        (q.runs ? '<p style="margin:18px 0 0;text-align:center;font-size:12.5px;color:var(--text-3)">Melhor resultado: <b style="color:var(--accent)">' + q.best + "%</b> em " + q.runs + " tentativas</p>" : "") +
      "</div></div></div>";

    var scope = $("#quizScope"); if (scope) scope.value = state.quizScope;
  }

  function startQuiz() {
    var scope = $("#quizScope").value;
    var len = parseInt($("#quizLen").value, 10);
    var onlyMissed = $("#onlyMissed") && $("#onlyMissed").checked;
    state.quizScope = scope;
    state.quizLen = len;

    var pool = B.quiz.filter(function (q) {
      if (onlyMissed && !Store.quiz().missed[q.id]) return false;
      return scope === "all" || q.ch === scope;
    });
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    // Embaralha também as alternativas, para a letra certa não virar padrão
    state.quizPool = pool.slice(0, Math.min(len, pool.length)).map(function (q) {
      var order = [0, 1, 2, 3];
      for (var k = order.length - 1; k > 0; k--) {
        var m = Math.floor(Math.random() * (k + 1));
        var tmp = order[k]; order[k] = order[m]; order[m] = tmp;
      }
      return { id: q.id, ch: q.ch, sec: q.sec, q: q.q, why: q.why,
        opts: order.map(function (o) { return q.opts[o]; }),
        a: order.indexOf(q.a) };
    });
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizMissed = [];
    state.quizAnswered = false;

    if (!state.quizPool.length) { toast("Nenhuma questão com esse filtro", "ph-warning-circle"); return; }
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    var q = state.quizPool[state.quizIndex];
    var ch = chapterById(q.ch);
    var letters = ["A", "B", "C", "D"];
    var total = state.quizPool.length;

    $("#view-test").innerHTML = '<div class="wrap wrap--narrow"><div class="quiz-shell">' +
      '<div class="qcard">' +
        '<div class="qcard__meta">' +
          '<span class="qcard__chip">' + chLabel(ch, true) + "</span>" +
          '<span class="qcard__chip">Questão ' + (state.quizIndex + 1) + " de " + total + "</span>" +
        "</div>" +
        '<h2 class="qcard__q">' + q.q + "</h2>" +
        '<div class="opts" id="opts">' + q.opts.map(function (o, i) {
          return '<button class="opt" data-opt="' + i + '"><span class="opt__k">' + letters[i] + "</span><span>" + o + "</span></button>";
        }).join("") + "</div>" +
        '<div id="whyBox"></div>' +
      "</div>" +
      '<div class="quiz-foot">' +
        '<div class="quiz-progress"><div class="bar"><span style="width:' + ((state.quizIndex / total) * 100) + '%"></span></div>' +
        '<div class="quiz-progress__t">Acertos: ' + state.quizScore + " / " + state.quizIndex + "</div></div>" +
        '<button class="btn btn--primary" id="nextQ" disabled><i class="ph ph-arrow-right" aria-hidden="true"></i>' +
          (state.quizIndex + 1 >= total ? "Ver resultado" : "Próxima") + "</button>" +
      "</div>" +
      "</div></div>";
    state.quizAnswered = false;
  }

  function answerQuiz(i) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;
    var q = state.quizPool[state.quizIndex];
    var ok = i === q.a;
    if (ok) state.quizScore += 1; else state.quizMissed.push(q.id);

    $$("#opts .opt").forEach(function (b, idx) {
      b.disabled = true;
      if (idx === q.a) b.classList.add("is-correct");
      else if (idx === i) b.classList.add("is-wrong");
    });

    var ch = chapterById(q.ch);
    $("#whyBox").innerHTML = '<div class="why">' +
      '<div class="why__h"><i class="ph ' + (ok ? "ph-check-circle" : "ph-info") + '" aria-hidden="true"></i>' +
        (ok ? "Correto" : "A resposta correta é a " + ["A", "B", "C", "D"][q.a]) + "</div>" +
      q.why +
      '<div style="margin-top:10px"><button class="missed__go" data-goto-sec="' + q.sec + '" data-goto-ch="' + q.ch + '">' +
        "Ler: " + chLabel(ch) + " →</button></div>" +
      "</div>";
    $("#nextQ").disabled = false;
  }

  function nextQuiz() {
    state.quizIndex += 1;
    if (state.quizIndex >= state.quizPool.length) renderQuizResult();
    else renderQuizQuestion();
  }

  function renderQuizResult() {
    var total = state.quizPool.length;
    var pct = Math.round((state.quizScore / total) * 100);
    Store.recordQuiz(state.quizScore, total, state.quizMissed);

    var msg = pct >= 90 ? "Você domina o conteúdo. Revise só os erros."
      : pct >= 70 ? "Bom nível. Volte aos trechos em que errou."
      : pct >= 50 ? "No caminho certo, mas vale reler as seções envolvidas."
      : "Hora de reler. Comece pelas seções das questões erradas.";

    var missed = state.quizMissed.map(function (id) {
      return B.quiz.filter(function (q) { return q.id === id; })[0];
    }).filter(Boolean);

    $("#view-test").innerHTML = '<div class="wrap wrap--narrow"><div class="quiz-shell">' +
      '<div class="qcard"><div class="result">' +
        '<div class="result__score">' + pct + "%</div>" +
        '<div class="result__of">' + state.quizScore + " acertos de " + total + "</div>" +
        '<p class="result__msg">' + msg + "</p>" +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          '<button class="btn btn--primary" id="againQuiz"><i class="ph ph-arrow-counter-clockwise" aria-hidden="true"></i>Outra rodada</button>' +
          '<button class="btn btn--ghost" data-view="manual"><i class="ph ph-book-open-text" aria-hidden="true"></i>Voltar ao ' + DOC + '</button>' +
        "</div>" +
        (missed.length
          ? '<div class="result__list">' + missed.map(function (q) {
              var ch = chapterById(q.ch);
              var sec = (ch.sections || []).filter(function (s) { return s.id === q.sec; })[0];
              return '<div class="missed"><div class="missed__q">' + q.q + "</div>" +
                '<div class="missed__a">' + q.opts[q.a] + "</div>" +
                '<button class="missed__go" data-goto-sec="' + q.sec + '" data-goto-ch="' + q.ch + '">' +
                  chLabel(ch, true) + (sec ? " · " + sec.num + " " + sec.title : "") + " →</button></div>";
            }).join("") + "</div>"
          : "") +
      "</div></div></div></div>";
  }

  /* ---------------------------------------------------------
     Comparador
     --------------------------------------------------------- */

  function renderCompare() {
    var groups = {};
    B.compare.forEach(function (a) { (groups[a.group] = groups[a.group] || []).push(a); });

    var picker = Object.keys(groups).map(function (g) {
      return '<div style="width:100%;font-size:10.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin:10px 0 2px">' + g + "</div>" +
        '<div class="cmp-pick" style="margin-bottom:4px">' + groups[g].map(function (a) {
          var on = state.cmpSel.indexOf(a.id) !== -1;
          return '<button class="chip" data-cmp="' + a.id + '" aria-pressed="' + on + '">' +
            '<i class="ph ' + (on ? "ph-check" : "ph-plus") + '" aria-hidden="true"></i>' + a.name + "</button>";
        }).join("") + "</div>";
    }).join("");

    var body;
    if (!state.cmpSel.length) {
      body = '<div class="cmp-empty"><i class="ph ph-columns" aria-hidden="true"></i>' +
        "Selecione de dois a quatro " + (W.compareNoun || "perfis") + " para vê-los lado a lado, campo a campo.</div>";
    } else {
      var sel = state.cmpSel.map(function (id) {
        return B.compare.filter(function (a) { return a.id === id; })[0];
      }).filter(Boolean);

      body = '<div class="cmp-table"><table class="cmp"><thead><tr><th class="cmp__field">Campo</th>' +
        sel.map(function (a) {
          var ch = chapterById(a.ch);
          return "<th>" + a.name +
            '<span class="cmp__ch">' + chLabel(ch, true) + "</span></th>";
        }).join("") + "</tr></thead><tbody>" +
        B.compareFields.map(function (f) {
          return '<tr><th class="cmp__field">' + f.label + "</th>" +
            sel.map(function (a) {
              var v = a[f.key] || "—";
              return '<td class="' + (v === "—" ? "is-dash" : "") + '">' + v + "</td>";
            }).join("") + "</tr>";
        }).join("") + "</tbody></table></div>";
    }

    $("#view-comparador").innerHTML = '<div class="wrap">' +
      '<div class="sec-h" style="margin-top:0"><h2>Comparador</h2>' +
      "<p>" + state.cmpSel.length + " de 4 selecionados</p></div>" +
      picker +
      '<div style="margin-top:22px">' + body + "</div>" +
      "</div>";
  }

  /* ---------------------------------------------------------
     Paleta de búsqueda
     --------------------------------------------------------- */

  function openPalette(prefill) {
    $("#palette").hidden = false;
    var input = $("#palInput");
    input.value = prefill || "";
    input.focus();
    input.select();
    runSearch();
  }

  function closePalette() {
    $("#palette").hidden = true;
  }

  function runSearch() {
    var q = $("#palInput").value;
    var box = $("#palResults");
    state.palIndex = 0;

    if (!q.trim()) {
      state.palResults = [];
      box.innerHTML = '<div class="pgroup">Sugestões</div>' +
        (M.searchHints || []).map(function (s, i) {
          return '<button class="pres' + (i === 0 ? " is-sel" : "") + '" data-suggest="' + s + '">' +
            '<span class="pres__ic"><i class="ph ph-magnifying-glass" aria-hidden="true"></i></span>' +
            '<span class="pres__t"><span class="pres__title">' + s + "</span></span>" +
            '<span class="pres__kind">buscar</span></button>';
        }).join("");
      return;
    }

    var res = SearchIndex.query(q, 40);
    state.palResults = res;

    if (!res.length) {
      box.innerHTML = '<div class="palette__empty">Nenhum resultado para «' + Render.esc(q) + "»</div>";
      return;
    }

    box.innerHTML = '<div class="pgroup">' + res.length + " resultado" + (res.length === 1 ? "" : "s") + "</div>" +
      res.map(function (r, i) {
        return '<button class="pres' + (i === 0 ? " is-sel" : "") + '" data-res="' + i + '">' +
          '<span class="pres__ic"><i class="ph ' + r.item.icon + '" aria-hidden="true"></i></span>' +
          '<span class="pres__t">' +
            '<span class="pres__title">' + SearchIndex.highlight(SearchIndex.strip(r.item.title), q) + "</span>" +
            '<span class="pres__sub">' + SearchIndex.highlight(r.excerpt, q) + "</span>" +
          "</span>" +
          '<span class="pres__kind">' + r.item.kind + "</span></button>";
      }).join("");
  }

  function movePalette(delta) {
    var items = $$("#palResults .pres");
    if (!items.length) return;
    items[state.palIndex].classList.remove("is-sel");
    state.palIndex = (state.palIndex + delta + items.length) % items.length;
    items[state.palIndex].classList.add("is-sel");
    items[state.palIndex].scrollIntoView({ block: "nearest" });
  }

  function activatePalette() {
    var items = $$("#palResults .pres");
    if (!items.length) return;
    items[state.palIndex].click();
  }

  /* ---------------------------------------------------------
     Ajustes
     --------------------------------------------------------- */

  function syncSettingsUI() {
    var p = Store.prefs();
    $$("#drawer [data-set-theme]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setTheme === p.theme)); });
    $$("#drawer [data-set-font]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setFont === p.readFont)); });
    $("#sizeRange").value = p.readSize;
    $("#sizeVal").textContent = p.readSize + " px";
    $("#lhRange").value = Math.round(p.readLh * 100);
    $("#lhVal").textContent = p.readLh.toFixed(2);
    $("#measureRange").value = p.measure;
    $("#measureVal").textContent = p.measure + " caracteres";
    $("#statsLine").textContent =
      Store.readCount(allSectionIds()) + " " + SECS_READ + " · " +
      Store.bookmarks().length + " marcadores · " +
      Store.noteCount() + " notas · " +
      Object.keys(Store.srsAll()).length + " fichas em andamento";
  }

  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* ---------------------------------------------------------
     Eventos
     --------------------------------------------------------- */

  function wire() {
    // Navegación superior
    $$(".nav__btn").forEach(function (b) {
      b.addEventListener("click", function () { setView(b.dataset.view); });
    });
    $("#menuBtn").addEventListener("click", function () { $("#sidebar").classList.toggle("is-open"); });
    $("#themeBtn").addEventListener("click", cycleTheme);
    $("#searchBtn").addEventListener("click", function () { openPalette(); });
    $("#settingsBtn").addEventListener("click", function () {
      $("#drawer").hidden = false; syncSettingsUI();
    });

    // Delegación global de clics
    document.addEventListener("click", function (ev) {
      var t = ev.target;

      var chap = t.closest ? t.closest("[data-chapter]") : null;
      if (chap && chap.dataset.chapter) { setView("manual", { chapter: chap.dataset.chapter }); return; }

      var goCh = t.closest ? t.closest("[data-go-chapter]") : null;
      if (goCh) { setView("manual", { chapter: goCh.dataset.goChapter }); return; }

      var goSec = t.closest ? t.closest("[data-go-section]") : null;
      if (goSec) { setView("manual", { chapter: goSec.dataset.goChapterOf, section: goSec.dataset.goSection }); return; }

      var gotoSec = t.closest ? t.closest("[data-goto-sec]") : null;
      if (gotoSec) { setView("manual", { chapter: gotoSec.dataset.gotoCh, section: gotoSec.dataset.gotoSec }); return; }

      var tr = t.closest ? t.closest("[data-treino]") : null;
      if (tr) { setView("treino", { focus: tr.dataset.treino }); return; }

      var viewBtn = t.closest ? t.closest("[data-view]") : null;
      if (viewBtn && !viewBtn.classList.contains("nav__btn")) { setView(viewBtn.dataset.view); return; }

      var jump = t.closest ? t.closest("[data-jump]") : null;
      if (jump) {
        var el = document.getElementById(jump.dataset.jump);
        if (el) $("#main").scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
        return;
      }

      var readBtn = t.closest ? t.closest("[data-toggle-read]") : null;
      if (readBtn) {
        var id = readBtn.dataset.toggleRead;
        var on = !Store.isRead(id);
        Store.setRead(id, on);
        readBtn.setAttribute("aria-pressed", String(on));
        var rail = $('.rail__item[data-jump="' + id + '"]');
        if (rail) rail.classList.toggle("is-read", on);
        renderSidebar();
        return;
      }

      var markBtn = t.closest ? t.closest("[data-toggle-mark]") : null;
      if (markBtn) {
        var on2 = Store.toggleBookmark(markBtn.dataset.toggleMark);
        markBtn.setAttribute("aria-pressed", String(on2));
        toast(on2 ? "Tópico salvo nos marcadores" : "Marcador removido", on2 ? "ph-bookmark-simple" : "ph-trash");
        return;
      }

      var noteBtn = t.closest ? t.closest("[data-toggle-note]") : null;
      if (noteBtn) {
        var box = $('[data-note-for="' + noteBtn.dataset.toggleNote + '"]');
        if (box) {
          box.hidden = !box.hidden;
          if (!box.hidden) $("textarea", box).focus();
        }
        return;
      }

      var caseq = t.closest ? t.closest("[data-caseq]") : null;
      if (caseq) {
        var wrap = caseq.parentElement;
        wrap.dataset.open = wrap.dataset.open === "1" ? "0" : "1";
        return;
      }

      // fichas
      if (t.closest && t.closest("#card3d")) { state.fcFlipped = !state.fcFlipped; renderFlashcards(true); return; }
      if (t.id === "flipBtn" || (t.closest && t.closest("#flipBtn"))) { state.fcFlipped = true; renderFlashcards(true); return; }
      var gr = t.closest ? t.closest("[data-grade]") : null;
      if (gr) { advanceCard(parseInt(gr.dataset.grade, 10)); return; }
      if (t.id === "shuffleBtn" || (t.closest && t.closest("#shuffleBtn"))) { renderFlashcards(); return; }
      var deckBtn = t.closest ? t.closest("[data-deck]") : null;
      if (deckBtn) { state.deck = deckBtn.dataset.deck; renderFlashcards(); return; }

      // test
      if (t.id === "startQuiz" || (t.closest && t.closest("#startQuiz"))) { startQuiz(); return; }
      var opt = t.closest ? t.closest("[data-opt]") : null;
      if (opt) { answerQuiz(parseInt(opt.dataset.opt, 10)); return; }
      if (t.id === "nextQ" || (t.closest && t.closest("#nextQ"))) { nextQuiz(); return; }
      if (t.id === "againQuiz" || (t.closest && t.closest("#againQuiz"))) { renderQuizIntro(); return; }

      // comparador
      var cmp = t.closest ? t.closest("[data-cmp]") : null;
      if (cmp) {
        var cid = cmp.dataset.cmp;
        var at = state.cmpSel.indexOf(cid);
        if (at !== -1) state.cmpSel.splice(at, 1);
        else if (state.cmpSel.length >= 4) toast("No máximo quatro por vez", "ph-warning-circle");
        else state.cmpSel.push(cid);
        renderCompare();
        return;
      }

      // paleta
      var sug = t.closest ? t.closest("[data-suggest]") : null;
      if (sug) { $("#palInput").value = sug.dataset.suggest; runSearch(); $("#palInput").focus(); return; }
      var resBtn = t.closest ? t.closest("[data-res]") : null;
      if (resBtn) {
        var r = state.palResults[parseInt(resBtn.dataset.res, 10)];
        closePalette();
        if (r) goto(r.item.go);
        return;
      }
    });

    // Filtros de tabla y notas
    document.addEventListener("input", function (ev) {
      var t = ev.target;
      if (t.matches("[data-tfilter]")) {
        var wrap = t.closest(".tablewrap");
        var needle = SearchIndex.fold(t.value.trim());
        var rows = $$("tbody tr", wrap);
        var shown = 0;
        rows.forEach(function (row) {
          var hit = !needle || SearchIndex.fold(row.dataset.search).indexOf(needle) !== -1;
          row.classList.toggle("is-hidden", !hit);
          if (hit) shown++;
        });
        $("[data-tcount]", wrap).textContent = shown + " de " + rows.length + " linhas";
        return;
      }
      if (t.closest(".note")) {
        var id = t.closest(".note").dataset.noteFor;
        Store.setNote(id, t.value);
        var btn = $('[data-toggle-note="' + id + '"]');
        if (btn) btn.setAttribute("aria-pressed", String(!!t.value.trim()));
        return;
      }
      if (t.id === "palInput") { runSearch(); return; }
      if (t.id === "quizLen") { $("#quizLenVal").textContent = t.value; return; }
      if (t.id === "sizeRange") { Store.setPref("readSize", parseInt(t.value, 10)); applyPrefs(); syncSettingsUI(); return; }
      if (t.id === "lhRange") { Store.setPref("readLh", parseInt(t.value, 10) / 100); applyPrefs(); syncSettingsUI(); return; }
      if (t.id === "measureRange") { Store.setPref("measure", parseInt(t.value, 10)); applyPrefs(); syncSettingsUI(); return; }
    });

    document.addEventListener("change", function (ev) {
      if (ev.target.id === "deckSel") { state.deck = ev.target.value; renderFlashcards(); }
    });

    // Paleta
    $("#palette").addEventListener("click", function (ev) { if (ev.target.id === "palette") closePalette(); });
    $("#palInput").addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown") { ev.preventDefault(); movePalette(1); }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); movePalette(-1); }
      else if (ev.key === "Enter") { ev.preventDefault(); activatePalette(); }
    });

    // Ajustes
    $("#drawerClose").addEventListener("click", function () { $("#drawer").hidden = true; });
    $$("#drawer [data-set-theme]").forEach(function (b) {
      b.addEventListener("click", function () { Store.setPref("theme", b.dataset.setTheme); applyPrefs(); syncSettingsUI(); });
    });
    $$("#drawer [data-set-font]").forEach(function (b) {
      b.addEventListener("click", function () { Store.setPref("readFont", b.dataset.setFont); applyPrefs(); syncSettingsUI(); });
    });
    $("#exportBtn").addEventListener("click", function () {
      download("progresso-{{SLUG}}-" + new Date().toISOString().slice(0, 10) + ".json", Store.exportJson());
      toast("Progresso exportado", "ph-download-simple");
    });
    $("#importInput").addEventListener("change", function (ev) {
      var f = ev.target.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          Store.importJson(String(fr.result));
          applyPrefs(); syncSettingsUI(); renderSidebar(); setView(state.view, { chapter: state.chapter });
          toast("Progresso importado", "ph-upload-simple");
        } catch (e) { toast("Arquivo inválido", "ph-warning-circle"); }
      };
      fr.readAsText(f);
      ev.target.value = "";
    });
    $("#resetBtn").addEventListener("click", function () {
      if (!confirm("Serão apagados o progresso de leitura, as fichas, as notas e os marcadores. Esta ação não pode ser desfeita.\n\nContinuar?")) return;
      Store.reset(); applyPrefs(); syncSettingsUI(); renderSidebar(); setView("home");
      toast("Tudo apagado", "ph-arrow-counter-clockwise");
    });
    $("#printBtn").addEventListener("click", function () { window.print(); });

    // Teclado global
    document.addEventListener("keydown", function (ev) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);

      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault(); openPalette(); return;
      }
      if (ev.key === "Escape") {
        if (!$("#palette").hidden) { closePalette(); return; }
        if (!$("#drawer").hidden) { $("#drawer").hidden = true; return; }
      }
      if (typing) return;

      if (ev.key === "/") { ev.preventDefault(); openPalette(); return; }

      if (state.view === "fichas" && state.fcQueue.length) {
        if (ev.key === " ") { ev.preventDefault(); state.fcFlipped = !state.fcFlipped; renderFlashcards(true); return; }
        if (state.fcFlipped && ev.key >= "1" && ev.key <= "4") { advanceCard(parseInt(ev.key, 10) - 1); return; }
      }

      if (state.view === "manual") {
        var idx = B.chapters.indexOf(chapterById(state.chapter));
        if (ev.key === "ArrowRight" && idx < B.chapters.length - 1) { setView("manual", { chapter: B.chapters[idx + 1].id }); return; }
        if (ev.key === "ArrowLeft" && idx > 0) { setView("manual", { chapter: B.chapters[idx - 1].id }); return; }
      }

      if (ev.key.toLowerCase() === "t") { cycleTheme(); return; }
    });
  }

  /* ---------------------------------------------------------
     Arranque
     --------------------------------------------------------- */

  // Vuelca la identidad de data/meta.js sobre el HTML estático.
  function applyMeta() {
    if (M.appTitle) document.title = M.appTitle;
    if (M.brandIcon) $(".brand__mark").innerHTML = '<i class="ph-fill ' + M.brandIcon + '" aria-hidden="true"></i>';
    if (W.docTab) $('.nav__btn[data-view="manual"] span').textContent = W.docTab;
    // Esconde as abas dos módulos que o material não usa
    var off = { mapa: !B.mapa, treino: !Treino.count(), simulado: !B.simulado, comparador: !(B.compare || []).length };
    Object.keys(off).forEach(function (v) {
      var b = $('.nav__btn[data-view="' + v + '"]');
      if (b && off[v]) b.hidden = true;
    });
    var bt = $(".brand__title"), bs = $(".brand__sub"), fn = $("#footerNote");
    if (bt && M.brandTitle) bt.textContent = M.brandTitle;
    if (bs && M.brandSub) bs.textContent = M.brandSub;
    if (fn && M.footerNote) fn.innerHTML = M.footerNote;
  }

  function init() {
    applyMeta();
    applyPrefs();
    SearchIndex.build();
    var last = Store.last();
    state.chapter = last.chapter || "c1";
    renderSidebar();
    wire();
    Treino.init();
    Mapa.init();
    Simulado.init();
    setView("home");
    document.body.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
