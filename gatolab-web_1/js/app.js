/* Gato Lab — lógica de catálogo, filtros y comparador (multi + 1 vs 1) */
(function(){
  "use strict";

  let SHOES = window.SHOES || [];
  let shoesLoaded = false; // se pone a true cuando content/shoes.json ya ha llegado
  const TALLAS = window.TALLAS || {};

  const LEVEL3 = { "Baja":1, "Media":2, "Alta":3, "Blanda":1, "Rígida":3 };
  function bars3(index, invert, accentClass){
    const i = invert ? (4 - index) : index;
    let out = `<span class="bars${accentClass?" accent":""}" aria-hidden="true">`;
    for(let n=1;n<=3;n++) out += `<i class="seg${n<=i?" on":""}"></i>`;
    out += '</span>';
    return out;
  }
  function asimetriaBars(s, accent){ return bars3(LEVEL3[s.asimetria]||2, false, accent); }
  function rigidezBars(s, accent){ return bars3(LEVEL3[s.rigidez]||2, false, accent); }
  function sensibilidadBars(s, accent){ return bars3(LEVEL3[s.rigidez]||2, true, accent); } // más blanda = más sensible

  /* ------------------------------------------------------------------ *
   * Radar / tela de araña — 5 ejes independientes por modelo:
   * agresividad (perfil), asimetría, rigidez, sensibilidad (grosor de
   * suela) y ajuste/volumen de horma. Cada eje va de 0 a 4.
   * ------------------------------------------------------------------ */
  const FORMA_LEVEL5 = {
    "Plana":0, "Casi plana":0, "Casi simétrica":0,
    "Moderada":1,
    "Moderada-agresiva":2,
    "Agresiva":3,
    "Muy agresiva":4
  };
  const ASIM_LEVEL5 = { "Baja":0, "Media":2, "Alta":4 };
  const RIGIDEZ_LEVEL5 = { "Blanda":0, "Media":2, "Rígida":4 };
  function computeGrosorRange(){
    const vals = SHOES.map(s=>s.grosor).filter(g=>g!=null);
    return vals.length ? { min:Math.min(...vals), max:Math.max(...vals) } : { min:3, max:5.5 };
  }
  let GROSOR_RANGE = computeGrosorRange();
  function grosorLevel(s){
    if(s.grosor==null) return 2; // sin dato fiable: valor neutro
    const { min, max } = GROSOR_RANGE;
    if(max===min) return 2;
    const t = (max - s.grosor) / (max - min); // más fina la suela = más sensibilidad
    return Math.max(0, Math.min(4, t*4));
  }
  function volumenLevel(s){
    const txt = (s.volumen||"").toLowerCase();
    if(!txt) return 2;
    const wide = /ancho|alto|amplio|\bhv\b/.test(txt);
    const narrow = /estrecho|bajo|\blv\b/.test(txt);
    if(wide && narrow) return 2;
    if(wide) return 4;
    if(narrow) return 0;
    return 2;
  }
  /* Valor de un eje del radar: si la zapatilla tiene un ajuste manual válido
     en s.radarOverride[key] (número entre 0 y 4), se usa ese; si no, el valor
     calculado automáticamente a partir de los demás datos, como hasta ahora.
     Así el radar siempre parte de los datos recogidos, y solo se aparta de
     ellos cuando alguien lo ha corregido a mano a propósito. */
  function radarValue(s, key, computed){
    const ov = s.radarOverride && s.radarOverride[key];
    return (typeof ov === "number" && isFinite(ov)) ? Math.max(0, Math.min(4, ov)) : computed;
  }
  function radarIsOverridden(s, key){
    const ov = s.radarOverride && s.radarOverride[key];
    return typeof ov === "number" && isFinite(ov);
  }
  function radarMetrics(s){
    return [
      { key:"agresividad", label:t("radarAgresividad"), value:radarValue(s,"agresividad",FORMA_LEVEL5[s.forma]??2), display:v("forma",s.forma), overridden:radarIsOverridden(s,"agresividad") },
      { key:"asimetria", label:t("lblAsimetria"), value:radarValue(s,"asimetria",ASIM_LEVEL5[s.asimetria]??2), display:v("asimetria",s.asimetria), overridden:radarIsOverridden(s,"asimetria") },
      { key:"rigidez", label:t("lblRigidez"), value:radarValue(s,"rigidez",RIGIDEZ_LEVEL5[s.rigidez]??2), display:v("rigidez",s.rigidez), overridden:radarIsOverridden(s,"rigidez") },
      { key:"sensibilidad", label:t("radarSensibilidad"), value:radarValue(s,"sensibilidad",grosorLevel(s)), display:s.grosor?`${s.grosor} mm`:t("notSpecified"), overridden:radarIsOverridden(s,"sensibilidad") },
      { key:"ajuste", label:t("radarAjuste"), value:radarValue(s,"ajuste",volumenLevel(s)), display:s.volumen||t("notSpecified"), overridden:radarIsOverridden(s,"ajuste") }
    ];
  }
  function radarSVG(entries){ // entries: [{s, colorVar}, ...] — 1 o 2 elementos
    const SIZE = 240, CX = 120, CY = 116, R = 84;
    const metrics = radarMetrics(entries[0].s);
    const n = metrics.length;
    const angleFor = i => -Math.PI/2 + i*(2*Math.PI/n);
    const pt = (i, frac) => {
      const a = angleFor(i);
      return [ CX + Math.cos(a)*R*frac, CY + Math.sin(a)*R*frac ];
    };
    let gridHTML = "";
    for(let ring=1; ring<=4; ring++){
      const frac = ring/4;
      const pts = metrics.map((m,i)=>pt(i,frac).join(",")).join(" ");
      gridHTML += `<polygon class="radar-grid" points="${pts}"></polygon>`;
    }
    let axesHTML = "", labelsHTML = "";
    metrics.forEach((m,i)=>{
      const [x2,y2] = pt(i,1);
      axesHTML += `<line class="radar-axis" x1="${CX}" y1="${CY}" x2="${x2}" y2="${y2}"></line>`;
      const [lx,ly] = pt(i,1.24);
      let anchor = "middle";
      if(lx < CX-4) anchor = "end"; else if(lx > CX+4) anchor = "start";
      labelsHTML += `<text class="radar-axis-label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle">${escapeXML(m.label)}</text>`;
    });
    let polysHTML = "";
    entries.forEach(({s,colorVar})=>{
      const ms = radarMetrics(s);
      const pts = ms.map((m,i)=>pt(i, Math.max(0.04, m.value/4)));
      const pointsAttr = pts.map(p=>p.join(",")).join(" ");
      polysHTML += `<polygon class="radar-poly" points="${pointsAttr}" style="fill:var(${colorVar});stroke:var(${colorVar})"></polygon>`;
      pts.forEach((p,i)=>{
        const manualSuffix = ms[i].overridden ? ` (${escapeXML(t("radarManualNote"))})` : "";
        polysHTML += `<circle class="radar-dot${ms[i].overridden?" radar-dot-manual":""}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" style="fill:var(${colorVar})"><title>${escapeXML(s.marca)} ${escapeXML(s.modelo)} — ${escapeXML(ms[i].label)}: ${escapeXML(ms[i].display)}${manualSuffix}</title></circle>`;
      });
    });
    return `<svg class="radar-svg" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="${escapeXML(t("radarTitle"))}">${gridHTML}${axesHTML}${polysHTML}${labelsHTML}</svg>`;
  }
  function escapeXML(str){
    return String(str==null?"":str).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }
  function radarCardHTML(entries){ // entries: [{s,colorVar,name}]
    const legendHTML = entries.length>1
      ? `<div class="radar-legend">${entries.map(e=>`<span class="radar-legend-item"><span class="radar-legend-dot" style="background:var(${e.colorVar})"></span>${escapeXML(e.name)}</span>`).join("")}</div>`
      : "";
    const anyManual = entries.some(({s})=>radarMetrics(s).some(m=>m.overridden));
    return `<div class="radar-card">
      <h4>${t("radarTitle")}</h4>
      <div class="radar-wrap">
        ${radarSVG(entries)}
        ${legendHTML}
        <p class="radar-note">${t("radarNote")}${anyManual?` ${escapeXML(t("radarManualLegend"))}`:""}</p>
      </div>
    </div>`;
  }

  function construccion(s){
    if(s.rigidez === "Blanda") return "Slip-lasted (flexible)";
    if(s.rigidez === "Rígida") return "Board-lasted (estructurada)";
    return "Mixta (semi-estructurada)";
  }
  function features(s){
    const c = getCaracteristicas(s);
    if(c && c.length) return c;
    return [
      `${t("lblCierre")} ${s.cierre.toLowerCase()} · ${t("lblPerfil").toLowerCase()} ${v("forma",s.forma).toLowerCase()}`,
      `${t("lblTipoSuela")} ${s.goma}${s.grosor?` (${s.grosor}mm)`:""}`,
      `${t("lblAsimetria")} ${v("asimetria",s.asimetria).toLowerCase()} · ${t("lblNivel").toLowerCase()} ${v("nivel",s.nivel).toLowerCase()}`
    ];
  }

  const USO_OPTIONS = ["Rocódromo","Todoterreno","Deportiva","Bloque","Fisura/Trad","Competición","Velocidad"];
  // Un modelo puede servir para varios tipos de escalada: "usos" es la lista completa
  // (content/shoes.json) y "uso" el principal, que siempre va primero.
  function usosOf(s){
    const extra = Array.isArray(s.usos) ? s.usos : [];
    return [...new Set([s.uso, ...extra].filter(Boolean))];
  }
  function usosLabel(s){ return usosOf(s).map(u=>v("uso",u)).join(" · "); }
  // Orden del catálogo en la portada: primero los modelos con "destacado" (1 = el más
  // famoso/vendido), luego el resto; en todo momento se evita repetir una marca que haya
  // salido en las 3 posiciones anteriores, para que las marcas queden intercaladas.
  let orderedCache = null, orderedFor = null;
  function orderedShoes(){
    if(orderedCache && orderedFor === SHOES) return orderedCache;
    const hash = str => { let h = 2166136261; for(const c of str){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
    const key = s => (typeof s.destacado === "number" && s.destacado > 0) ? [0, s.destacado] : [1, hash(s.id)];
    const pool = SHOES.slice().sort((x,y)=>{ const kx = key(x), ky = key(y); return kx[0]-ky[0] || kx[1]-ky[1]; });
    const out = [], recent = [];
    while(pool.length){
      let i = pool.findIndex(s=>!recent.includes(s.marca));
      if(i < 0) i = 0;
      const [s] = pool.splice(i, 1);
      out.push(s); recent.push(s.marca); if(recent.length > 3) recent.shift();
    }
    orderedCache = out; orderedFor = SHOES;
    return out;
  }
  function usosTagsHTML(s){ return usosOf(s).map(u=>`<span class="tag">${v("uso",u)}</span>`).join(""); }
  const NIVEL_OPTIONS = ["Iniciación","Intermedio","Avanzado"];
  // Cierre simplificado para el filtro: el dato técnico exacto (s.cierre) se sigue mostrando
  // tal cual en la ficha, la tabla y el comparador — esto solo agrupa en 4 categorías claras.
  function cierreTipo(c){
    const low = (c||"").toLowerCase();
    const hasCordones = low.includes("cordon");
    const hasVelcro = low.includes("velcro") || low.includes("correa");
    const hasElastico = low.includes("elástic") || low.includes("elastic") || low.includes("slipper") || low.includes("footwrap");
    if(hasCordones && hasVelcro) return "Cordones + velcro";
    if(hasCordones) return "Cordones";
    if(hasElastico) return "Slip-on / elástico";
    return "Velcro / correas";
  }
  function computeCierreOptions(){
    return ["Cordones","Cordones + velcro","Velcro / correas","Slip-on / elástico"].filter(c=>SHOES.some(s=>cierreTipo(s.cierre)===c));
  }
  let CIERRE_OPTIONS = computeCierreOptions();
  const FORMA_ORDER = ["Plana","Casi simétrica","Moderada","Moderada-agresiva","Casi plana","Agresiva","Muy agresiva"];
  function computeFormaOptions(){
    return FORMA_ORDER.filter(f=>SHOES.some(s=>s.forma===f));
  }
  let FORMA_OPTIONS = computeFormaOptions();
  function computeMarcas(){
    return [...new Set(SHOES.map(s=>s.marca))].sort();
  }
  let MARCAS = computeMarcas();

  const LANGS = ["es","ca","en","fr"];

  const STRINGS = {
    navHome: {es:"Home", ca:"Inici", en:"Home", fr:"Accueil"},
    navCompare: {es:"Comparador", ca:"Comparador", en:"Compare", fr:"Comparateur"},
    navNews: {es:"News", ca:"Notícies", en:"News", fr:"Actus"},
    navAbout: {es:"Sobre nosotros", ca:"Sobre nosaltres", en:"About us", fr:"À propos"},
    kidsFlag: {es:"Niños", ca:"Nens", en:"Kids", fr:"Enfants"},
    sealName: {es:"Sello GATO LAB", ca:"Segell GATO LAB", en:"GATO LAB Seal", fr:"Label GATO LAB"},
    sealExplain: {es:"Nuestros pies de gato estrella: los modelos que recomendamos especialmente por su rendimiento, calidad y relación calidad-precio.", ca:"Els nostres peus de gat estrella: els models que recomanem especialment pel seu rendiment, qualitat i relació qualitat-preu.", en:"Our star climbing shoes: the models we especially recommend for their performance, quality and value for money.", fr:"Nos chaussons vedettes : les modèles que nous recommandons tout particulièrement pour leurs performances, leur qualité et leur rapport qualité-prix."},
    searchPlaceholder: {es:"Busca marca o modelo… (ej. “Miura”, “Scarpa”)", ca:"Cerca marca o model… (ex. “Miura”, “Scarpa”)", en:"Search brand or model… (e.g. “Miura”, “Scarpa”)", fr:"Recherche marque ou modèle… (ex. « Miura », « Scarpa »)"},
    filtersTitle: {es:"Filtros", ca:"Filtres", en:"Filters", fr:"Filtres"},
    filtersToggleLabel: {es:"FILTROS", ca:"FILTRES", en:"FILTERS", fr:"FILTRES"},
    filterLabelMarca: {es:"Marca", ca:"Marca", en:"Brand", fr:"Marque"},
    filterLabelNivel: {es:"Nivel", ca:"Nivell", en:"Level", fr:"Niveau"},
    filterLabelCierre: {es:"Cierre", ca:"Tancament", en:"Closure", fr:"Fermeture"},
    filterLabelPerfil: {es:"Perfil", ca:"Perfil", en:"Shape", fr:"Profil"},
    resetFilters: {es:"Quitar todos los filtros", ca:"Treu tots els filtres", en:"Clear all filters", fr:"Supprimer tous les filtres"},
    adSpace: {es:"Espacio publicitario", ca:"Espai publicitari", en:"Advertising space", fr:"Espace publicitaire"},
    priceApprox: {es:"aprox.", ca:"aprox.", en:"approx.", fr:"environ"},
    duelTitle: {es:"Comparador 1 vs 1", ca:"Comparador 1 vs 1", en:"1 vs 1 comparator", fr:"Comparateur 1 contre 1"},
    duelDesc: {
      es:"Elige dos modelos y compáralos en detalle: precio, peso, cierre, construcción, asimetría, perfil, rigidez, sensibilidad, suela, volumen, uso y nivel recomendado.",
      ca:"Tria dos models i compara'ls en detall: preu, pes, tancament, construcció, asimetria, perfil, rigidesa, sensibilitat, sola, volum, ús i nivell recomanat.",
      en:"Pick two models and compare them in detail: price, weight, closure, construction, asymmetry, shape, stiffness, sensitivity, rubber, volume, use and recommended level.",
      fr:"Choisis deux modèles et compare-les en détail : prix, poids, fermeture, construction, asymétrie, profil, rigidité, sensibilité, gomme, volume, usage et niveau recommandé."
    },
    pickerLabel1: {es:"Elige el modelo 01", ca:"Tria el model 01", en:"Select model 01", fr:"Choisis le modèle 01"},
    pickerLabel2: {es:"Elige el modelo 02", ca:"Tria el model 02", en:"Select model 02", fr:"Choisis le modèle 02"},
    compareTabDuel: {es:"1 vs 1", ca:"1 vs 1", en:"1 vs 1", fr:"1 contre 1"},
    compareTabSizes: {es:"Tallas", ca:"Talles", en:"Sizes", fr:"Tailles"},
    sizesTitle: {es:"Comparador de tallas", ca:"Comparador de talles", en:"Size comparator", fr:"Comparateur de pointures"},
    sizesDesc: {
      es:"Indica tu marca y tu talla habitual: te decimos la talla equivalente aproximada en las demás marcas, calculada a partir de la longitud de pie (cm) de cada tabla oficial.",
      ca:"Indica la teva marca i la teva talla habitual: et diem la talla equivalent aproximada a les altres marques, calculada a partir de la longitud de peu (cm) de cada taula oficial.",
      en:"Enter your brand and usual size: we'll show the approximate equivalent size in other brands, calculated from each brand's official foot-length (cm) chart.",
      fr:"Indique ta marque et ta pointure habituelle : nous te donnons la pointure équivalente approximative chez les autres marques, calculée à partir de la longueur de pied (cm) de chaque tableau officiel."
    },
    sizesBrandLabel: {es:"Marca", ca:"Marca", en:"Brand", fr:"Marque"},
    sizesValueLabel: {es:"Talla", ca:"Talla", en:"Size", fr:"Pointure"},
    sizeDisclaimer: {
      es:"Equivalencia orientativa por longitud de pie: cada horma (last) ajusta de forma distinta, así que es habitual subir o bajar media talla al cambiar de marca aunque la longitud de pie coincida. Antes de comprar sin probar, consulta también la guía de tallaje de la tienda.",
      ca:"Equivalència orientativa per longitud de peu: cada horma (last) ajusta de forma diferent, així que és habitual pujar o baixar mitja talla en canviar de marca encara que la longitud de peu coincideixi. Abans de comprar sense provar, consulta també la guia de talles de la botiga.",
      en:"Indicative equivalence by foot length: each last fits differently, so it's common to go up or down half a size when switching brands even if foot length matches. Before buying without trying it on, also check the retailer's own sizing guide.",
      fr:"Équivalence indicative par longueur de pied : chaque forme (last) chausse différemment, il est donc courant de monter ou descendre d'une demi-pointure en changeant de marque même si la longueur de pied correspond. Avant d'acheter sans essayer, consulte aussi le guide des tailles du revendeur."
    },
    pickerPlaceholder: {es:"Busca marca, modelo, uso…", ca:"Cerca marca, model, ús…", en:"Search brand, model, use…", fr:"Recherche marque, modèle, usage…"},
    pickerChange: {es:"Cambiar", ca:"Canviar", en:"Change", fr:"Changer"},
    trayHint: {es:"Elige hasta 4 para comparar", ca:"Tria fins a 4 per comparar", en:"Pick up to 4 to compare", fr:"Choisis jusqu'à 4 modèles à comparer"},
    compareBtnLabel: {es:"Comparar", ca:"Comparar", en:"Compare", fr:"Comparer"},
    footerDisclaimer: {
      es:"GATO LAB ES UNA BASE DE DATOS COMPARATIVA, NO UNA TIENDA: AQUÍ NO SE VENDE NI SE COMPRA NADA. LOS PRECIOS, PESOS Y TALLAS SON ORIENTATIVOS Y PUEDEN VARIAR SEGÚN TIENDA, VERSIÓN Y TALLA. DATOS RECOPILADOS DE FICHAS TÉCNICAS, GUÍAS DE TALLAJE Y BASES DE DATOS DE MATERIAL PÚBLICAS. GATO LAB ES UN PROYECTO INDEPENDIENTE Y NO ESTÁ AFILIADO A LAS MARCAS MOSTRADAS.",
      ca:"GATO LAB ÉS UNA BASE DE DADES COMPARATIVA, NO UNA BOTIGA: AQUÍ NO ES VEN NI ES COMPRA RES. ELS PREUS, PESOS I TALLES SÓN ORIENTATIUS I PODEN VARIAR SEGONS BOTIGA, VERSIÓ I TALLA. DADES RECOPILADES DE FITXES TÈCNIQUES, GUIES DE TALLES I BASES DE DADES DE MATERIAL PÚBLIQUES. GATO LAB ÉS UN PROJECTE INDEPENDENT I NO ESTÀ AFILIAT A LES MARQUES MOSTRADES.",
      en:"GATO LAB IS A COMPARISON DATABASE, NOT A STORE: NOTHING IS SOLD OR BOUGHT HERE. PRICES, WEIGHTS AND SIZES ARE INDICATIVE AND MAY VARY BY RETAILER, VERSION AND SIZE. DATA COMPILED FROM OFFICIAL SPEC SHEETS, SIZING GUIDES AND PUBLIC GEAR DATABASES. GATO LAB IS AN INDEPENDENT PROJECT AND IS NOT AFFILIATED WITH THE BRANDS SHOWN.",
      fr:"GATO LAB EST UNE BASE DE DONNÉES COMPARATIVE, PAS UNE BOUTIQUE : RIEN N'EST VENDU NI ACHETÉ ICI. LES PRIX, POIDS ET POINTURES SONT INDICATIFS ET PEUVENT VARIER SELON LE REVENDEUR, LA VERSION ET LA POINTURE. DONNÉES COMPILÉES À PARTIR DE FICHES TECHNIQUES OFFICIELLES, GUIDES DE POINTURE ET BASES DE DONNÉES MATÉRIEL PUBLIQUES. GATO LAB EST UN PROJET INDÉPENDANT ET N'EST AFFILIÉ À AUCUNE DES MARQUES PRÉSENTÉES."
    },
    emptyStateHTML: {
      es:"NINGÚN MODELO COINCIDE CON ESTOS FILTROS.<br>PRUEBA A QUITAR ALGUNO.",
      ca:"CAP MODEL COINCIDEIX AMB AQUESTS FILTRES.<br>PROVA DE TREURE'N ALGUN.",
      en:"NO MODEL MATCHES THESE FILTERS.<br>TRY REMOVING ONE.",
      fr:"AUCUN MODÈLE NE CORRESPOND À CES FILTRES.<br>ESSAIE D'EN RETIRER UN."
    },
    catalogLoadingHTML: {
      es:"CARGANDO CATÁLOGO…",
      ca:"CARREGANT CATÀLEG…",
      en:"LOADING CATALOG…",
      fr:"CHARGEMENT DU CATALOGUE…"
    },
    suggestionEmpty: {es:"Sin resultados. Prueba otra marca, modelo o uso.", ca:"Sense resultats. Prova una altra marca, model o ús.", en:"No results. Try another brand, model or use.", fr:"Aucun résultat. Essaie une autre marque, modèle ou usage."},
    duelEmptyHTML: {es:"ELIGE DOS MODELOS ARRIBA PARA VER LA COMPARATIVA COMPLETA.", ca:"TRIA DOS MODELS A DALT PER VEURE LA COMPARATIVA COMPLETA.", en:"PICK TWO MODELS ABOVE TO SEE THE FULL COMPARISON.", fr:"CHOISIS DEUX MODÈLES CI-DESSUS POUR VOIR LA COMPARAISON COMPLÈTE."},
    duelNote: {
      es:"*Sensibilidad y construcción estimadas a partir de la rigidez de la suela. Peso y tallas son orientativos y pueden variar por versión — ver aviso al final de la página.",
      ca:"*Sensibilitat i construcció estimades a partir de la rigidesa de la sola. El pes i les talles són orientatius i poden variar segons la versió — vegeu l'avís al final de la pàgina.",
      en:"*Sensitivity and construction are estimated from sole stiffness. Weight and sizes are indicative and may vary by version — see the notice at the bottom of the page.",
      fr:"*Sensibilité et construction estimées à partir de la rigidité de la semelle. Le poids et les pointures sont indicatifs et peuvent varier selon la version — voir l'avis en bas de page."
    },
    cardAriaSuffix: {es:" — ver ficha", ca:" — veure fitxa", en:" — view details", fr:" — voir la fiche"},
    cardAdded: {es:"Añadido", ca:"Afegit", en:"Added", fr:"Ajouté"},
    cardCompare: {es:"Comparar", ca:"Comparar", en:"Compare", fr:"Comparer"},
    trayRemoveAria: {es:"Quitar", ca:"Treu", en:"Remove", fr:"Retirer"},
    detailClose: {es:"Cerrar", ca:"Tanca", en:"Close", fr:"Fermer"},
    detailRemoveCompare: {es:"Quitar de comparar", ca:"Treu de comparar", en:"Remove from compare", fr:"Retirer du comparatif"},
    detailAddCompare: {es:"Añadir a comparar", ca:"Afegeix a comparar", en:"Add to compare", fr:"Ajouter au comparatif"},
    detailDuelBtn: {es:"Comparar 1 vs 1", ca:"Comparador 1 vs 1", en:"1 vs 1 compare", fr:"Comparer 1 contre 1"},
    compareEmptyTitle: {es:"TODAVÍA NO HAY NADA QUE COMPARAR", ca:"ENCARA NO HI HA RES PER COMPARAR", en:"NOTHING TO COMPARE YET", fr:"RIEN À COMPARER POUR L'INSTANT"},
    compareEmptyDesc: {
      es:'Pulsa "Comparar" en dos o más fichas del catálogo para verlos aquí lado a lado.',
      ca:'Prem "Comparar" en dues o més fitxes del catàleg per veure-les aquí costat a costat.',
      en:'Tap "Compare" on two or more cards in the catalog to see them here side by side.',
      fr:'Appuie sur « Comparer » sur deux fiches ou plus du catalogue pour les voir ici côte à côte.'
    },
    compareTitle: {es:"COMPARATIVA", ca:"COMPARATIVA", en:"COMPARISON", fr:"COMPARATIF"},
    compareLegend: {
      es:"Las celdas en morado señalan dónde difieren los modelos elegidos. *Sensibilidad estimada a partir de la rigidez de la suela.",
      ca:"Les cel·les en lila indiquen on difereixen els models triats. *Sensibilitat estimada a partir de la rigidesa de la sola.",
      en:"Purple cells show where the chosen models differ. *Sensitivity estimated from sole stiffness.",
      fr:"Les cellules violettes indiquent où les modèles choisis diffèrent. *Sensibilité estimée à partir de la rigidité de la semelle."
    },
    compareColHeader: {es:"Característica", ca:"Característica", en:"Feature", fr:"Caractéristique"},
    weightNotAvailable: {es:"No disponible", ca:"No disponible", en:"Not available", fr:"Non disponible"},
    notSpecified: {es:"No especificado", ca:"No especificat", en:"Not specified", fr:"Non spécifié"},
    lblPrecio: {es:"Precio aprox.", ca:"Preu aprox.", en:"Approx. price", fr:"Prix approx."},
    lblPeso: {es:"Peso", ca:"Pes", en:"Weight", fr:"Poids"},
    lblCierre: {es:"Cierre", ca:"Tancament", en:"Closure", fr:"Fermeture"},
    lblPerfil: {es:"Perfil", ca:"Perfil", en:"Shape", fr:"Profil"},
    lblGoma: {es:"Goma", ca:"Goma", en:"Rubber", fr:"Gomme"},
    lblTipoSuela: {es:"Tipo de suela", ca:"Tipus de sola", en:"Rubber type", fr:"Type de gomme"},
    lblVolumen: {es:"Volumen", ca:"Volum", en:"Volume", fr:"Volume"},
    lblAsimetria: {es:"Asimetría", ca:"Asimetria", en:"Asymmetry", fr:"Asymétrie"},
    lblRigidezSuela: {es:"Rigidez de suela", ca:"Rigidesa de la sola", en:"Sole stiffness", fr:"Rigidité de la semelle"},
    lblRigidez: {es:"Rigidez", ca:"Rigidesa", en:"Stiffness", fr:"Rigidité"},
    lblSensibilidad: {es:"Sensibilidad*", ca:"Sensibilitat*", en:"Sensitivity*", fr:"Sensibilité*"},
    lblConstruccion: {es:"Construcción*", ca:"Construcció*", en:"Construction*", fr:"Construction*"},
    lblForro: {es:"Forro", ca:"Folre", en:"Lining", fr:"Doublure"},
    lblGrosorSuela: {es:"Grosor de suela", ca:"Gruix de la sola", en:"Sole thickness", fr:"Épaisseur de la semelle"},
    lblTipoEscalada: {es:"Tipo de escalada", ca:"Tipus d'escalada", en:"Climbing type", fr:"Type d'escalade"},
    lblNivel: {es:"Nivel", ca:"Nivell", en:"Level", fr:"Niveau"},
    lblNivelRecomendado: {es:"Nivel recomendado", ca:"Nivell recomanat", en:"Recommended level", fr:"Niveau recommandé"},
    lblTallasDisponibles: {es:"Tallas disponibles", ca:"Talles disponibles", en:"Available sizes", fr:"Tailles disponibles"},
    lblCaracteristicasClave: {es:"Características clave", ca:"Característiques clau", en:"Key features", fr:"Caractéristiques clés"},
    lblParaQuien: {es:"¿Para quién es?", ca:"Per a qui és?", en:"Who is it for?", fr:"Pour qui ?"},
    radarTitle: {es:"Perfil visual", ca:"Perfil visual", en:"Visual profile", fr:"Profil visuel"},
    radarAgresividad: {es:"Agresividad", ca:"Agressivitat", en:"Aggressiveness", fr:"Agressivité"},
    radarSensibilidad: {es:"Sensibilidad", ca:"Sensibilitat", en:"Sensitivity", fr:"Sensibilité"},
    radarAjuste: {es:"Ajuste", ca:"Ajust", en:"Fit", fr:"Chaussant"},
    radarNote: {
      es:"Agresividad según el perfil de la horma; sensibilidad estimada a partir del grosor de la suela (más fina = más sensibilidad); ajuste según el volumen de horma (estrecho–ancho). Escala orientativa de 0 a 4 en cada eje.",
      ca:"Agressivitat segons el perfil de l'horma; sensibilitat estimada a partir del gruix de la sola (més fina = més sensibilitat); ajust segons el volum d'horma (estret–ample). Escala orientativa de 0 a 4 en cada eix.",
      en:"Aggressiveness from the last's shape; sensitivity estimated from sole thickness (thinner = more sensitivity); fit from last volume (narrow–wide). Indicative 0–4 scale on each axis.",
      fr:"Agressivité selon le profil de la forme; sensibilité estimée à partir de l'épaisseur de la semelle (plus fine = plus de sensibilité); chaussant selon le volume de la forme (étroit–large). Échelle indicative de 0 à 4 par axe."
    },
    radarManualNote: {es:"ajustado a mano", ca:"ajustat a mà", en:"manually adjusted", fr:"ajusté manuellement"},
    radarManualLegend: {
      es:"Los puntos con borde discontinuo se han corregido a mano.",
      ca:"Els punts amb vora discontínua s'han corregit a mà.",
      en:"Dots with a dashed outline have been manually corrected.",
      fr:"Les points au contour discontinu ont été corrigés manuellement."
    },
    lightboxOpen: {es:"Ampliar foto", ca:"Amplia la foto", en:"Enlarge photo", fr:"Agrandir la photo"},
    lightboxThumb: {es:"Ver foto", ca:"Veure foto", en:"View photo", fr:"Voir la photo"},
    lightboxPrev: {es:"Foto anterior", ca:"Foto anterior", en:"Previous photo", fr:"Photo précédente"},
    lightboxNext: {es:"Foto siguiente", ca:"Foto següent", en:"Next photo", fr:"Photo suivante"}
  };

  const VOCAB = {
    forma: {
      "Plana": {ca:"Plana", en:"Flat", fr:"Plate"},
      "Casi simétrica": {ca:"Quasi simètrica", en:"Almost symmetric", fr:"Quasi symétrique"},
      "Moderada": {ca:"Moderada", en:"Moderate", fr:"Modérée"},
      "Moderada-agresiva": {ca:"Moderada-agressiva", en:"Moderate-aggressive", fr:"Modérée-agressive"},
      "Casi plana": {ca:"Quasi plana", en:"Almost flat", fr:"Quasi plate"},
      "Agresiva": {ca:"Agressiva", en:"Aggressive", fr:"Agressive"},
      "Muy agresiva": {ca:"Molt agressiva", en:"Very aggressive", fr:"Très agressive"}
    },
    asimetria: {
      "Baja": {ca:"Baixa", en:"Low", fr:"Faible"},
      "Media": {ca:"Mitjana", en:"Medium", fr:"Moyenne"},
      "Alta": {ca:"Alta", en:"High", fr:"Élevée"}
    },
    rigidez: {
      "Blanda": {ca:"Tova", en:"Soft", fr:"Souple"},
      "Media": {ca:"Mitjana", en:"Medium", fr:"Moyenne"},
      "Rígida": {ca:"Rígida", en:"Stiff", fr:"Rigide"}
    },
    uso: {
      "Rocódromo": {ca:"Rocòdrom", en:"Gym", fr:"Salle"},
      "Todoterreno": {ca:"Tot terreny", en:"All-round", fr:"Polyvalente"},
      "Deportiva": {ca:"Esportiva", en:"Sport", fr:"Sportive"},
      "Bloque": {ca:"Bloc", en:"Bouldering", fr:"Bloc"},
      "Fisura/Trad": {ca:"Fissura/Trad", en:"Crack/Trad", fr:"Fissure/Trad"},
      "Competición": {ca:"Competició", en:"Competition", fr:"Compétition"},
      "Velocidad": {ca:"Velocitat", en:"Speed", fr:"Vitesse"}
    },
    nivel: {
      "Iniciación": {ca:"Iniciació", en:"Beginner", fr:"Débutant"},
      "Intermedio": {ca:"Intermedi", en:"Intermediate", fr:"Intermédiaire"},
      "Avanzado": {ca:"Avançat", en:"Advanced", fr:"Avancé"}
    },
    forro: {
      "Forrado": {ca:"Folrat", en:"Lined", fr:"Doublée"},
      "Sin forro": {ca:"Sense folre", en:"Unlined", fr:"Non doublée"},
      "Parcialmente forrado": {ca:"Parcialment folrat", en:"Partially lined", fr:"Partiellement doublée"}
    },
    cierreTipo: {
      "Cordones": {ca:"Cordons", en:"Laces", fr:"Lacets"},
      "Cordones + velcro": {ca:"Cordons + velcro", en:"Laces + velcro", fr:"Lacets + velcro"},
      "Velcro / correas": {ca:"Velcro / corretges", en:"Velcro / straps", fr:"Velcro / sangles"},
      "Slip-on / elástico": {ca:"Slip-on / elàstic", en:"Slip-on / elastic", fr:"Slip-on / élastique"}
    }
  };

  let LANG = "es";
  try{
    const saved = localStorage.getItem("gatolab_lang");
    if(LANGS.includes(saved)) LANG = saved;
  }catch(e){}
  document.documentElement.lang = LANG;

  function t(key){
    const entry = STRINGS[key];
    if(!entry) return key;
    return entry[LANG] || entry.es || "";
  }
  function v(cat, val){
    if(val==null || val==="") return val;
    const map = VOCAB[cat];
    if(!map) return val;
    const entry = map[val];
    if(!entry) return val;
    return entry[LANG] || val;
  }
  /* Lee un texto editable desde content/site.json (window.SITE_TEXT), por
     ejemplo siteText("comparador.tituloDuelo", "Comparador 1 vs 1"). Si el
     archivo no ha cargado todavía, la ruta no existe o el valor está vacío,
     devuelve el texto de "fallback" (el mismo que ya había escrito a mano
     en el HTML/JS), así que nunca desaparece contenido de la página. */
  function siteText(path, fallback){
    try{
      let obj = window.SITE_TEXT;
      const parts = path.split(".");
      for(let i=0;i<parts.length;i++){
        if(obj==null) return fallback;
        obj = obj[parts[i]];
      }
      return (obj==null || obj==="") ? fallback : obj;
    }catch(e){ return fallback; }
  }
  /* Aplica a la interfaz los textos editables del panel (colección "TEXTOS
     DEL SITIO" en /admin/, guardados en content/site.json): cabeceras,
     párrafos de "Sobre nosotros", contacto y pie de página. Se llama cada
     vez que se repinta la interfaz (ver applyStaticI18n) — si SITE_TEXT
     todavía no ha llegado o le falta algún campo, cada elemento conserva el
     texto que ya tenía. */
  function applySiteTexts(){
    const bt = el("#brandTagline"); if(bt) bt.textContent = siteText("general.tagline", bt.textContent);
    const he = el("#homeEyebrow"); if(he) he.textContent = siteText("inicio.eyebrow", he.textContent);
    const ae = el("#aboutEyebrow"); if(ae) ae.textContent = siteText("sobreNosotros.eyebrow", ae.textContent);
    const ct = el("#contactTitle"); if(ct) ct.textContent = siteText("sobreNosotros.contactoTitulo", ct.textContent);
    const ch = el("#contactHint"); if(ch) ch.textContent = siteText("sobreNosotros.contactoAyuda", ch.textContent);
    const ac = el("#aboutContent");
    const parrafos = siteText("sobreNosotros.parrafos", null);
    if(ac && Array.isArray(parrafos) && parrafos.length){
      ac.innerHTML = parrafos.map(p => `<p>${escapeXML(p)}</p>`).join("");
    }
    STRINGS.duelTitle.es = siteText("comparador.tituloDuelo", STRINGS.duelTitle.es);
    STRINGS.duelDesc.es = siteText("comparador.descripcionDuelo", STRINGS.duelDesc.es);
    STRINGS.sizesTitle.es = siteText("comparador.tituloTallas", STRINGS.sizesTitle.es);
    STRINGS.sizesDesc.es = siteText("comparador.descripcionTallas", STRINGS.sizesDesc.es);
    STRINGS.sizeDisclaimer.es = siteText("comparador.avisoTallas", STRINGS.sizeDisclaimer.es);
    STRINGS.footerDisclaimer.es = siteText("footer.disclaimer", STRINGS.footerDisclaimer.es);
  }
  function labelForFilterValue(kind, opt){
    if(kind==="cierre") return v("cierreTipo", opt);
    if(kind==="nivel") return v("nivel", opt);
    if(kind==="forma") return v("forma", opt);
    return opt;
  }
  function getResumen(s){
    if(LANG!=="es" && s.resumen_i18n && s.resumen_i18n[LANG]) return s.resumen_i18n[LANG];
    return s.resumen;
  }
  function getCaracteristicas(s){
    if(LANG!=="es" && s.caracteristicas_i18n && s.caracteristicas_i18n[LANG]) return s.caracteristicas_i18n[LANG];
    return s.caracteristicas;
  }
  function getParaQuien(s){
    if(LANG!=="es" && s.para_quien_i18n && s.para_quien_i18n[LANG]) return s.para_quien_i18n[LANG];
    return s.para_quien;
  }
  function updateHeroText(){
    const p = document.querySelector(".hero p");
    if(!p) return;
    const total = SHOES.length, brands = MARCAS.length;
    const esFallback = "Descubre, analiza y compara {{total}} modelos de pies de gato de {{marcas}} marcas por cierre, perfil, rigidez, asimetría y uso recomendado — lado a lado, sin marketing de por medio.";  
    const esTexto = siteText("inicio.introTexto", esFallback)
      .replace(/\{\{total\}\}/g, `<strong id="heroTotal">${total}</strong>`)
      .replace(/\{\{marcas\}\}/g, `<strong id="heroBrands">${brands}</strong>`);
    const templates = {
      es: esTexto,
      ca:`Descobreix, analitza i compara <strong id="heroTotal">${total}</strong> models de peus de gat de <strong id="heroBrands">${brands}</strong> marques per tancament, perfil, rigidesa, asimetria i ús recomanat — costat a costat, sense marketing pel mig.`,
      en:`Discover, analyze and compare <strong id="heroTotal">${total}</strong> climbing shoe models from <strong id="heroBrands">${brands}</strong> brands by closure, shape, stiffness, asymmetry and recommended use — side by side, no marketing involved.`,
      fr:`Découvre, analyse et compare <strong id="heroTotal">${total}</strong> modèles de chaussons d'escalade de <strong id="heroBrands">${brands}</strong> marques par fermeture, profil, rigidité, asymétrie et usage recommandé — côte à côte, sans marketing.`
    };
    p.innerHTML = templates[LANG] || templates.es;
  }
  function applyStaticI18n(){
    applySiteTexts();
    el("#navHome").textContent = t("navHome");
    el("#navCompare").textContent = t("navCompare");
    el("#navNews").textContent = t("navNews");
    if(el("#navAbout")) el("#navAbout").textContent = t("navAbout");
    el("#search").setAttribute("placeholder", t("searchPlaceholder"));
    el("#filtersTitle").textContent = t("filtersTitle");
    el("#filtersToggleLabel").textContent = t("filtersToggleLabel");
    el("#filterLabelMarca").textContent = t("filterLabelMarca");
    el("#filterLabelNivel").textContent = t("filterLabelNivel");
    el("#filterLabelCierre").textContent = t("filterLabelCierre");
    el("#filterLabelPerfil").textContent = t("filterLabelPerfil");
    el("#resetFilters").textContent = t("resetFilters");
    document.querySelectorAll(".ad-slot[data-ad-suffix]").forEach(node=>{
      node.textContent = t("adSpace") + node.dataset.adSuffix;
    });
    updateCompareHero(state.compareTab || "duel");
    const pla = el("#pickerLabelA"); if(pla) pla.textContent = t("pickerLabel1");
    const plb = el("#pickerLabelB"); if(plb) plb.textContent = t("pickerLabel2");
    document.querySelectorAll(".picker-input").forEach(inp=> inp.setAttribute("placeholder", t("pickerPlaceholder")));
    const th = el("#trayHint"); if(th) th.textContent = t("trayHint");
    const cbl = el("#compareBtnLabel"); if(cbl) cbl.textContent = t("compareBtnLabel");
    const fd = el("#footerDisclaimer"); if(fd) fd.textContent = t("footerDisclaimer");
    const ctd = el("#compareTabDuel"); if(ctd) ctd.textContent = t("compareTabDuel");
    const cts = el("#compareTabSizes"); if(cts) cts.textContent = t("compareTabSizes");
    const sbl = el("#sizesBrandLabel"); if(sbl) sbl.textContent = t("sizesBrandLabel");
    const svl = el("#sizesValueLabel"); if(svl) svl.textContent = t("sizesValueLabel");
    const sdisc = el("#sizeDisclaimer"); if(sdisc) sdisc.textContent = t("sizeDisclaimer");
    updateHeroText();
  }
  function setLang(lang){
    if(!LANGS.includes(lang) || lang===LANG){
      document.querySelectorAll("#langSwitch button").forEach(b=>{
        b.setAttribute("aria-pressed", String(b.dataset.lang===LANG));
      });
      return;
    }
    LANG = lang;
    document.documentElement.lang = lang;
    try{ localStorage.setItem("gatolab_lang", lang); }catch(e){}
    document.querySelectorAll("#langSwitch button").forEach(b=>{
      b.setAttribute("aria-pressed", String(b.dataset.lang===lang));
    });
    applyStaticI18n();
    rerenderAll();
  }
  function rerenderAll(){
    renderQuickUso();
    renderBrandFilters();
    chipButtons(el("#levelFilters"), NIVEL_OPTIONS, "nivel");
    chipButtons(el("#closureFilters"), CIERRE_OPTIONS, "cierre");
    chipButtons(el("#shapeFilters"), FORMA_OPTIONS, "forma");
    syncFilterUI();
    renderCatalog();
    renderTray();
    renderPicker("a"); renderPicker("b");
    if(!el("#compareView").hidden){
      updateCompareHero(state.compareTab || "duel");
      if((state.compareTab||"duel")==="sizes"){ renderSizeComparator(); } else { renderDuel(); }
    }
    const detailOverlay = el("#detailOverlay");
    if(detailOverlay && !detailOverlay.hidden && currentDetailId){
      openDetail(currentDetailId);
    }
    const compareOverlay = el("#compareOverlay");
    if(compareOverlay && !compareOverlay.hidden){
      openCompare();
    }
  }


  const state = {
    q:"", uso:new Set(), marca:new Set(), nivel:new Set(), cierre:new Set(), forma:new Set(),
    infantil:false,
    compare: [],
    view: "home",
    compareTab: "duel",
    duel: { a:null, b:null }
  };

  /* El catálogo (SHOES) todavía no ha llegado en este punto — se valida contra
     datos reales de nuevo en cuanto window.__gatoLabShoesReady resuelve (ver
     más abajo), para no descartar por error una bandeja/duelo guardados. */
  try{
    const saved = JSON.parse(localStorage.getItem("gatolab_tray")||"[]");
    if(Array.isArray(saved)) state.compare = saved.slice(0,4);
  }catch(e){}
  try{
    const savedDuel = JSON.parse(localStorage.getItem("gatolab_duel")||"null");
    if(savedDuel && typeof savedDuel === "object"){
      state.duel.a = savedDuel.a || null;
      state.duel.b = savedDuel.b || null;
    }
  }catch(e){}

  function saveTray(){ try{ localStorage.setItem("gatolab_tray", JSON.stringify(state.compare)); }catch(e){} }
  function saveDuel(){ try{ localStorage.setItem("gatolab_duel", JSON.stringify(state.duel)); }catch(e){} }

  const el = sel => document.querySelector(sel);
  const catalog = el("#catalog");
  const heroTotal = el("#heroTotal");
  if(heroTotal) heroTotal.textContent = SHOES.length;
  const heroBrandsEl = el("#heroBrands");
  if(heroBrandsEl) heroBrandsEl.textContent = MARCAS.length;

  document.querySelectorAll("#langSwitch button").forEach(btn=>{
    btn.setAttribute("aria-pressed", String(btn.dataset.lang===LANG));
    btn.addEventListener("click", ()=> setLang(btn.dataset.lang));
  });
  applyStaticI18n();

  function shoeIcon(){ return '<svg viewBox="0 0 120 60"><use href="#icon-shoe"></use></svg>'; }

  /* Foto principal (primera de s.fotos) en un marco visual uniforme; si no
     hay foto real disponible, o la URL externa deja de funcionar en algún
     momento, cae automáticamente al icono esquemático de siempre. */
  function shoePhotoHTML(s){
    if(s.fotos && s.fotos.length){
      return `<img class="shoe-photo" src="${s.fotos[0]}" alt="${s.marca} ${s.modelo}" loading="lazy" onerror="window.__gatoLabPhotoFallback(this)">`;
    }
    return shoeIcon();
  }
  window.__gatoLabPhotoFallback = function(img){
    img.outerHTML = '<svg viewBox="0 0 120 60"><use href="#icon-shoe"></use></svg>';
  };

  /* ------------------------------------------------------------------ *
   * Visor de fotos de la ficha de detalle: foto principal + miniaturas
   * seleccionables (clic en una miniatura la convierte en la foto grande)
   * y ampliación a pantalla completa (clic en la foto grande, con
   * navegación anterior/siguiente si hay varias). Independiente de cuántas
   * fotos tenga cada modelo (0 a 3 hoy, pero funciona con cualquier número).
   * ------------------------------------------------------------------ */
  function detailPhotoBlockHTML(s){
    const photos = (s.fotos && s.fotos.length) ? s.fotos : [];
    const alt = `${s.marca} ${s.modelo}`;
    if(!photos.length){
      return `<div class="detail-photo-main">${shoeIcon()}</div>`;
    }
    const mainHTML = `<div class="detail-photo-main photo-zoomable" id="detailPhotoMain" role="button" tabindex="0" aria-label="${t('lightboxOpen')}">
      <img class="shoe-photo" id="detailPhotoImg" src="${photos[0]}" alt="${alt}" loading="lazy" onerror="window.__gatoLabPhotoFallback(this)">
      <span class="photo-zoom-hint" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#icon-zoom"></use></svg></span>
    </div>`;
    const thumbsHTML = photos.length > 1
      ? `<div class="detail-photo-gallery" id="detailPhotoGallery">${photos.map((url,i)=>`
        <button type="button" class="detail-photo-thumb${i===0?" active":""}" data-idx="${i}" aria-label="${t('lightboxThumb')} ${i+1}"><img src="${url}" alt="${alt}" loading="lazy" onerror="this.closest('.detail-photo-thumb').remove()"></button>`).join("")}</div>`
      : "";
    return mainHTML + thumbsHTML;
  }
  function wireDetailPhotoBlock(modal, s){
    const photos = (s.fotos && s.fotos.length) ? s.fotos : [];
    if(!photos.length) return;
    let activeIdx = 0;
    const mainWrap = modal.querySelector("#detailPhotoMain");
    const mainImg = modal.querySelector("#detailPhotoImg");
    const openZoom = ()=> openLightbox(photos, activeIdx, `${s.marca} ${s.modelo}`);
    mainWrap.addEventListener("click", openZoom);
    mainWrap.addEventListener("keydown", (ev)=>{ if(ev.key==="Enter" || ev.key===" "){ ev.preventDefault(); openZoom(); } });
    modal.querySelectorAll(".detail-photo-thumb").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        activeIdx = Number(btn.dataset.idx);
        mainImg.src = photos[activeIdx];
        modal.querySelectorAll(".detail-photo-thumb").forEach(b=>b.classList.toggle("active", b===btn));
      });
    });
  }

  /* Visor a pantalla completa (lightbox), reutilizado por la ficha de
     detalle y por las fotos del comparador 1 vs 1. */
  let lightboxPhotos = [], lightboxIndex = 0, lightboxAlt = "";
  function renderLightbox(){
    const modal = el("#lightboxModal");
    const multi = lightboxPhotos.length > 1;
    modal.innerHTML = `
      <button type="button" class="modal-close lightbox-close" aria-label="${t('detailClose')}"><svg viewBox="0 0 24 24"><use href="#icon-close"></use></svg></button>
      ${multi?`<button type="button" class="lightbox-nav lightbox-prev" aria-label="${t('lightboxPrev')}"><svg viewBox="0 0 24 24"><use href="#icon-chevron"></use></svg></button>`:""}
      <img class="lightbox-img" src="${lightboxPhotos[lightboxIndex]}" alt="${lightboxAlt}">
      ${multi?`<button type="button" class="lightbox-nav lightbox-next" aria-label="${t('lightboxNext')}"><svg viewBox="0 0 24 24" style="transform:rotate(180deg)"><use href="#icon-chevron"></use></svg></button>`:""}
      ${multi?`<div class="lightbox-counter">${lightboxIndex+1} / ${lightboxPhotos.length}</div>`:""}`;
    modal.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    if(multi){
      modal.querySelector(".lightbox-prev").addEventListener("click", (ev)=>{ ev.stopPropagation(); lightboxIndex = (lightboxIndex-1+lightboxPhotos.length)%lightboxPhotos.length; renderLightbox(); });
      modal.querySelector(".lightbox-next").addEventListener("click", (ev)=>{ ev.stopPropagation(); lightboxIndex = (lightboxIndex+1)%lightboxPhotos.length; renderLightbox(); });
    }
  }
  function lightboxKeyHandler(ev){
    if(ev.key==="Escape"){ closeLightbox(); }
    else if(ev.key==="ArrowLeft" && lightboxPhotos.length>1){ lightboxIndex=(lightboxIndex-1+lightboxPhotos.length)%lightboxPhotos.length; renderLightbox(); }
    else if(ev.key==="ArrowRight" && lightboxPhotos.length>1){ lightboxIndex=(lightboxIndex+1)%lightboxPhotos.length; renderLightbox(); }
  }
  function openLightbox(photos, index, alt){
    if(!photos || !photos.length) return;
    lightboxPhotos = photos; lightboxIndex = index||0; lightboxAlt = alt||"";
    renderLightbox();
    el("#lightboxOverlay").hidden = false;
    document.addEventListener("keydown", lightboxKeyHandler);
  }
  function closeLightbox(){
    el("#lightboxOverlay").hidden = true;
    document.removeEventListener("keydown", lightboxKeyHandler);
  }
  el("#lightboxOverlay").addEventListener("click", (ev)=>{ if(ev.target.id==="lightboxOverlay") closeLightbox(); });

  /* =====================================================================
     NAVEGACIÓN: HOME <-> COMPARADOR
     ===================================================================== */
  function syncHash(){
    let h = "home";
    if(state.view === "compare"){
      if(state.compareTab === "sizes"){
        h = "compare/tallas";
      } else {
        h = "compare" + (state.duel.a ? "/"+state.duel.a + (state.duel.b ? "/"+state.duel.b : "") : "");
      }
    } else if(state.view === "news" && window.GatoLabNews){
      const slug = window.GatoLabNews.getSlug();
      h = "news" + (slug ? "/"+slug : "");
    } else if(state.view === "about"){
      h = "sobre-nosotros";
    }
    try{ history.replaceState(null, "", "#"+h); }catch(e){}
  }

  function updateCompareHero(tab){
    const eyebrow = el("#compareEyebrow");
    const title = el("#duelTitle");
    const desc = el("#duelDesc");
    if(tab === "sizes"){
      if(eyebrow) eyebrow.textContent = siteText("comparador.eyebrowTallas", "SIZE MATCH");      
      if(title) title.textContent = t("sizesTitle");
      if(desc) desc.textContent = t("sizesDesc");
    } else {
      if(eyebrow) eyebrow.textContent = siteText("comparador.eyebrowDuelo", "HEAD TO HEAD");
      if(title) title.textContent = t("duelTitle");
      if(desc) desc.textContent = t("duelDesc");
    }
  }

  function setCompareTab(tab, opts){
    opts = opts || {};
    const isDuel = tab !== "sizes";
    state.compareTab = isDuel ? "duel" : "sizes";
    if(el("#compareDuelPanel")) el("#compareDuelPanel").hidden = !isDuel;
    if(el("#compareSizesPanel")) el("#compareSizesPanel").hidden = isDuel;
    if(el("#compareTabDuel")) el("#compareTabDuel").setAttribute("aria-selected", String(isDuel));
    if(el("#compareTabSizes")) el("#compareTabSizes").setAttribute("aria-selected", String(!isDuel));
    updateCompareHero(state.compareTab);
    if(isDuel){ renderDuel(); } else { renderSizeComparator(); }
    if(!opts.skipHash) syncHash();
  }

  function setView(view){
    state.view = view;
    el("#homeView").hidden = view !== "home";
    el("#compareView").hidden = view !== "compare";
    if(el("#newsView")) el("#newsView").hidden = view !== "news";
    if(el("#aboutView")) el("#aboutView").hidden = view !== "about";
    el("#homeSearchbox").hidden = view !== "home";
    if(el("#searchToggle")){
      el("#searchToggle").hidden = view !== "home";
      if(view !== "home") closeMobileSearch();
    }
    el("#navHome").setAttribute("aria-current", String(view === "home"));
    el("#navCompare").setAttribute("aria-current", String(view === "compare"));
    if(el("#navNews")) el("#navNews").setAttribute("aria-current", String(view === "news"));
    if(el("#navAbout")) el("#navAbout").setAttribute("aria-current", String(view === "about"));
    syncHash();
    if(view === "compare"){ setCompareTab(state.compareTab || "duel", {skipHash:true}); }
    if(view === "news" && window.GatoLabNews){ window.GatoLabNews.render(); }
    if(view === "home"){ renderTray(); } else { el("#compareTray").hidden = true; }
    window.scrollTo({ top:0, behavior:"instant" in window ? "instant" : "auto" });
  }

  el("#navHome").addEventListener("click", ()=> setView("home"));
  el("#navCompare").addEventListener("click", ()=> setView("compare"));
  if(el("#navNews")){
    el("#navNews").addEventListener("click", ()=>{
      if(window.GatoLabNews) window.GatoLabNews.goToList();
      setView("news");
    });
  }
  if(el("#navAbout")) el("#navAbout").addEventListener("click", ()=> setView("about"));
  if(el("#compareTabDuel")) el("#compareTabDuel").addEventListener("click", ()=> setCompareTab("duel"));
  if(el("#compareTabSizes")) el("#compareTabSizes").addEventListener("click", ()=> setCompareTab("sizes"));

  function parseInitialHash(){
    const h = location.hash.replace(/^#/, "");
    const parts = h.split("/").filter(Boolean);
    if(parts[0] === "compare"){
      if(parts[1] === "tallas"){
        state.compareTab = "sizes";
        return "compare";
      }
      if(parts[1] && SHOES.some(s=>s.id===parts[1])) state.duel.a = parts[1];
      if(parts[2] && SHOES.some(s=>s.id===parts[2])) state.duel.b = parts[2];
      state.compareTab = "duel";
      return "compare";
    }
    if(parts[0] === "news"){
      if(window.GatoLabNews) window.GatoLabNews.setSlugFromHash(parts[1] || null);
      return "news";
    }
    if(parts[0] === "tallas"){ state.compareTab = "sizes"; return "compare"; } // enlace antiguo
    if(parts[0] === "sobre-nosotros") return "about";
    return "home";
  }

  /* =====================================================================
     COMPARADOR DE TALLAS
     ===================================================================== */
  function renderSizeComparator(){
    if(!window.GatoLabSizes) return;
    const brandSel = el("#sizeBrandSelect");
    const valueSel = el("#sizeValueSelect");
    if(!brandSel || !valueSel) return;

    if(!brandSel.dataset.filled){
      brandSel.innerHTML = window.GatoLabSizes.brands.map(b=>`<option value="${b}">${b}</option>`).join("");
      brandSel.dataset.filled = "1";
      brandSel.addEventListener("change", fillSizeOptions);
      valueSel.addEventListener("change", updateSizeResults);
      fillSizeOptions();
    }
    updateSizeResults();

    function fillSizeOptions(){
      const brand = brandSel.value;
      const sizes = window.GatoLabSizes.sizesOf(brand);
      const prev = valueSel.value;
      valueSel.innerHTML = sizes.map(s=>`<option value="${s}">${s}</option>`).join("");
      if(sizes.map(String).includes(prev)) valueSel.value = prev;
      updateSizeResults();
    }
    function updateSizeResults(){
      const brand = brandSel.value;
      const eu = parseFloat(valueSel.value);
      const out = el("#sizeResults");
      const data = window.GatoLabSizes.convert(brand, eu);
      if(!data){ out.innerHTML = ""; return; }
      out.innerHTML = Object.keys(data.results).map(b=>{
        const r = data.results[b];
        if(!r) return "";
        const tag = r.exact ? "" : `<span class="size-approx">≈</span>`;
        return `<div class="size-result-card${b===brand?" size-result-origin":""}">
          <div class="size-result-brand">${b}</div>
          <div class="size-result-value">${tag}${r.eu}</div>
          <div class="size-result-cm">${r.cm.toFixed(1)} cm</div>
        </div>`;
      }).join("");
    }
  }

  /* =====================================================================
     SOBRE NOSOTROS / CONTACTO
     ===================================================================== */
  function initContactForm(){
    const form = el("#contactForm");
    if(!form) return;
    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      const name = el("#contactName").value.trim();
      const email = el("#contactEmail").value.trim();
      const message = el("#contactMessage").value.trim();
      const subject = `Contacto Gato Lab — ${name}`;
      const body = `${message}\n\n— ${name} (${email})`;
      const mailto = `mailto:gatolab.comparador@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    });
  }

  function matchesFilters(s){
    if(state.q){
      const hay = (s.marca+" "+s.modelo).toLowerCase();
      if(!hay.includes(state.q)) return false;
    }
    if(state.uso.size && !usosOf(s).some(u=>state.uso.has(u))) return false;
    if(state.marca.size && !state.marca.has(s.marca)) return false;
    if(state.nivel.size && !state.nivel.has(s.nivel)) return false;
    if(state.cierre.size && !state.cierre.has(cierreTipo(s.cierre))) return false;
    if(state.forma.size && !state.forma.has(s.forma)) return false;
    if(state.infantil && !s.infantil) return false;
    return true;
  }

  /* Cada cuántas fichas (aproximadamente) se inserta un hueco de anuncio
     "in-feed" dentro del propio catálogo, además de los huecos de
     cabecera/pie ya existentes. Es una cifra ORIENTATIVA, no exacta: como el
     catálogo tiene distinto número de columnas según el ancho de pantalla
     (2 en móvil, 3 o más en ordenador — ver .catalog en css/styles.css), el
     hueco real se ajusta al múltiplo de esa cifra más cercano al número de
     columnas actual, para que el anuncio siempre cierre una fila completa y
     no deje un hueco vacío antes de él. Cambia solo este número si quieres
     más o menos frecuencia — no hace falta tocar nada más. */
  const CATALOG_AD_TARGET_INTERVAL = 8;
  let lastCatalogColumnCount = null;
  function catalogColumnCount(){
    const cols = getComputedStyle(catalog).gridTemplateColumns.split(" ").filter(Boolean).length;
    return cols > 0 ? cols : 1;
  }
  function catalogAdInterval(){
    const cols = catalogColumnCount();
    if(cols <= 1) return CATALOG_AD_TARGET_INTERVAL;
    const rows = Math.max(1, Math.round(CATALOG_AD_TARGET_INTERVAL / cols));
    return rows * cols;
  }
  function catalogAdSlotNode(n){
    const div = document.createElement("div");
    div.className = "ad-slot ad-infeed ad-infeed-catalog";
    div.setAttribute("aria-hidden","true");
    div.dataset.adSuffix = " (Google AdSense · in-feed)";
    div.textContent = t("adSpace") + div.dataset.adSuffix;
    return div;
  }
  function renderCatalog(){
    catalog.innerHTML = "";
    if(!shoesLoaded){
      catalog.innerHTML = `<div class="empty-state catalog-loading"><span class="empty-state-mark"><svg viewBox="0 0 182 200"><use href="#icon-mark"></use></svg></span>${t("catalogLoadingHTML")}</div>`;
      return;
    }
    const list = orderedShoes().filter(matchesFilters);
    if(!list.length){
      catalog.innerHTML = `<div class="empty-state"><span class="empty-state-mark"><svg viewBox="0 0 182 200"><use href="#icon-mark"></use></svg></span>${t("emptyStateHTML")}</div>`;
      return;
    }
    lastCatalogColumnCount = catalogColumnCount();
    const adInterval = catalogAdInterval();
    list.forEach((s,idx)=>{
      const card = document.createElement("article");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role","button");
      card.setAttribute("aria-label", s.marca+" "+s.modelo+t("cardAriaSuffix"));
      const inCompare = state.compare.includes(s.id);
      card.innerHTML = `
        <div class="card-photo">
          <span class="card-level-flag level-${s.nivel}">${v("nivel",s.nivel)}</span>
          ${s.sello ? sealIconHTML("card-seal") : ""}
          ${s.infantil ? `<span class="card-kids-flag${s.sello ? " with-seal" : ""}">${t("kidsFlag")}</span>` : ""}
          ${shoePhotoHTML(s)}
        </div>
        <div class="card-body">
          <div>
            <div class="card-brand">${s.marca}</div>
            <div class="card-model">${s.modelo}</div>
          </div>
          <div class="card-chips">
            ${usosTagsHTML(s)}
            <span class="tag">${s.cierre}</span>
          </div>
          <div class="card-mini-specs">
            <div><span>${t("lblPerfil")}</span><span>${v("forma",s.forma)}</span></div>
            <div><span>${t("lblGoma")}</span><span>${s.goma}</span></div>
          </div>
          <div class="card-foot">
            <div class="card-price">${s.precio} € <span>${t("priceApprox")}</span></div>
            <button class="add-compare" data-id="${s.id}" aria-pressed="${inCompare}">
              <svg viewBox="0 0 24 24"><use href="${inCompare ? '#icon-check' : '#icon-plus'}"></use></svg>
              ${inCompare ? t("cardAdded") : t("cardCompare")}
            </button>
          </div>
        </div>`;
      card.addEventListener("click", (ev)=>{ if(ev.target.closest(".add-compare")) return; openDetail(s.id); });
      card.addEventListener("keydown", (ev)=>{ if(ev.key==="Enter" || ev.key===" "){ ev.preventDefault(); openDetail(s.id); } });
      card.querySelector(".add-compare").addEventListener("click", (ev)=>{ ev.stopPropagation(); toggleCompare(s.id); });
      catalog.appendChild(card);
      const position = idx+1;
      if(position % adInterval === 0 && position < list.length){
        catalog.appendChild(catalogAdSlotNode(position / adInterval));
      }
    });
    refreshInFeedAds();
  }

  function toggleCompare(id){
    const idx = state.compare.indexOf(id);
    if(idx>-1){ state.compare.splice(idx,1); }
    else{ if(state.compare.length>=4){ state.compare.shift(); } state.compare.push(id); }
    saveTray(); renderCatalog(); renderTray();
  }

  function renderTray(){
    if(state.view !== "home"){ el("#compareTray").hidden = true; return; }
    const tray = el("#compareTray"); const items = el("#trayItems"); const count = el("#trayCount");
    count.textContent = state.compare.length;
    if(!state.compare.length){ tray.hidden = true; return; }
    tray.hidden = false; items.innerHTML = "";
    state.compare.forEach(id=>{
      const s = SHOES.find(x=>x.id===id); if(!s) return;
      const chip = document.createElement("span");
      chip.className = "tray-item";
      chip.innerHTML = `${s.marca} ${s.modelo} <button aria-label="${t("trayRemoveAria")} ${s.modelo}"><svg viewBox="0 0 24 24"><use href="#icon-close"></use></svg></button>`;
      chip.querySelector("button").addEventListener("click", ()=>toggleCompare(id));
      items.appendChild(chip);
    });
  }

  let currentDetailId = null;
  function openDetail(id){
    const s = SHOES.find(x=>x.id===id); if(!s) return;
    currentDetailId = id;
    const overlay = el("#detailOverlay"); const modal = el("#detailModal");
    const inCompare = state.compare.includes(id);
    const carac = getCaracteristicas(s);
    const paraQuien = getParaQuien(s);
    modal.innerHTML = `
      <button class="modal-close" aria-label="${t("detailClose")}"><svg viewBox="0 0 24 24"><use href="#icon-close"></use></svg></button>
      ${detailPhotoBlockHTML(s)}
      <div class="detail-head">
        <div class="detail-title">
          <div class="card-brand">${s.marca}</div>
          <h3>${s.modelo}</h3>
          <div class="card-chips" style="margin-top:8px">
            ${s.sello ? `<span class="tag tag-seal"><svg viewBox="0 0 182 200" aria-hidden="true"><use href="#icon-mark"></use></svg>${t("sealName")}</span>` : ""}
            <span class="tag level-${s.nivel}">${v("nivel",s.nivel)}</span>
            ${usosTagsHTML(s)}
            ${s.infantil ? `<span class="tag tag-kids">${t("kidsFlag")}</span>` : ""}
          </div>
        </div>
      </div>
      <p class="detail-summary">${getResumen(s)}</p>
      <div class="spec-grid">
        <div class="spec-item"><div class="spec-label">${t("lblPrecio")}</div><div class="spec-value mono">${s.precio} €</div></div>
        <div class="spec-item"><div class="spec-label">${t("lblPeso")}</div><div class="spec-value mono">${s.peso_g?`${s.peso_g} g`:t("weightNotAvailable")}</div></div>
        <div class="spec-item"><div class="spec-label">${t("lblCierre")}</div><div class="spec-value">${s.cierre}</div></div>
        <div class="spec-item"><div class="spec-label">${t("lblPerfil")}</div><div class="spec-value">${v("forma",s.forma)}</div></div>
        <div class="spec-item"><div class="spec-label">${t("lblGoma")}</div><div class="spec-value">${s.goma}${s.grosor?` · ${s.grosor} mm`:""}</div></div>
        <div class="spec-item"><div class="spec-label">${t("lblVolumen")}</div><div class="spec-value">${s.volumen}</div></div>
        <div class="spec-item"><div class="spec-label">${t("lblAsimetria")}</div><div class="spec-value bar-row">${v("asimetria",s.asimetria)} ${asimetriaBars(s)}</div></div>
        <div class="spec-item"><div class="spec-label">${t("lblRigidezSuela")}</div><div class="spec-value bar-row">${v("rigidez",s.rigidez)} ${rigidezBars(s)}</div></div>
        <div class="spec-item"><div class="spec-label">${t("lblSensibilidad")}</div><div class="spec-value bar-row">${sensibilidadBars(s)}</div></div>
        <div class="spec-item"><div class="spec-label">${t("lblConstruccion")}</div><div class="spec-value">${construccion(s)}</div></div>
        <div class="spec-item"><div class="spec-label">${t("lblForro")}</div><div class="spec-value">${s.forro ? v("forro",s.forro) : t("notSpecified")}</div></div>
      </div>
      ${radarCardHTML([{s, colorVar:"--radar-1", name:`${s.marca} ${s.modelo}`}])}
      ${(carac && carac.length) ? `<div class="detail-features"><h4>${t("lblCaracteristicasClave")}</h4><ul>${carac.map(f=>`<li>${f}</li>`).join("")}</ul></div>` : ""}
      ${paraQuien ? `<div class="detail-parawho"><span class="spec-label">${t("lblParaQuien")}</span><p>${paraQuien}</p></div>` : ""}
      <div class="detail-actions">
        <button class="btn-primary" id="detailCompareBtn">${inCompare ? t("detailRemoveCompare") : t("detailAddCompare")}</button>
        <button class="btn-secondary" id="detailDuelBtn">${t("detailDuelBtn")}</button>
        <button class="btn-secondary" id="detailCloseBtn">${t("detailClose")}</button>
      </div>
      ${window.GatoLabNews ? window.GatoLabNews.relatedNewsHTML(id, null) : ""}`;
    overlay.hidden = false;
    modal.querySelector(".modal-close").addEventListener("click", closeDetail);
    modal.querySelector("#detailCloseBtn").addEventListener("click", closeDetail);
    modal.querySelector("#detailCompareBtn").addEventListener("click", ()=>{ toggleCompare(id); closeDetail(); });
    modal.querySelector("#detailDuelBtn").addEventListener("click", ()=>{
      closeDetail();
      state.duel.a = id;
      if(state.duel.b === id) state.duel.b = null;
      saveDuel();
      state.compareTab = "duel";
      setView("compare");
    });
    if(window.GatoLabNews){
      window.GatoLabNews.bindRelatedNewsClicks(modal, closeDetail);
    }
    wireDetailPhotoBlock(modal, s);
  }
  function closeDetail(){ el("#detailOverlay").hidden = true; currentDetailId = null; }
  el("#detailOverlay").addEventListener("click", (ev)=>{ if(ev.target.id==="detailOverlay") closeDetail(); });

  const ROWS = [
    ["lblPrecio", s=>`<span class="price-cell">${s.precio} €</span>`, s=>s.precio+"€"],
    ["lblPeso", s=> s.peso_g?`<span class="price-cell">${s.peso_g} g</span>`:`<span class="muted">${t("weightNotAvailable")}</span>`, s=>s.peso_g?s.peso_g+"g":"—"],
    ["lblNivel", s=>v("nivel",s.nivel), s=>s.nivel],
    ["lblTipoEscalada", s=>usosLabel(s), s=>usosOf(s).join(", ")],
    ["lblCierre", s=>s.cierre, s=>s.cierre],
    ["lblPerfil", s=>v("forma",s.forma), s=>s.forma],
    ["lblAsimetria", s=>`<span class="bar-row">${v("asimetria",s.asimetria)} ${asimetriaBars(s)}</span>`, s=>s.asimetria],
    ["lblRigidezSuela", s=>`<span class="bar-row">${v("rigidez",s.rigidez)} ${rigidezBars(s)}</span>`, s=>s.rigidez],
    ["lblSensibilidad", s=>`<span class="bar-row">${sensibilidadBars(s)}</span>`, s=>s.rigidez],
    ["lblTipoSuela", s=>s.goma+(s.grosor?` · ${s.grosor}mm`:""), s=>s.goma],
    ["lblVolumen", s=>s.volumen, s=>s.volumen],
    ["lblForro", s=>s.forro?v("forro",s.forro):t("notSpecified"), s=>s.forro||"—"]
  ];

  function openCompare(){
    const shoes = state.compare.map(id=>SHOES.find(s=>s.id===id)).filter(Boolean);
    const overlay = el("#compareOverlay"); const modal = el("#compareModal");
    if(!shoes.length){
      modal.innerHTML = `<button class="modal-close" aria-label="${t("detailClose")}"><svg viewBox="0 0 24 24"><use href="#icon-close"></use></svg></button><h3 class="display" style="font-size:1.4rem">${t("compareEmptyTitle")}</h3><p class="detail-summary">${t("compareEmptyDesc")}</p>`;
    } else {
      let head = `<th class="col-brand" style="text-align:left">${t("compareColHeader")}</th>` + shoes.map(s=>`<th><span class="col-brand">${s.marca}</span><span class="model-name">${s.modelo}</span></th>`).join("");
      let rows = ROWS.map(([labelKey,fn,cmp])=>{
        const vals = shoes.map(cmp);
        const html = shoes.map(fn);
        const allSame = vals.every(val=>val===vals[0]);
        const cells = html.map(h=>`<td class="${allSame?"":"diff"}"><span class="row-value">${h}</span></td>`).join("");
        return `<tr><td class="row-label">${t(labelKey)}</td>${cells}</tr>`;
      }).join("");
      modal.innerHTML = `
        <button class="modal-close" aria-label="${t("detailClose")}"><svg viewBox="0 0 24 24"><use href="#icon-close"></use></svg></button>
        <h3 class="display" style="font-size:1.5rem">${t("compareTitle")}</h3>
        <p class="detail-summary">${t("compareLegend")}</p>
        <div class="compare-scroll"><table class="compare"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    overlay.hidden = false;
    modal.querySelector(".modal-close").addEventListener("click", ()=>{ overlay.hidden = true; });
  }
  el("#compareOverlay").addEventListener("click", (ev)=>{ if(ev.target.id==="compareOverlay") el("#compareOverlay").hidden = true; });
  el("#openCompare").addEventListener("click", openCompare);

  function renderQuickUso(){
    const box = el("#quickUso"); box.innerHTML = "";
    USO_OPTIONS.forEach(u=>{
      const n = SHOES.filter(s=>usosOf(s).includes(u)).length;
      const btn = document.createElement("button");
      btn.className = "use-chip"; btn.type = "button";
      btn.setAttribute("aria-pressed", state.uso.has(u));
      btn.innerHTML = `${v("uso",u)} <span class="n">${n}</span>`;
      btn.addEventListener("click", ()=>{
        if(state.uso.has(u)) state.uso.delete(u); else state.uso.add(u);
        renderQuickUso(); renderCatalog();
      });
      box.appendChild(btn);
    });
    // Chip independiente (no es un "uso" más): pies de gato específicos para niños/as,
    // pensado para verse junto al resto de chips rápidos sin tocar el menú principal.
    const nKids = SHOES.filter(s=>s.infantil).length;
    const kidsBtn = document.createElement("button");
    kidsBtn.className = "use-chip use-chip-kids"; kidsBtn.type = "button";
    kidsBtn.setAttribute("aria-pressed", String(state.infantil));
    kidsBtn.innerHTML = `${t("kidsFlag")} <span class="n">${nKids}</span>`;
    kidsBtn.addEventListener("click", ()=>{
      state.infantil = !state.infantil;
      renderQuickUso(); renderCatalog();
    });
    box.appendChild(kidsBtn);
    // Explicación del Sello GATO LAB (solo si hay algún modelo con sello)
    if(SHOES.some(s=>s.sello)){
      const note = document.createElement("p");
      note.className = "seal-note";
      note.innerHTML = `${sealIconHTML("seal-badge")}<span><strong>${t("sealName")}</strong> — ${t("sealExplain")}</span>`;
      box.appendChild(note);
    }
  }
  // Logo de GATO LAB en morado: sello de los pies de gato recomendados ("sello": true)
  function sealIconHTML(cls){
    return `<span class="${cls}" title="${t("sealName")}"><svg viewBox="0 0 182 200" aria-hidden="true"><use href="#icon-mark"></use></svg></span>`;
  }

  function renderBrandFilters(){
    const box = el("#brandFilters"); box.innerHTML = "";
    MARCAS.forEach(m=>{
      const n = SHOES.filter(s=>s.marca===m).length;
      const row = document.createElement("label");
      row.className = "filter-row";
      row.innerHTML = `<input type="checkbox" data-kind="marca" value="${m}"> <span>${m}</span><span class="cnt">${n}</span>`;
      box.appendChild(row);
    });
  }

  function chipButtons(container, options, kind){
    container.innerHTML = "";
    options.forEach(opt=>{
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = labelForFilterValue(kind, opt);
      btn.dataset.kind = kind; btn.dataset.value = opt;
      btn.setAttribute("aria-pressed","false");
      btn.addEventListener("click", ()=>{
        const set = state[kind];
        if(set.has(opt)) set.delete(opt); else set.add(opt);
        btn.setAttribute("aria-pressed", set.has(opt));
        renderCatalog();
      });
      container.appendChild(btn);
    });
  }

  function syncFilterUI(){
    document.querySelectorAll('input[data-kind="marca"]').forEach(cb=>{
      cb.checked = state.marca.has(cb.value);
    });
    document.querySelectorAll('#levelFilters button, #closureFilters button, #shapeFilters button').forEach(btn=>{
      const set = state[btn.dataset.kind];
      btn.setAttribute("aria-pressed", set.has(btn.dataset.value));
    });
  }

  el("#brandFilters").addEventListener("change", (ev)=>{
    const cb = ev.target;
    if(cb.dataset && cb.dataset.kind==="marca"){
      if(cb.checked) state.marca.add(cb.value); else state.marca.delete(cb.value);
      renderCatalog();
    }
  });

  chipButtons(el("#levelFilters"), NIVEL_OPTIONS, "nivel");
  chipButtons(el("#closureFilters"), CIERRE_OPTIONS, "cierre");
  chipButtons(el("#shapeFilters"), FORMA_OPTIONS, "forma");
  renderBrandFilters();
  renderQuickUso();

  el("#resetFilters").addEventListener("click", ()=>{
    state.q=""; state.uso.clear(); state.marca.clear(); state.nivel.clear(); state.cierre.clear(); state.forma.clear(); state.infantil=false;
    el("#search").value = "";
    renderQuickUso();
    document.querySelectorAll('#levelFilters button, #closureFilters button, #shapeFilters button').forEach(b=>b.setAttribute("aria-pressed","false"));
    document.querySelectorAll('input[data-kind="marca"]').forEach(cb=>cb.checked=false);
    renderCatalog();
  });

  el("#search").addEventListener("input", (ev)=>{ state.q = ev.target.value.trim().toLowerCase(); renderCatalog(); });

  function closeMobileSearch(){
    const box = el("#homeSearchbox");
    box.classList.remove("mobile-open");
    if(el("#searchToggle")) el("#searchToggle").setAttribute("aria-expanded","false");
  }
  if(el("#searchToggle")){
    el("#searchToggle").addEventListener("click", ()=>{
      const box = el("#homeSearchbox");
      const opening = !box.classList.contains("mobile-open");
      box.classList.toggle("mobile-open", opening);
      el("#searchToggle").setAttribute("aria-expanded", String(opening));
      if(opening) el("#search").focus();
    });
  }

  el("#filtersToggle").addEventListener("click", ()=>{
    const panel = el("#filters");
    const expanded = panel.classList.contains("collapsed");
    panel.classList.toggle("collapsed");
    el("#filtersToggle").setAttribute("aria-expanded", String(expanded));
    el("#filtersToggleIcon").textContent = expanded ? "▴" : "▾";
  });

  /* =====================================================================
     COMPARADOR (Duel) — buscador con sugerencias + comparación 1 vs 1
     ===================================================================== */
  function shoeMatches(s, q){
    const allResumen = [s.resumen, s.resumen_i18n?.ca, s.resumen_i18n?.en, s.resumen_i18n?.fr].filter(Boolean).join(" ");
    const allCarac = [s.caracteristicas, s.caracteristicas_i18n?.ca, s.caracteristicas_i18n?.en, s.caracteristicas_i18n?.fr].filter(Boolean).map(a=>a.join(" ")).join(" ");
    const hay = [s.marca, s.modelo, usosOf(s).join(" "), s.cierre, s.goma, s.forma, allResumen, s.forro, allCarac].join(" ").toLowerCase();
    return hay.includes(q);
  }

  function renderSuggestions(slot, query){
    const box = document.querySelector(`.picker-suggestions[data-slot="${slot}"]`);
    const otherId = slot === "a" ? state.duel.b : state.duel.a;
    const q = query.trim().toLowerCase();
    let list = SHOES.filter(s=>s.id!==otherId);
    if(q) list = list.filter(s=>shoeMatches(s,q));
    if(!list.length){
      box.innerHTML = `<div class="suggestion-empty">${t("suggestionEmpty")}</div>`;
    } else {
      box.innerHTML = list.map(s=>`
        <button type="button" class="suggestion-item" data-id="${s.id}">
          <span class="suggestion-main">
            <span class="suggestion-brand">${s.marca}</span>
            <span class="suggestion-model">${s.modelo}</span>
          </span>
          <span class="suggestion-tag">${v("uso",s.uso)} · ${v("nivel",s.nivel)}</span>
        </button>`).join("");
      box.querySelectorAll(".suggestion-item").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          state.duel[slot] = btn.dataset.id;
          saveDuel();
          syncHash();
          renderPicker(slot);
          renderDuel();
        });
      });
    }
    box.hidden = false;
  }

  function renderPicker(slot){
    const chosenBox = document.querySelector(`.picker-chosen[data-slot="${slot}"]`);
    const searchBox = document.querySelector(`.picker[data-slot="${slot}"] .picker-search`);
    const input = document.querySelector(`.picker-input[data-slot="${slot}"]`);
    const suggBox = document.querySelector(`.picker-suggestions[data-slot="${slot}"]`);
    const id = state.duel[slot];
    const s = SHOES.find(x=>x.id===id);
    if(s){
      searchBox.hidden = true;
      suggBox.hidden = true;
      chosenBox.hidden = false;
      chosenBox.innerHTML = `
        <span class="mini-badge">${shoePhotoHTML(s)}</span>
        <span class="mini-text">
          <span class="mini-brand">${s.marca}</span>
          <span class="mini-model">${s.modelo}</span>
        </span>
        <button type="button" class="picker-change">${t("pickerChange")}</button>`;
      chosenBox.querySelector(".picker-change").addEventListener("click", ()=>{
        state.duel[slot] = null;
        saveDuel();
        syncHash();
        renderPicker(slot);
        renderDuel();
        input.value = "";
        input.focus();
      });
    } else {
      chosenBox.hidden = true;
      searchBox.hidden = false;
    }
  }

  function duelRowHTML(label, aHTML, bHTML, isDiff, sub){
    return `
      <div class="duel-row${isDiff?" is-diff":""}">
        <div class="col-a"><span class="val">${aHTML}</span>${sub?`<div class="duel-sub">${sub}</div>`:""}</div>
        <div class="col-label">${label}</div>
        <div class="col-b"><span class="val">${bHTML}</span></div>
      </div>`;
  }

  const ROWS_DUEL = [
    { labelKey:"lblPrecio", get:s=>({text:s.precio+"€", html:`${s.precio} €`}) },
    { labelKey:"lblPeso", get:s=>({text:s.peso_g?s.peso_g+"g":"—", html:s.peso_g?`${s.peso_g} g`:`<span class="muted">${t("weightNotAvailable")}</span>`}), sub:(a,b)=> (a.peso_talla||b.peso_talla) ? `${a.peso_talla||"—"} / ${b.peso_talla||"—"}` : null },
    { labelKey:"lblCierre", get:s=>({text:s.cierre, html:s.cierre}) },
    { labelKey:"lblConstruccion", get:s=>({text:construccion(s), html:construccion(s)}) },
    { labelKey:"lblAsimetria", get:s=>({text:s.asimetria, html:`${v("asimetria",s.asimetria)} ${asimetriaBars(s,true)}`}) },
    { labelKey:"lblPerfil", get:s=>({text:s.forma, html:v("forma",s.forma)}) },
    { labelKey:"lblRigidez", get:s=>({text:s.rigidez, html:`${v("rigidez",s.rigidez)} ${rigidezBars(s,true)}`}) },
    { labelKey:"lblSensibilidad", get:s=>({text:s.rigidez+"-sens", html:sensibilidadBars(s,true)}) },
    { labelKey:"lblTipoSuela", get:s=>({text:s.goma, html:s.goma}) },
    { labelKey:"lblGrosorSuela", get:s=>({text:s.grosor||"—", html:s.grosor?`${s.grosor} mm`:"—"}) },
    { labelKey:"lblVolumen", get:s=>({text:s.volumen, html:s.volumen}) },
    { labelKey:"lblForro", get:s=>({text:s.forro||"—", html:s.forro?v("forro",s.forro):t("notSpecified")}) },
    { labelKey:"lblTipoEscalada", get:s=>({text:usosOf(s).join(", "), html:usosLabel(s)}) },
    { labelKey:"lblNivelRecomendado", get:s=>({text:s.nivel, html:v("nivel",s.nivel)}) },
    { labelKey:"lblTallasDisponibles", get:s=>({text:TALLAS[s.marca]||"—", html:TALLAS[s.marca]||"—"}) }
  ];

  function renderDuel(){
    const box = el("#duelResult");
    const a = SHOES.find(s=>s.id===state.duel.a);
    const b = SHOES.find(s=>s.id===state.duel.b);

    if(!a || !b){
      box.innerHTML = `<div class="duel-empty">${t("duelEmptyHTML")}</div>`;
      return;
    }

    const rowsHTML = ROWS_DUEL.map(row=>{
      const va = row.get(a), vb = row.get(b);
      const isDiff = va.text !== vb.text;
      return duelRowHTML(t(row.labelKey), va.html, vb.html, isDiff, row.sub ? row.sub(a,b) : null);
    }).join("");

    box.innerHTML = `
      <div class="duel-result">
        <div class="duel-photo-row">
          <div class="duel-photo">${shoePhotoHTML(a)}</div>
          <div class="vs-badge">VS</div>
          <div class="duel-photo">${shoePhotoHTML(b)}</div>
        </div>
        ${radarCardHTML([
          {s:a, colorVar:"--radar-1", name:`${a.marca} ${a.modelo}`},
          {s:b, colorVar:"--radar-2", name:`${b.marca} ${b.modelo}`}
        ])}
        <div class="duel-info-row">
          <div>
            <div class="duel-info-brand">${a.marca}</div>
            <div class="duel-info-model">${a.modelo}</div>
            <p class="duel-info-desc">${getResumen(a)}</p>
            <div class="duel-features">${features(a).map(f=>`<div class="duel-feature">${f}</div>`).join("")}</div>
          </div>
          <div>
            <div class="duel-info-brand">${b.marca}</div>
            <div class="duel-info-model">${b.modelo}</div>
            <p class="duel-info-desc">${getResumen(b)}</p>
            <div class="duel-features">${features(b).map(f=>`<div class="duel-feature">${f}</div>`).join("")}</div>
          </div>
        </div>
        <div class="duel-rows">${rowsHTML}</div>
        <p class="duel-note">${t("duelNote")}</p>
      </div>`;

    box.querySelectorAll(".duel-photo").forEach((wrap,i)=>{
      const s = i===0 ? a : b;
      if(!s.fotos || !s.fotos.length) return;
      wrap.classList.add("photo-zoomable");
      wrap.setAttribute("role","button");
      wrap.setAttribute("tabindex","0");
      wrap.setAttribute("aria-label", t("lightboxOpen"));
      wrap.insertAdjacentHTML("beforeend", `<span class="photo-zoom-hint" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#icon-zoom"></use></svg></span>`);
      const open = ()=> openLightbox(s.fotos, 0, `${s.marca} ${s.modelo}`);
      wrap.addEventListener("click", open);
      wrap.addEventListener("keydown", (ev)=>{ if(ev.key==="Enter" || ev.key===" "){ ev.preventDefault(); open(); } });
    });
  }

  ["a","b"].forEach(slot=>{
    const input = document.querySelector(`.picker-input[data-slot="${slot}"]`);
    input.addEventListener("focus", ()=> renderSuggestions(slot, input.value));
    input.addEventListener("input", ()=> renderSuggestions(slot, input.value));
    input.addEventListener("blur", ()=>{
      setTimeout(()=>{ document.querySelector(`.picker-suggestions[data-slot="${slot}"]`).hidden = true; }, 150);
    });
  });

  window.addEventListener("hashchange", ()=>{
    const v = parseInitialHash();
    ["a","b"].forEach(renderPicker);
    setView(v);
  });

  /* Si la ventana cambia de ancho (redimensionar, girar una tablet...) el
     número de columnas del catálogo puede cambiar, y con él la posición que
     no deja huecos vacíos junto a los anuncios in-feed — así que se vuelve a
     pintar el catálogo, pero solo cuando el número de columnas cambia de
     verdad (no en cada píxel de redimensionado). */
  let catalogResizeTimer = null;
  window.addEventListener("resize", ()=>{
    clearTimeout(catalogResizeTimer);
    catalogResizeTimer = setTimeout(()=>{
      if(shoesLoaded && catalogColumnCount() !== lastCatalogColumnCount) renderCatalog();
    }, 200);
  });

  renderCatalog();
  setView(parseInitialHash());
  ["a","b"].forEach(renderPicker);

  /* El catálogo real llega de content/shoes.json y los textos editables de   
     content/site.json, ambos de forma asíncrona (ver js/data.js). Hasta que
     lleguen, todo lo anterior pinta con SHOES=[] y los textos por defecto
     escritos en el HTML (de ahí el aviso "Cargando catálogo…" en
     renderCatalog). En cuanto ambas promesas se resuelven, se recalculan los
     valores derivados del catálogo (rangos, opciones de filtro, marcas), se
     revalida la bandeja/duelo guardados contra los datos reales, y se
     repinta toda la interfaz (incluidos los textos del panel) una sola vez. */
  Promise.all([window.__gatoLabShoesReady, window.__gatoLabSiteReady]).then(function(results){
    const shoes = results[0];
    SHOES = shoes;
    shoesLoaded = true;
    GROSOR_RANGE = computeGrosorRange();
    CIERRE_OPTIONS = computeCierreOptions();
    FORMA_OPTIONS = computeFormaOptions();
    MARCAS = computeMarcas();
    state.compare = state.compare.filter(id=>SHOES.some(s=>s.id===id)).slice(0,4);
    if(state.duel.a && !SHOES.some(s=>s.id===state.duel.a)) state.duel.a = null;
    if(state.duel.b && !SHOES.some(s=>s.id===state.duel.b)) state.duel.b = null;
    applyStaticI18n();
    rerenderAll();
    if(state.view === "news" && window.GatoLabNews) window.GatoLabNews.render();
  });

  /* ------------------------------------------------------------------ *
   * Consentimiento de cookies / anuncios (necesario en la UE antes de
   * cargar Google AdSense). Mientras no haya consentimiento, solo se
   * muestran los huecos reservados ("Espacio publicitario").
   * Sustituye ADSENSE_CLIENT_ID por tu ID real (ca-pub-XXXXXXXXXXXXXXXX)
   * en index.html y descomenta la función loadAdsense() de abajo.
   * ------------------------------------------------------------------ */
  function initCookieConsent(){
    let choice = null;
    try{ choice = localStorage.getItem("gatolab_cookie_consent"); }catch(e){}
    if(choice === "accepted"){ loadAdsense(); return; }
    if(choice === "rejected"){ return; }

    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.innerHTML = `
      <p>Usamos cookies propias para el funcionamiento de la web y, si lo aceptas, cookies de Google AdSense para mostrar anuncios y medir su rendimiento. Puedes leer más en la <a href="privacidad.html">política de privacidad</a>.</p>
      <div class="cookie-actions">
        <button class="btn-primary" id="cookieAccept">Aceptar</button>
        <button class="btn-secondary" id="cookieReject">Rechazar</button>
      </div>`;
    document.body.appendChild(banner);
    banner.querySelector("#cookieAccept").addEventListener("click", ()=>{
      try{ localStorage.setItem("gatolab_cookie_consent","accepted"); }catch(e){}
      banner.remove(); loadAdsense();
    });
    banner.querySelector("#cookieReject").addEventListener("click", ()=>{
      try{ localStorage.setItem("gatolab_cookie_consent","rejected"); }catch(e){}
      banner.remove();
    });
  }

  /* Los huecos "in-feed" del catálogo (ver CATALOG_AD_TARGET_INTERVAL más arriba) se
     regeneran cada vez que se repinta el catálogo (filtro, idioma, búsqueda),
     así que pueden aparecer bloques <ins class="adsbygoogle"> nuevos DESPUÉS
     de la carga inicial de la página — momento en el que loadAdsense() ya se
     ejecutó una sola vez. adsenseActive + refreshInFeedAds() son lo que hace
     que esos anuncios nuevos también se activen, sin volver a "empujar" (con
     adsbygoogle.push) uno que Google ya haya procesado — eso rompería el
     anuncio. Solo importa una vez tengas anuncios reales activados; con los
     huecos de "Espacio publicitario" de siempre no hacen nada. */
  let adsenseActive = false;
  function refreshInFeedAds(){
    if(!adsenseActive || !window.adsbygoogle) return;
    document.querySelectorAll("ins.adsbygoogle:not([data-ad-status])").forEach(()=>{
      try{ window.adsbygoogle.push({}); }catch(e){}
    });
  }
  function loadAdsense(){
    // 1) En index.html, sustituye ADSENSE_CLIENT_ID por tu ID real de AdSense.
    // 2) Sustituye el texto "Espacio publicitario..." de cada hueco (incluido
    //    catalogAdSlotNode() más arriba) por tu <ins class="adsbygoogle">.
    // 3) Descomenta las líneas siguientes para cargar el script y activar
    //    tanto los anuncios ya presentes como los que se añadan más tarde.
    // adsenseActive = true;
    // const script = document.createElement("script");
    // script.async = true;
    // script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ADSENSE_CLIENT_ID";
    // script.crossOrigin = "anonymous";
    // script.onload = refreshInFeedAds;
    // document.head.appendChild(script);
  }

  initCookieConsent();
  initContactForm();

  /* Puente mínimo para que js/news.js pueda cambiar de pantalla y abrir la
     ficha de un modelo (botón "Ver modelo →" dentro de un artículo). */
  window.GatoLab = {
    setView: setView,
    openDetail: openDetail,
    isNewsView: ()=> state.view === "news"
  };
})();
