/* ==========================================================================
   Gato Lab — NEWS (sección editorial)
   --------------------------------------------------------------------------
   Este módulo NO contiene ninguna noticia escrita a mano: todo el contenido
   se lee en tiempo real desde content/news.json, que es exactamente el
   archivo que edita el panel de administración (/admin/, Decap CMS). Para
   publicar, editar o borrar un artículo no hace falta tocar este archivo
   ni ningún otro .js — basta con usar el panel (ver README.md).

   Se apoya en dos piezas que ya existen en la página:
     - window.SHOES (definido en js/data.js): para poder mostrar la ficha
       del modelo relacionado y el botón "Ver modelo →".
     - window.GatoLab (definido al final de js/app.js): puente mínimo para
       cambiar de pantalla (setView) y abrir la ficha de un modelo
       (openDetail) desde dentro de un artículo de NEWS.
   ========================================================================== */
(function(){
  "use strict";

  const NEWS_CATEGORIES = ["NEW RELEASES","REVIEWS","PRODUCT ANALYSIS","CLIMBING SHOES","BRANDS"];
  const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

  let NEWS = [];
  let loaded = false;
  let loadFailed = false;
  let currentSlug = null;
  let currentCat = null;

  function el(sel){ return document.querySelector(sel); }
  function shoeIcon(){ return '<svg viewBox="0 0 120 60"><use href="#icon-shoe"></use></svg>'; }
  function findShoe(id){ return (window.SHOES||[]).find(s=>s.id===id); }
  /* Misma foto principal + fallback que en app.js (módulo independiente, ver window.__gatoLabPhotoFallback). */
  function shoePhotoHTML(s){
    if(s.fotos && s.fotos.length){
      return `<img class="shoe-photo" src="${s.fotos[0]}" alt="${s.marca} ${s.modelo}" loading="lazy" onerror="window.__gatoLabPhotoFallback(this)">`;
    }
    return shoeIcon();
  }

  function formatNewsDate(iso){
    if(!iso) return "";
    const [y,m,d] = String(iso).slice(0,10).split("-").map(Number);
    if(!y || !m || !d) return iso;
    return `${d} ${MESES[m-1]} ${y}`;
  }

  function loadNews(){
    return fetch("content/news.json", { cache: "no-store" })
      .then(r=>{ if(!r.ok) throw new Error("HTTP "+r.status); return r.json(); })
      .then(data=>{
        NEWS = Array.isArray(data) ? data : (Array.isArray(data.articulos) ? data.articulos : []);
        loaded = true;
      })
      .catch(err=>{
        loadFailed = true;
        console.error("GATO LAB NEWS: no se pudo cargar content/news.json —", err);
      })
      .finally(()=>{
        // Si el usuario ya estaba en la pantalla NEWS esperando a que cargase, repinta.
        if(window.GatoLab && window.GatoLab.isNewsView && window.GatoLab.isNewsView()) render();
      });
  }

  function updateHash(){
    try{ history.replaceState(null, "", "#news" + (currentSlug ? "/"+currentSlug : "")); }catch(e){}
  }

  function setSlugFromHash(slug){
    currentSlug = (slug && NEWS.some(n=>n.slug===slug)) ? slug : null;
  }
  function getSlug(){ return currentSlug; }
  function goToList(){ currentSlug = null; }

  function relatedNewsHTML(shoeId, excludeSlug){
    if(!loaded || !shoeId) return "";
    const related = NEWS.filter(n=>n.modeloId===shoeId && n.slug!==excludeSlug);
    if(!related.length) return "";
    return `
      <div class="related-news">
        <h4>Más NEWS sobre este modelo</h4>
        ${related.map(r=>`
          <button type="button" class="related-news-item" data-news-slug="${r.slug}">
            <span class="related-news-title">${r.titulo}</span>
            <span class="related-news-arrow">Leer →</span>
          </button>`).join("")}
      </div>`;
  }

  function bindRelatedNewsClicks(container, afterNavigate){
    container.querySelectorAll(".related-news-item").forEach(item=>{
      item.addEventListener("click", ()=>{
        if(typeof afterNavigate === "function") afterNavigate();
        currentSlug = item.dataset.newsSlug;
        updateHash();
        window.GatoLab.setView("news");
      });
    });
  }

  function bindNewsCardNav(body){
    body.querySelectorAll("[data-news-slug]").forEach(node=>{
      const go = ()=>{
        currentSlug = node.dataset.newsSlug;
        updateHash();
        render();
        window.scrollTo({ top:0, behavior:"instant" in window ? "instant" : "auto" });
      };
      node.addEventListener("click", go);
      node.addEventListener("keydown", (ev)=>{
        if(ev.key==="Enter" || ev.key===" "){ ev.preventDefault(); go(); }
      });
    });
  }

  function newsFeaturedHTML(n){
    const shoe = findShoe(n.modeloId);
    const photo = n.imagenPrincipal
      ? `<img src="${n.imagenPrincipal}" alt="${n.imagenAlt||""}" loading="lazy">`
      : shoeIcon();
    return `
      <article class="news-featured" data-news-slug="${n.slug}" tabindex="0" role="button" aria-label="Leer: ${n.titulo}">
        <div class="news-featured-photo">${photo}</div>
        <div class="news-featured-body">
          <div class="news-featured-eyebrow">
            <span class="news-cat-tag">${n.categoria}</span>
            <span class="news-date mono">${formatNewsDate(n.fecha)}</span>
          </div>
          ${shoe ? `<div class="news-featured-model">${shoe.marca} · ${shoe.modelo}</div>` : (n.marca ? `<div class="news-featured-model">${n.marca}</div>` : "")}
          <h2 class="news-featured-title">${n.titulo}</h2>
          <p class="news-featured-excerpt">${n.subtitulo||""}</p>
          <span class="news-read-link">LEER ARTÍCULO →</span>
        </div>
      </article>`;
  }

  function newsCardHTML(n){
    const shoe = findShoe(n.modeloId);
    const photo = n.imagenPrincipal
      ? `<img src="${n.imagenPrincipal}" alt="${n.imagenAlt||""}" loading="lazy">`
      : shoeIcon();
    return `
      <article class="news-card" data-news-slug="${n.slug}" tabindex="0" role="button" aria-label="Leer: ${n.titulo}">
        <div class="news-card-photo">${photo}</div>
        <div class="news-card-body">
          <div class="news-card-eyebrow">
            <span class="news-cat-tag">${n.categoria}</span>
            <span class="news-date mono">${formatNewsDate(n.fecha)}</span>
          </div>
          ${shoe ? `<div class="news-card-model">${shoe.marca} · ${shoe.modelo}</div>` : (n.marca ? `<div class="news-card-model">${n.marca}</div>` : "")}
          <div class="news-card-title">${n.titulo}</div>
          <p class="news-card-excerpt">${n.subtitulo||""}</p>
          <span class="news-read-link">LEER ARTÍCULO →</span>
        </div>
      </article>`;
  }

  function renderListPage(body){
    const chips = ["TODAS", ...NEWS_CATEGORIES];
    const filtersHTML = `<div class="news-filters">` + chips.map(c=>{
      const active = c==="TODAS" ? !currentCat : currentCat===c;
      return `<button type="button" data-cat="${c}" aria-pressed="${active}">${c}</button>`;
    }).join("") + `</div>`;

    const filtered = currentCat ? NEWS.filter(n=>n.categoria===currentCat) : NEWS.slice();
    const sorted = filtered.slice().sort((a,b)=> String(b.fecha).localeCompare(String(a.fecha)));

    let mainHTML;
    if(!loaded && !loadFailed){
      mainHTML = `<div class="news-empty">CARGANDO NOTICIAS…</div>`;
    } else if(loadFailed){
      mainHTML = `<div class="news-empty">NO SE HAN PODIDO CARGAR LAS NOTICIAS. INTÉNTALO DE NUEVO MÁS TARDE.</div>`;
    } else if(!sorted.length){
      mainHTML = `<div class="news-empty">NO HAY ARTÍCULOS EN ESTA CATEGORÍA TODAVÍA.</div>`;
    } else {
      const featured = sorted[0];
      const rest = sorted.slice(1);
      mainHTML = newsFeaturedHTML(featured) + (rest.length ? `<div class="news-grid">${rest.map(newsCardHTML).join("")}</div>` : "");
    }

    body.innerHTML = `
      <section class="news-hero">
        <div class="eyebrow">EDITORIAL</div>
        <h1 class="display">GATO LAB <em>News</em></h1>
        <p>Novedades, análisis técnico y reviews de pies de gato — conectado directamente con la base de datos de modelos de GATO LAB.</p>
      </section>
      ${filtersHTML}
      ${mainHTML}
      <div class="ad-slot ad-infeed" aria-hidden="true">Espacio publicitario (Google AdSense · formato nativo)</div>`;

    body.querySelectorAll(".news-filters button").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        currentCat = btn.dataset.cat==="TODAS" ? null : btn.dataset.cat;
        renderListPage(body);
      });
    });
    bindNewsCardNav(body);
  }

  function renderArticlePage(body, slug){
    const n = NEWS.find(x=>x.slug===slug);
    if(!n){
      body.innerHTML = `
        <div class="news-empty">ARTÍCULO NO ENCONTRADO.</div>
        <div class="article-back"><button type="button" class="btn-secondary" id="newsBackBtn">← Volver a NEWS</button></div>`;
      body.querySelector("#newsBackBtn").addEventListener("click", ()=>{ currentSlug=null; updateHash(); render(); });
      return;
    }
    const shoe = findShoe(n.modeloId);

    document.title = (n.seo && n.seo.title) ? n.seo.title : `${n.titulo} — GATO LAB News`;
    setMetaDescription((n.seo && n.seo.metaDescription) ? n.seo.metaDescription : n.subtitulo || "");

    const specHTML = (n.fichaTecnica||[]).map(row=>`
      <div class="spec-item"><div class="spec-label">${row.campo}</div><div class="spec-value">${row.valor}</div></div>`).join("");
    const featuresHTML = (n.caracteristicas||[]).map(f=>`<div class="article-feature">${f}</div>`).join("");
    const prosHTML = (n.pros||[]).map(p=>`<li>${p}</li>`).join("");
    const contrasHTML = (n.contras||[]).map(c=>`<li>${c}</li>`).join("");
    const linksHTML = (n.enlaces && n.enlaces.length) ? `
      <div class="article-section">
        <h2>Enlaces</h2>
        <div class="article-links">${n.enlaces.map(l=>`<a href="${l.url}" target="_blank" rel="noopener">${l.texto||l.url} ↗</a>`).join("")}</div>
      </div>` : "";
    const heroPhoto = n.imagenPrincipal
      ? `<img src="${n.imagenPrincipal}" alt="${n.imagenAlt||""}" loading="lazy">`
      : shoeIcon();
    const productCardHTML = shoe ? `
      <div class="article-product-card">
        <span class="mini-badge">${shoePhotoHTML(shoe)}</span>
        <span class="mini-text">
          <span class="mini-brand">${shoe.marca}</span>
          <span class="mini-model">${shoe.modelo}</span>
          <div class="mini-specs mono">${shoe.precio} € aprox. · ${shoe.uso} · ${shoe.nivel}</div>
        </span>
        <button type="button" class="btn-secondary" id="viewModelBtn">Ver modelo →</button>
      </div>` : "";

    body.innerHTML = `
      <article class="article-page">
        <div class="article-eyebrow-row">
          <span class="news-cat-tag">${n.categoria}</span>
          <span class="news-date mono">${formatNewsDate(n.fecha)}</span>
        </div>
        <h1 class="display article-title">${n.titulo}</h1>
        <p class="article-subtitle">${n.subtitulo||""}</p>
        <div class="article-meta">
          ${shoe ? `<span>${shoe.marca} · ${shoe.modelo}</span>` : (n.marca ? `<span>${n.marca}</span>` : "")}
          <span>Por GATO LAB</span>
        </div>
        <div class="article-hero-photo" role="img" aria-label="${n.imagenAlt||""}">${heroPhoto}</div>

        <div class="article-body">${(n.texto||[]).map(p=>`<p>${p}</p>`).join("")}</div>

        ${productCardHTML}

        <div class="article-section">
          <h2>Ficha técnica</h2>
          <div class="article-spec-grid">${specHTML}</div>
        </div>

        <div class="article-section">
          <h2>Características principales</h2>
          <div class="article-features">${featuresHTML}</div>
        </div>

        <div class="article-section">
          <h2>¿Para quién es?</h2>
          <p class="section-lead">${n.paraQuien||""}</p>
          <div class="article-proscons">
            <div class="proscons-col pros"><h3>A favor</h3><ul>${prosHTML}</ul></div>
            <div class="proscons-col contras"><h3>A tener en cuenta</h3><ul>${contrasHTML}</ul></div>
          </div>
        </div>

        <div class="article-section">
          <h2>Veredicto GATO LAB</h2>
          <div class="article-verdict">
            <span class="verdict-tag">Opinión editorial — sin puntuación numérica</span>
            <p>${n.veredicto||""}</p>
          </div>
        </div>

        ${linksHTML}

        ${shoe ? relatedNewsHTML(shoe.id, n.slug) : ""}

        <div class="article-back">
          <button type="button" class="btn-secondary" id="newsBackBtn">← Volver a NEWS</button>
        </div>
      </article>
      <div class="ad-slot ad-infeed" aria-hidden="true">Espacio publicitario (Google AdSense · formato nativo)</div>`;

    body.querySelector("#newsBackBtn").addEventListener("click", ()=>{
      currentSlug = null;
      updateHash();
      render();
      window.scrollTo({ top:0, behavior:"instant" in window ? "instant" : "auto" });
    });
    if(shoe){
      body.querySelector("#viewModelBtn").addEventListener("click", ()=>{
        window.GatoLab.setView("home");
        window.GatoLab.openDetail(shoe.id);
      });
    }
    bindNewsCardNav(body);
  }

  function setMetaDescription(text){
    if(!text) return;
    let tag = document.querySelector('meta[name="description"]');
    if(!tag){
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", text);
  }

  function render(){
    const body = el("#newsBody");
    if(!body) return;
    if(currentSlug){ renderArticlePage(body, currentSlug); }
    else { renderListPage(body); }
  }

  window.GatoLabNews = {
    loadNews, render, setSlugFromHash, getSlug, goToList,
    relatedNewsHTML, bindRelatedNewsClicks
  };

  loadNews();
})();
