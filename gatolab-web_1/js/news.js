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

  // Título y descripción base de la página: se restauran al salir de un artículo
  const BASE_TITLE = document.title;
  const BASE_DESC = (document.querySelector('meta[name="description"]')||{}).content || "";
  function restoreBaseMeta(){
    document.title = BASE_TITLE;
    if(BASE_DESC) setMetaDescription(BASE_DESC);
  }

  const NEWS_CATEGORIES = ["NEW RELEASES","REVIEWS","PRODUCT ANALYSIS","CLIMBING SHOES","BRANDS"];
  // Nombre visible de cada categoría en cada idioma (en news.json se guardan en inglés)
  const CAT_LABELS = {
    "NEW RELEASES":     {es:"NOVEDADES", ca:"NOVETATS", en:"NEW RELEASES", fr:"NOUVEAUTÉS"},
    "REVIEWS":          {es:"RESEÑAS", ca:"RESSENYES", en:"REVIEWS", fr:"TESTS"},
    "PRODUCT ANALYSIS": {es:"ANÁLISIS DE PRODUCTO", ca:"ANÀLISI DE PRODUCTE", en:"PRODUCT ANALYSIS", fr:"ANALYSE PRODUIT"},
    "CLIMBING SHOES":   {es:"PIES DE GATO", ca:"PEUS DE GAT", en:"CLIMBING SHOES", fr:"CHAUSSONS D'ESCALADE"},
    "BRANDS":           {es:"MARCAS", ca:"MARQUES", en:"BRANDS", fr:"MARQUES"}
  };
  function catLabel(c){
    const e = CAT_LABELS[c];
    if(!e) return c || "";
    const L = (window.GatoLab && window.GatoLab.getLang) ? window.GatoLab.getLang() : "es";
    return e[L] || e.es || c;
  }
  const MESES = {
    es:["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"],
    ca:["GEN","FEB","MAR","ABR","MAI","JUN","JUL","AGO","SET","OCT","NOV","DES"],
    en:["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"],
    fr:["JANV","FÉVR","MARS","AVR","MAI","JUIN","JUIL","AOÛT","SEPT","OCT","NOV","DÉC"]
  };

  /* Textos fijos de NEWS en los cuatro idiomas. Los artículos se escriben en
     castellano en el panel, y sus traducciones van dentro de cada artículo, en
     el campo «traducciones» (ca / en / fr), también editable desde /admin/.
     Si un campo no está traducido, se muestra en castellano. */
  const UI = {
    tag:         {es:"NOTICIAS", ca:"NOTÍCIES", en:"NEWS", fr:"ACTUALITÉS"},
    photo:       {es:"Foto", ca:"Foto", en:"Photo", fr:"Photo"},
    photos:      {es:"Fotos", ca:"Fotos", en:"Photos", fr:"Photos"},
    gallery:     {es:"Galería de fotos", ca:"Galeria de fotos", en:"Photo gallery", fr:"Galerie photos"},
    video:       {es:"Vídeo", ca:"Vídeo", en:"Video", fr:"Vidéo"},
    playVideo:   {es:"Reproducir vídeo", ca:"Reprodueix el vídeo", en:"Play video", fr:"Lire la vidéo"},
    watchYt:     {es:"Ver en YouTube", ca:"Veure a YouTube", en:"Watch on YouTube", fr:"Voir sur YouTube"},
    enlargePhoto:{es:"Ampliar foto", ca:"Amplia la foto", en:"Enlarge photo", fr:"Agrandir la photo"},
    heroText:    {es:"Novedades, análisis técnico y reviews de pies de gato — conectado directamente con la base de datos de modelos de GATO LAB.", ca:"Novetats, anàlisi tècnica i reviews de peus de gat — connectat directament amb la base de dades de models de GATO LAB.", en:"News, technical analysis and reviews of climbing shoes — linked directly to the GATO LAB model database.", fr:"Nouveautés, analyses techniques et tests de chaussons d'escalade — directement reliés à la base de données de modèles GATO LAB."},
    loading:     {es:"CARGANDO NOTICIAS…", ca:"CARREGANT NOTÍCIES…", en:"LOADING NEWS…", fr:"CHARGEMENT DES ACTUALITÉS…"},
    failed:      {es:"NO SE HAN PODIDO CARGAR LAS NOTICIAS. INTÉNTALO DE NUEVO MÁS TARDE.", ca:"NO S'HAN POGUT CARREGAR LES NOTÍCIES. TORNA-HO A PROVAR MÉS TARD.", en:"THE NEWS COULD NOT BE LOADED. PLEASE TRY AGAIN LATER.", fr:"IMPOSSIBLE DE CHARGER LES ACTUALITÉS. RÉESSAIE PLUS TARD."},
    empty:       {es:"TODAVÍA NO HAY NOTICIAS.", ca:"ENCARA NO HI HA NOTÍCIES.", en:"NO NEWS YET.", fr:"PAS ENCORE D'ACTUALITÉS."},
    notFound:    {es:"ARTÍCULO NO ENCONTRADO.", ca:"ARTICLE NO TROBAT.", en:"ARTICLE NOT FOUND.", fr:"ARTICLE INTROUVABLE."},
    back:        {es:"← Volver a NEWS", ca:"← Tornar a NEWS", en:"← Back to NEWS", fr:"← Retour aux NEWS"},
    read:        {es:"Leer", ca:"Llegir", en:"Read", fr:"Lire"},
    readArticle: {es:"LEER ARTÍCULO", ca:"LLEGIR ARTICLE", en:"READ ARTICLE", fr:"LIRE L'ARTICLE"},
    related:     {es:"Más NEWS sobre este modelo", ca:"Més NEWS sobre aquest model", en:"More NEWS about this model", fr:"Plus de NEWS sur ce modèle"},
    byline:      {es:"Por GATO LAB", ca:"Per GATO LAB", en:"By GATO LAB", fr:"Par GATO LAB"},
    approx:      {es:"aprox.", ca:"aprox.", en:"approx.", fr:"env."},
    viewModel:   {es:"Ver modelo →", ca:"Veure model →", en:"See model →", fr:"Voir le modèle →"},
    specs:       {es:"Ficha técnica", ca:"Fitxa tècnica", en:"Specifications", fr:"Fiche technique"},
    features:    {es:"Características principales", ca:"Característiques principals", en:"Key features", fr:"Caractéristiques principales"},
    forWho:      {es:"¿Para quién es?", ca:"Per a qui és?", en:"Who is it for?", fr:"Pour qui ?"},
    pros:        {es:"A favor", ca:"A favor", en:"Pros", fr:"Points forts"},
    cons:        {es:"A tener en cuenta", ca:"A tenir en compte", en:"Things to consider", fr:"À prendre en compte"},
    verdict:     {es:"Veredicto GATO LAB", ca:"Veredicte GATO LAB", en:"GATO LAB verdict", fr:"Verdict GATO LAB"},
    verdictTag:  {es:"Opinión editorial — sin puntuación numérica", ca:"Opinió editorial — sense puntuació numèrica", en:"Editorial opinion — no numerical score", fr:"Avis éditorial — sans note chiffrée"},
    links:       {es:"Enlaces", ca:"Enllaços", en:"Links", fr:"Liens"},
    adSpace:     {es:"Espacio publicitario (Google AdSense · formato nativo)", ca:"Espai publicitari (Google AdSense · format natiu)", en:"Advertising space (Google AdSense · native format)", fr:"Espace publicitaire (Google AdSense · format natif)"}
  };
  const lang = () => (window.GatoLab && window.GatoLab.getLang) ? window.GatoLab.getLang() : "es";
  const ui = k => (UI[k] && (UI[k][lang()] || UI[k].es)) || k;
  const fl = (tipo, valor) => (window.GatoLab && window.GatoLab.filterLabel) ? window.GatoLab.filterLabel(tipo, valor) : valor;
  // ¿Tiene contenido? (texto no vacío, lista con elementos u objeto con algún valor)
  function filled(v){
    if(v == null) return false;
    if(typeof v === "string") return v.trim() !== "";
    if(Array.isArray(v)) return v.some(filled);
    if(typeof v === "object") return Object.values(v).some(filled);
    return true;
  }
  // Campo de un artículo en el idioma actual (si está traducido), si no en castellano
  function tx(n, field){
    const L = lang();
    const tr = L !== "es" && n.traducciones && n.traducciones[L];
    return (tr && filled(tr[field])) ? tr[field] : n[field];
  }

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
    return `${d} ${(MESES[lang()] || MESES.es)[m-1]} ${y}`;
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
        <h4>${ui("related")}</h4>
        ${related.map(r=>`
          <button type="button" class="related-news-item" data-news-slug="${r.slug}">
            <span class="related-news-title">${tx(r,"titulo")}</span>
            <span class="related-news-arrow">${ui("read")} →</span>
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
      ? `<img src="${n.imagenPrincipal}" alt="${tx(n,"imagenAlt")||""}" loading="lazy">`
      : shoeIcon();
    return `
      <article class="news-featured" data-news-slug="${n.slug}" tabindex="0" role="button" aria-label="${ui("read")}: ${tx(n,"titulo")}">
        <div class="news-featured-photo">${photo}</div>
        <div class="news-featured-body">
          <div class="news-featured-eyebrow">
            <span class="news-cat-tag">${ui("tag")}</span>
            <span class="news-date mono">${formatNewsDate(n.fecha)}</span>
          </div>
          ${shoe ? `<div class="news-featured-model">${shoe.marca} · ${shoe.modelo}</div>` : (n.marca ? `<div class="news-featured-model">${n.marca}</div>` : "")}
          <h2 class="news-featured-title">${tx(n,"titulo")}</h2>
          <p class="news-featured-excerpt">${tx(n,"subtitulo")||""}</p>
          <span class="news-read-link">${ui("readArticle")} →</span>
        </div>
      </article>`;
  }

  function newsCardHTML(n){
    const shoe = findShoe(n.modeloId);
    const photo = n.imagenPrincipal
      ? `<img src="${n.imagenPrincipal}" alt="${tx(n,"imagenAlt")||""}" loading="lazy">`
      : shoeIcon();
    return `
      <article class="news-card" data-news-slug="${n.slug}" tabindex="0" role="button" aria-label="${ui("read")}: ${tx(n,"titulo")}">
        <div class="news-card-photo">${photo}</div>
        <div class="news-card-body">
          <div class="news-card-eyebrow">
            <span class="news-cat-tag">${ui("tag")}</span>
            <span class="news-date mono">${formatNewsDate(n.fecha)}</span>
          </div>
          ${shoe ? `<div class="news-card-model">${shoe.marca} · ${shoe.modelo}</div>` : (n.marca ? `<div class="news-card-model">${n.marca}</div>` : "")}
          <div class="news-card-title">${tx(n,"titulo")}</div>
          <p class="news-card-excerpt">${tx(n,"subtitulo")||""}</p>
          <span class="news-read-link">${ui("readArticle")} →</span>
        </div>
      </article>`;
  }

  function renderListPage(body){
    restoreBaseMeta();
    // NEWS ya no se divide en categorías: todas las entradas son «Noticias»
    const sorted = NEWS.slice().sort((a,b)=> String(b.fecha).localeCompare(String(a.fecha)));

    let mainHTML;
    if(!loaded && !loadFailed){
      mainHTML = `<div class="news-empty">${ui("loading")}</div>`;
    } else if(loadFailed){
      mainHTML = `<div class="news-empty">${ui("failed")}</div>`;
    } else if(!sorted.length){
      mainHTML = `<div class="news-empty">${ui("empty")}</div>`;
    } else {
      const featured = sorted[0];
      const rest = sorted.slice(1);
      mainHTML = newsFeaturedHTML(featured) + (rest.length ? `<div class="news-grid">${rest.map(newsCardHTML).join("")}</div>` : "");
    }

    body.innerHTML = `
      <section class="news-hero">
        <div class="eyebrow">EDITORIAL</div>
        <h1 class="display">GATO LAB <em>News</em></h1>
        <p>${ui("heroText")}</p>
      </section>
      ${mainHTML}
      <div class="ad-slot ad-infeed" aria-hidden="true">${ui("adSpace")}</div>`;

    bindNewsCardNav(body);
  }

  /* ---------- Galería de fotos y vídeo de YouTube de un artículo ---------- */
  // Acepta enlaces youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID o /embed/ID
  function ytId(url){
    if(!url) return "";
    const m = String(url).match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  }
  const attr = s => String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
  /* Pie de foto: «Texto. Foto / Autor» (texto traducible; el autor/crédito no se traduce).
     creditoFoto firma la foto principal y creditoGaleria las fotos de la galería. */
  function captionHTML(text, credit, cls){
    text = String(text||"").trim(); credit = String(credit||"").trim();
    if(!text && !credit) return "";
    return `<figcaption class="photo-caption${cls ? " "+cls : ""}">${text}${text && credit ? " " : ""}${credit ? `<span class="photo-credit">${ui("photo")} / ${credit}</span>` : ""}</figcaption>`;
  }
  function galleryItems(n){
    const tr = tx(n,"galeriaPies");
    return (n.galeria||[]).map(g=> typeof g === "string" ? {imagen:g, pie:""} : (g ? {imagen:g.imagen||g.url, pie:g.pie||""} : null))
      .filter(g=> g && g.imagen)
      .map((g,i)=> ({ imagen:g.imagen, pie: (Array.isArray(tr) && tr[i]) ? tr[i] : g.pie }));
  }
  function galleryHTML(n){
    const items = galleryItems(n);
    const fotos = items.map(g=>g.imagen);
    if(!fotos.length) return "";
    const alt = attr(`${n.marca ? n.marca+" " : ""}${(findShoe(n.modeloId)||{}).modelo||""}`.trim() || tx(n,"titulo"));
    return `
        <div class="article-section">
          <h2>${ui("gallery")}</h2>
          <div class="article-gallery">${items.map((g,i)=>`
            <figure class="article-gallery-fig">
              <button type="button" class="article-gallery-item" data-index="${i}" aria-label="${ui("enlargePhoto")} ${i+1}/${fotos.length}">
                <img src="${attr(g.imagen)}" alt="${g.pie ? attr(g.pie) : alt+" — "+(i+1)}" loading="lazy">
              </button>
              ${captionHTML(g.pie, "")}
            </figure>`).join("")}
          </div>
          ${n.creditoGaleria ? `<p class="photo-caption gallery-credit"><span class="photo-credit">${ui("photos")} / ${n.creditoGaleria}</span></p>` : ""}
        </div>`;
  }
  function videoHTML(n){
    const id = ytId(n.video);
    if(!id) return "";
    return `
        <div class="article-section">
          <h2>${ui("video")}</h2>
          <div class="article-video" data-yt="${id}">
            <button type="button" class="article-video-btn" aria-label="${ui("playVideo")}">
              <img src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" alt="" loading="lazy" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'">
              <span class="article-video-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span>
            </button>
          </div>
          <a class="article-video-link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">${ui("watchYt")} ↗</a>
        </div>`;
  }
  function bindArticleMedia(body, n){
    const fotos = (n.galeria||[]).map(g=> typeof g === "string" ? g : (g && (g.imagen||g.url)) ).filter(Boolean);
    body.querySelectorAll(".article-gallery-item").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const i = Number(btn.dataset.index)||0;
        if(window.GatoLab && window.GatoLab.openLightbox) window.GatoLab.openLightbox(fotos, i, tx(n,"titulo"));
        else window.open(fotos[i], "_blank", "noopener");
      });
    });
    const box = body.querySelector(".article-video");
    if(box){
      box.querySelector(".article-video-btn").addEventListener("click", ()=>{
        const id = box.dataset.yt;
        box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${attr(tx(n,"titulo"))}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
      });
    }
  }

  function renderArticlePage(body, slug){
    const n = NEWS.find(x=>x.slug===slug);
    if(!n){
      body.innerHTML = `
        <div class="news-empty">${ui("notFound")}</div>
        <div class="article-back"><button type="button" class="btn-secondary" id="newsBackBtn">${ui("back")}</button></div>`;
      body.querySelector("#newsBackBtn").addEventListener("click", ()=>{ currentSlug=null; updateHash(); render(); });
      return;
    }
    const shoe = findShoe(n.modeloId);

    const seo = tx(n,"seo");
    document.title = (seo && seo.title) ? seo.title : `${tx(n,"titulo")} — GATO LAB News`;
    setMetaDescription((seo && seo.metaDescription) ? seo.metaDescription : tx(n,"subtitulo") || "");

    const specHTML = (tx(n,"fichaTecnica")||[]).map(row=>`
      <div class="spec-item"><div class="spec-label">${row.campo}</div><div class="spec-value">${row.valor}</div></div>`).join("");
    const featuresHTML = (tx(n,"caracteristicas")||[]).map(f=>`<div class="article-feature">${f}</div>`).join("");
    const prosHTML = (tx(n,"pros")||[]).map(p=>`<li>${p}</li>`).join("");
    const contrasHTML = (tx(n,"contras")||[]).map(c=>`<li>${c}</li>`).join("");
    const linksHTML = (n.enlaces && n.enlaces.length) ? `
      <div class="article-section">
        <h2>${ui("links")}</h2>
        <div class="article-links">${n.enlaces.map(l=>`<a href="${l.url}" target="_blank" rel="noopener">${l.texto||l.url} ↗</a>`).join("")}</div>
      </div>` : "";
    const heroPhoto = n.imagenPrincipal
      ? `<img src="${n.imagenPrincipal}" alt="${tx(n,"imagenAlt")||""}" loading="lazy">`
      : shoeIcon();
    const productCardHTML = shoe ? `
      <div class="article-product-card">
        <span class="mini-badge">${shoePhotoHTML(shoe)}</span>
        <span class="mini-text">
          <span class="mini-brand">${shoe.marca}</span>
          <span class="mini-model">${shoe.modelo}</span>
          <div class="mini-specs mono">${shoe.precio} € ${ui("approx")} · ${fl("uso", shoe.uso)} · ${fl("nivel", shoe.nivel)}</div>
        </span>
        <button type="button" class="btn-secondary" id="viewModelBtn">${ui("viewModel")}</button>
      </div>` : "";

    body.innerHTML = `
      <article class="article-page">
        <div class="article-eyebrow-row">
          <span class="news-cat-tag">${ui("tag")}</span>
          <span class="news-date mono">${formatNewsDate(n.fecha)}</span>
        </div>
        <h1 class="display article-title">${tx(n,"titulo")}</h1>
        <p class="article-subtitle">${tx(n,"subtitulo")||""}</p>
        <div class="article-meta">
          ${shoe ? `<span>${shoe.marca} · ${shoe.modelo}</span>` : (n.marca ? `<span>${n.marca}</span>` : "")}
          <span>${ui("byline")}</span>
        </div>
        <figure class="article-figure">
          <div class="article-hero-photo" role="img" aria-label="${tx(n,"imagenAlt")||""}">${heroPhoto}</div>
          ${n.imagenPrincipal ? captionHTML(tx(n,"pieFoto"), n.creditoFoto) : ""}
        </figure>

        <div class="article-body">${(tx(n,"texto")||[]).map(p=>`<p>${p}</p>`).join("")}</div>

        ${productCardHTML}

        ${galleryHTML(n)}

        ${videoHTML(n)}

        <div class="article-section">
          <h2>${ui("specs")}</h2>
          <div class="article-spec-grid">${specHTML}</div>
        </div>

        <div class="article-section">
          <h2>${ui("features")}</h2>
          <div class="article-features">${featuresHTML}</div>
        </div>

        <div class="article-section">
          <h2>${ui("forWho")}</h2>
          <p class="section-lead">${tx(n,"paraQuien")||""}</p>
          <div class="article-proscons">
            <div class="proscons-col pros"><h3>${ui("pros")}</h3><ul>${prosHTML}</ul></div>
            <div class="proscons-col contras"><h3>${ui("cons")}</h3><ul>${contrasHTML}</ul></div>
          </div>
        </div>

        <div class="article-section">
          <h2>${ui("verdict")}</h2>
          <div class="article-verdict">
            <span class="verdict-tag">${ui("verdictTag")}</span>
            <p>${tx(n,"veredicto")||""}</p>
          </div>
        </div>

        ${linksHTML}

        ${shoe ? relatedNewsHTML(shoe.id, n.slug) : ""}

        <div class="article-back">
          <button type="button" class="btn-secondary" id="newsBackBtn">${ui("back")}</button>
        </div>
      </article>
      <div class="ad-slot ad-infeed" aria-hidden="true">${ui("adSpace")}</div>`;

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
    bindArticleMedia(body, n);
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

  const newsView = document.getElementById("newsView");
  if(newsView && "MutationObserver" in window){
    new MutationObserver(()=>{ if(newsView.hidden) restoreBaseMeta(); })
      .observe(newsView, { attributes:true, attributeFilter:["hidden"] });
  }

  loadNews();
})();
