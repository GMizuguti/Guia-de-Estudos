/* Esquemas visuais do app (acréscimos que NÃO estão no material).
   Os esquemas de cada matéria são registrados em data/figuras.js:
     window.BACT.figures.nome = function (F) { return "<html>"; };
   e usados pelo bloco { t: "figure", ref: "nome" } (no Guia) ou dentro do Mapa.
   F oferece: F.cat(eixo, valor), F.skeleton(eixo, valor), F.flow(definição), F.esc(texto). */
(function () {
  "use strict";

  var B = window.BACT;
  var FLOWS = {};

  function axisOpt(axis, v) {
    var a = (B.axes || {})[axis];
    if (!a) return null;
    return a.options.filter(function (o) { return o.v === v; })[0] || null;
  }

  // Chip de uma opção de eixo, na cor do eixo (tone "accent" ou "ink")
  function cat(axis, v) {
    var a = (B.axes || {})[axis], o = axisOpt(axis, v);
    var tone = a && a.tone === "accent" ? "accent" : "ink";
    return '<span class="cat cat--' + tone + '">' + (o ? o.l : v) + "</span>";
  }

  // Esqueleto de resposta de uma opção (campo `skeleton` da opção, em HTML)
  function skeleton(axis, v) {
    var o = axisOpt(axis, v);
    if (!o || !o.skeleton) return "";
    return '<div class="skel"><div class="skel__h">' + cat(axis, v) + "<span>esqueleto de resposta</span></div>" + o.skeleton + "</div>";
  }

  /* ---------- procedimento clicável ----------
     F.flow({
       id: "proc",
       steps: [
         { n: "1ª", key: "q1", q: "Pergunta?", clears: ["q2"],
           opts: [ { val: "sim", label: "Sim", out: F.cat("eixo", "valor"), note: "observação" } ] },
         { n: "2ª", key: "q2", q: "…", showIf: function (st) { return st.q1 === "nao"; }, opts: [ … ] }
       ],
       result: function (st, F) { return "<html do resultado>"; }   // st = { q1: "sim", q2: "" }
     }) */
  function flow(def) {
    FLOWS[def.id] = def;
    return '<div class="flow" data-flow="' + def.id + '">' +
      def.steps.map(function (s) {
        return '<div class="flow__step" data-step="' + s.key + '"><div class="flow__n">' + s.n + '</div><div class="flow__body">' +
          '<div class="flow__q">' + s.q + "</div>" +
          '<div class="flow__opts">' + s.opts.map(function (o) {
            return '<button type="button" class="flow__opt" data-flow-pick="' + s.key + '" data-val="' + o.val + '" aria-pressed="false">' +
              '<span class="flow__a">' + o.label + "</span>" +
              '<i class="ph ph-arrow-right flow__arrow" aria-hidden="true"></i>' +
              '<span class="flow__out">' + (o.out || "") + (o.note ? "<small>" + o.note + "</small>" : "") + "</span></button>";
          }).join("") + "</div></div></div>";
      }).join("") +
      (def.result ? '<div class="flow__step"><div class="flow__n">' + (def.resultN || "=") + '</div><div class="flow__body">' +
        (def.resultQ ? '<div class="flow__q">' + def.resultQ + "</div>" : "") + '<div class="flow__res" data-flow-res></div></div></div>' : "") +
      '<div class="flow__foot"><button type="button" class="btn btn--ghost btn--sm" data-flow-reset><i class="ph ph-arrow-counter-clockwise" aria-hidden="true"></i>Recomeçar</button></div>' +
    "</div>";
  }

  function flowState(root) {
    var def = FLOWS[root.dataset.flow], st = {};
    def.steps.forEach(function (s) { st[s.key] = root.getAttribute("data-v-" + s.key) || ""; });
    return st;
  }

  function updateFlow(root) {
    var def = FLOWS[root.dataset.flow];
    if (!def) return;
    var st = flowState(root);
    Array.prototype.forEach.call(root.querySelectorAll("[data-flow-pick]"), function (b) {
      b.setAttribute("aria-pressed", String(st[b.dataset.flowPick] === b.dataset.val));
    });
    def.steps.forEach(function (s) {
      var el = root.querySelector('[data-step="' + s.key + '"]');
      if (el) el.classList.toggle("is-off", !!s.showIf && !s.showIf(st));
    });
    var res = root.querySelector("[data-flow-res]");
    if (res && def.result) res.innerHTML = def.result(st, API) || "";
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    var pick = t.closest ? t.closest("[data-flow-pick]") : null;
    if (pick) {
      var root = pick.closest("[data-flow]"), def = FLOWS[root.dataset.flow];
      var key = pick.dataset.flowPick, attr = "data-v-" + key;
      root.setAttribute(attr, root.getAttribute(attr) === pick.dataset.val ? "" : pick.dataset.val);
      var step = def.steps.filter(function (s) { return s.key === key; })[0];
      (step && step.clears || []).forEach(function (k) { root.setAttribute("data-v-" + k, ""); });
      updateFlow(root);
      return;
    }
    var rst = t.closest ? t.closest("[data-flow-reset]") : null;
    if (rst) {
      var r = rst.closest("[data-flow]");
      FLOWS[r.dataset.flow].steps.forEach(function (s) { r.setAttribute("data-v-" + s.key, ""); });
      updateFlow(r);
    }
  });

  var API = { cat: cat, skeleton: skeleton, flow: flow, esc: function (s) { return Render.esc(s || ""); } };

  function get(ref) {
    var f = (B.figures || {})[ref];
    return typeof f === "function" ? f(API) : "";
  }

  window.Figures = {
    html: get,
    block: function (ref) {
      var inner = get(ref);
      if (!inner) return "";
      return '<figure class="fig">' +
        '<figcaption class="fig__tag"><i class="ph ph-map-trifold" aria-hidden="true"></i>Esquema do app · não está no material</figcaption>' +
        inner + "</figure>";
    },
    // Chame depois de inserir HTML com procedimentos clicáveis na página
    hydrate: function (scope) {
      Array.prototype.forEach.call((scope || document).querySelectorAll("[data-flow]"), updateFlow);
    },
    cat: cat,
    skeleton: skeleton
  };
})();
