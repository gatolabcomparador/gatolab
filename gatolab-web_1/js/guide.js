/* ==========================================================================
   Gato Lab — GUÍA para principiantes
   --------------------------------------------------------------------------
   El texto de la guía NO está escrito en este archivo: se lee de
   content/guia.json, que se edita desde el panel de administración
   (/admin/, colección «GUÍA»). Aquí solo está la forma de pintarla.

   Formato del texto de cada sección (en el panel):
     - Un párrafo por bloque, separados por una línea en blanco.
     - Las líneas que empiezan por "- " se muestran como lista.
     - **texto** se muestra en negrita.

   Se apoya en window.GatoLab (final de js/app.js) para saber el idioma y
   para aplicar un filtro al pulsar «Ver modelos».
   ========================================================================== */
(function(){
  "use strict";

  const UI = {
    eyebrow:   {es:"GUÍA PARA PRINCIPIANTES", ca:"GUIA PER A PRINCIPIANTS", en:"BEGINNER'S GUIDE", fr:"GUIDE DU DÉBUTANT"},
    title:     {es:"¿Qué pie de gato <em>elegir?</em>", ca:"Quin peu de gat <em>triar?</em>", en:"Which climbing shoe <em>should I buy?</em>", fr:"Quel chausson <em>choisir ?</em>"},
    toc:       {es:"En esta guía", ca:"En aquesta guia", en:"In this guide", fr:"Dans ce guide"},
    seeModels: {es:"Ver modelos", ca:"Veure models", en:"See models", fr:"Voir les modèles"},
    sizes:     {es:"Abrir el comparador de tallas", ca:"Obrir el comparador de talles", en:"Open the size comparator", fr:"Ouvrir le comparateur de tailles"},
    allModels: {es:"Ver todos los modelos", ca:"Veure tots els models", en:"See all models", fr:"Voir tous les modèles"},
    loading:   {es:"Cargando guía…", ca:"Carregant la guia…", en:"Loading guide…", fr:"Chargement du guide…"},
    error:     {es:"No se ha podido cargar la guía. Vuelve a intentarlo en unos minutos.", ca:"No s'ha pogut carregar la guia. Torna-ho a provar d'aquí a uns minuts.", en:"The guide could not be loaded. Please try again in a few minutes.", fr:"Le guide n'a pas pu être chargé. Réessaie dans quelques minutes."},
    top:       {es:"Volver arriba", ca:"Tornar a dalt", en:"Back to top", fr:"Retour en haut"}
  };

  let GUIDE = null, failed = false, pendingSection = window.__gatoLabGuideSection || null;

  const el = sel => document.querySelector(sel);
  const lang = () => (window.GatoLab && window.GatoLab.getLang) ? window.GatoLab.getLang() : "es";
  const tr = obj => { if(!obj) return ""; if(typeof obj === "string") return obj; return obj[lang()] || obj.es || ""; };
  const ui = key => tr(UI[key]);
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  // Texto sencillo → HTML (párrafos, listas con "- " y **negrita**)
  function textToHTML(txt){
    const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return String(txt || "").trim().split(/\n\s*\n/).map(block=>{
      const lines = block.split("\n").map(l=>l.trim()).filter(Boolean);
      if(lines.length && lines.every(l=>l.startsWith("- "))){
        return "<ul>" + lines.map(l=>`<li>${inline(l.slice(2))}</li>`).join("") + "</ul>";
      }
      return `<p>${inline(lines.join(" "))}</p>`;
    }).join("");
  }

  function filterButtonsHTML(filtros){
    if(!Array.isArray(filtros) || !filtros.length) return "";
    const btns = filtros.map(f=>{
      if(f.tipo === "tallas"){
        return `<button type="button" class="btn-secondary guide-filter" data-tipo="tallas">${ui("sizes")} →</button>`;
      }
      const label = (window.GatoLab && window.GatoLab.filterLabel) ? window.GatoLab.filterLabel(f.tipo, f.valor) : f.valor;
      return `<button type="button" class="btn-secondary guide-filter" data-tipo="${esc(f.tipo)}" data-valor="${esc(f.valor||"")}">${ui("seeModels")}: ${esc(label)} →</button>`;
    }).join("");
    return `<div class="guide-filters">${btns}</div>`;
  }

  function render(){
    const box = el("#guideBody");
    if(!box) return;
    if(!GUIDE){
      box.innerHTML = `<p class="guide-status">${failed ? ui("error") : ui("loading")}</p>`;
      return;
    }
    const secciones = Array.isArray(GUIDE.secciones) ? GUIDE.secciones : [];
    box.innerHTML = `
      <section class="hero guide-hero">
        <div class="eyebrow">${ui("eyebrow")}</div>
        <h1 class="display">${ui("title")}</h1>
        <p>${esc(tr(GUIDE.intro))}</p>
      </section>
      <div class="guide-layout">
        <nav class="guide-toc" aria-label="${esc(ui("toc"))}">
          <div class="guide-toc-title">${ui("toc")}</div>
          <ol>${secciones.map(s=>`<li><a href="#guia/${esc(s.id)}" data-sec="${esc(s.id)}">${esc(tr(s.titulo))}</a></li>`).join("")}</ol>
        </nav>
        <div class="guide-sections">
          ${secciones.map(s=>`
            <section class="guide-section" id="guia-${esc(s.id)}">
              <h2>${esc(tr(s.titulo))}</h2>
              <div class="guide-text">${textToHTML(tr(s.texto))}</div>
              ${filterButtonsHTML(s.filtros)}
            </section>`).join("")}
          <div class="guide-end">
            <button type="button" class="btn-primary guide-filter" data-tipo="todos">${ui("allModels")} →</button>
            <button type="button" class="btn-secondary guide-top">${ui("top")} ↑</button>
          </div>
        </div>
      </div>`;

    box.querySelectorAll(".guide-toc a").forEach(a=>{
      a.addEventListener("click", ev=>{
        ev.preventDefault();
        scrollToSection(a.dataset.sec);
        try{ history.replaceState(null, "", "#guia/" + a.dataset.sec); }catch(e){}
      });
    });
    box.querySelectorAll(".guide-filter").forEach(b=>{
      b.addEventListener("click", ()=>{
        if(window.GatoLab && window.GatoLab.showFiltered) window.GatoLab.showFiltered(b.dataset.tipo, b.dataset.valor);
      });
    });
    const top = box.querySelector(".guide-top");
    if(top) top.addEventListener("click", ()=> window.scrollTo({top:0, behavior:"smooth"}));

    if(pendingSection){ const id = pendingSection; pendingSection = null; setTimeout(()=>scrollToSection(id), 30); }
  }

  function scrollToSection(id){
    const target = document.getElementById("guia-" + id);
    if(!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  function setSection(id){ pendingSection = id || null; }

  fetch("content/guia.json", { cache: "no-store" })
    .then(r => { if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(data => { GUIDE = data || {}; })
    .catch(err => { console.error("GATO LAB: no se pudo cargar content/guia.json —", err); failed = true; })
    .then(() => { const v = el("#guideView"); if(v && !v.hidden) render(); });

  window.GatoLabGuide = { render, setSection };

  // Si la página se abrió directamente en #guia (antes de que este archivo cargara)
  const v = el("#guideView");
  if(v && !v.hidden) render();
})();
