/* ==========================================================================
   Gato Lab — TEST «Encuentra tu pie de gato» (arriba de la pestaña «Guía»)
   --------------------------------------------------------------------------
   Unas pocas preguntas tipo test y, con las respuestas, se puntúan todos los
   modelos de content/shoes.json según su nivel, uso, forma, asimetría,
   rigidez, volumen de horma, cierre y etiquetas (vegano / infantil).
   Se muestran los 6 que mejor encajan, cada uno con el porqué.

   Las preguntas se adaptan: quien no ha escalado nunca no ve las preguntas
   técnicas (grado, terreno, rigidez), y para niños solo hay tres.

   Se apoya en window.GatoLab (final de js/app.js) para el idioma, para abrir
   la ficha de un modelo y para las etiquetas traducidas.
   ========================================================================== */
(function(){
  "use strict";

  const L = (es, ca, en, fr) => ({es, ca, en, fr});

  const UI = {
    eyebrow:  L("TEST · 1 MINUTO", "TEST · 1 MINUT", "QUIZ · 1 MINUTE", "TEST · 1 MINUTE"),
    title:    L("Encuentra tu pie de gato", "Troba el teu peu de gat", "Find your climbing shoe", "Trouve ton chausson"),
    intro:    L("Responde unas preguntas rápidas y te recomendamos los 6 modelos del catálogo que mejor encajan contigo. Sirve tanto si vas a comprar tu primer pie de gato como si llevas años escalando y buscas el modelo perfecto.",
                "Respon unes preguntes ràpides i et recomanem els 6 models del catàleg que millor encaixen amb tu. Serveix tant si compraràs el teu primer peu de gat com si fa anys que escales i busques el model perfecte.",
                "Answer a few quick questions and we'll recommend the 6 shoes in the catalogue that suit you best. It works whether you're buying your first pair or you've been climbing for years and want the perfect model.",
                "Réponds à quelques questions rapides et nous te recommandons les 6 modèles du catalogue qui te conviennent le mieux. Ça marche que tu achètes tes premiers chaussons ou que tu grimpes depuis des années et cherches le modèle parfait."),
    start:    L("Empezar el test", "Començar el test", "Start the quiz", "Commencer le test"),
    meta:     L("Entre 3 y 10 preguntas", "Entre 3 i 10 preguntes", "Between 3 and 10 questions", "Entre 3 et 10 questions"),
    step:     L("Pregunta {n} de {t}", "Pregunta {n} de {t}", "Question {n} of {t}", "Question {n} sur {t}"),
    back:     L("Atrás", "Enrere", "Back", "Retour"),
    loading:  L("Cargando el catálogo…", "Carregant el catàleg…", "Loading the catalogue…", "Chargement du catalogue…"),
    error:    L("No se ha podido cargar el catálogo. Vuelve a intentarlo en unos minutos.", "No s'ha pogut carregar el catàleg. Torna-ho a provar d'aquí a uns minuts.", "The catalogue could not be loaded. Please try again in a few minutes.", "Le catalogue n'a pas pu être chargé. Réessaie dans quelques minutes."),
    resEyebrow: L("TU RESULTADO", "EL TEU RESULTAT", "YOUR RESULT", "TON RÉSULTAT"),
    resTitle: L("Tus pies de gato", "Els teus peus de gat", "Your climbing shoes", "Tes chaussons"),
    resIntro: L("Estos son los modelos que mejor encajan con tus respuestas, ordenados de más a menos. Pulsa en cualquiera para ver su ficha completa.",
                "Aquests són els models que millor encaixen amb les teves respostes, ordenats de més a menys. Prem-ne qualsevol per veure'n la fitxa completa.",
                "These are the shoes that best match your answers, from best to worst fit. Tap any of them to see the full spec sheet.",
                "Voici les modèles qui correspondent le mieux à tes réponses, du plus au moins adapté. Touche-en un pour voir sa fiche complète."),
    match:    L("encaje", "encaix", "match", "affinité"),
    seeSheet: L("Ver ficha", "Veure fitxa", "See details", "Voir la fiche"),
    more:     L("Ver 6 más", "Veure'n 6 més", "Show 6 more", "Voir 6 de plus"),
    compare:  L("Comparar los dos primeros", "Comparar els dos primers", "Compare the top two", "Comparer les deux premiers"),
    edit:     L("Cambiar respuestas", "Canviar respostes", "Change answers", "Modifier mes réponses"),
    restart:  L("Repetir el test", "Repetir el test", "Retake the quiz", "Refaire le test"),
    fewVegan: L("Hay pocos modelos veganos que encajen con todo lo que buscas, así que también te mostramos algunos que no lo son.",
                "Hi ha pocs models vegans que encaixin amb tot el que busques, així que també te'n mostrem alguns que no ho són.",
                "Few vegan models match everything you're looking for, so we're also showing some that aren't vegan.",
                "Peu de modèles végans correspondent à tout ce que tu cherches, alors nous t'en montrons aussi quelques-uns qui ne le sont pas."),
    fewClosure: L("Hay pocos modelos con ese cierre que encajen contigo, así que también te mostramos otros.",
                "Hi ha pocs models amb aquest tancament que encaixin amb tu, així que també te'n mostrem d'altres.",
                "Few models with that closure match you, so we're also showing others.",
                "Peu de modèles avec cette fermeture te correspondent, alors nous t'en montrons aussi d'autres."),
    noPhoto:  L("Sin foto", "Sense foto", "No photo", "Sans photo")
  };

  /* ---------------------------------------------------------------- *
   * Preguntas. `show(a)` decide si la pregunta aparece según las
   * respuestas anteriores (a = objeto con las respuestas).
   * ---------------------------------------------------------------- */
  const beginner = a => a.exp === "nunca";
  const adult = a => a.quien !== "nino";

  const QUESTIONS = [
    { id:"quien", show:()=>true,
      q: L("¿Para quién es el pie de gato?", "Per a qui és el peu de gat?", "Who are the shoes for?", "Pour qui sont les chaussons ?"),
      opts:[
        {v:"adulto", t:L("Para mí (adulto)", "Per a mi (adult)", "For me (adult)", "Pour moi (adulte)")},
        {v:"nino",   t:L("Para un niño o una niña", "Per a un nen o una nena", "For a child", "Pour un enfant")}
      ]},
    { id:"exp", show:adult,
      q: L("¿Cuánta experiencia tienes escalando?", "Quanta experiència tens escalant?", "How much climbing experience do you have?", "Quelle est ton expérience en escalade ?"),
      opts:[
        {v:"nunca", t:L("Ninguna: voy a empezar ahora", "Cap: començaré ara", "None: I'm just starting", "Aucune : je commence"), h:L("O solo he probado un par de veces con pies de gato de alquiler.", "O només ho he provat un parell de vegades amb peus de gat de lloguer.", "Or I've only tried a couple of times with rental shoes.", "Ou j'ai juste essayé deux ou trois fois avec des chaussons de location.")},
        {v:"poco",  t:L("Menos de un año", "Menys d'un any", "Less than a year", "Moins d'un an")},
        {v:"medio", t:L("Entre 1 y 3 años, escalo con regularidad", "Entre 1 i 3 anys, escalo amb regularitat", "1 to 3 years, I climb regularly", "Entre 1 et 3 ans, je grimpe régulièrement")},
        {v:"mucho", t:L("Más de 3 años", "Més de 3 anys", "More than 3 years", "Plus de 3 ans")}
      ]},
    { id:"grado", show:a=> adult(a) && !beginner(a),
      q: L("¿Qué grado sueles escalar?", "Quin grau acostumes a escalar?", "What grade do you usually climb?", "Quel niveau grimpes-tu habituellement ?"),
      help: L("En vía (y su equivalente aproximado en bloque).", "En via (i el seu equivalent aproximat en bloc).", "Sport grade (and its rough bouldering equivalent).", "En voie (et son équivalent approximatif en bloc)."),
      opts:[
        {v:"g1", t:L("Hasta 5+", "Fins a 5+", "Up to 5+ (5.9)", "Jusqu'à 5+"), h:L("Bloque: hasta 4+", "Bloc: fins a 4+", "Bouldering: up to V0", "Bloc : jusqu'à 4+")},
        {v:"g2", t:L("6a – 6b+", "6a – 6b+", "6a – 6b+ (5.10a–5.10d)", "6a – 6b+"), h:L("Bloque: 5 – 6a", "Bloc: 5 – 6a", "Bouldering: V1 – V3", "Bloc : 5 – 6a")},
        {v:"g3", t:L("6c – 7a+", "6c – 7a+", "6c – 7a+ (5.11a–5.11d)", "6c – 7a+"), h:L("Bloque: 6b – 7a", "Bloc: 6b – 7a", "Bouldering: V4 – V6", "Bloc : 6b – 7a")},
        {v:"g4", t:L("7b o más", "7b o més", "7b or harder (5.12a+)", "7b ou plus"), h:L("Bloque: 7a+ o más", "Bloc: 7a+ o més", "Bouldering: V7 or harder", "Bloc : 7a+ ou plus")},
        {v:"nose", t:L("No lo sé", "No ho sé", "I don't know", "Je ne sais pas")}
      ]},
    { id:"uso", show:adult,
      q: L("¿Dónde o qué vas a escalar sobre todo?", "On o què escalaràs sobretot?", "Where or what will you mostly climb?", "Où ou quoi vas-tu grimper surtout ?"),
      opts:[
        {v:"Rocódromo",   t:L("Rocódromo (vías y bloque indoor)", "Rocòdrom (vies i bloc indoor)", "Climbing gym (ropes and bouldering)", "Salle d'escalade (voies et bloc)")},
        {v:"Bloque",      t:L("Bloque, en roca o en rocódromo", "Bloc, a roca o a rocòdrom", "Bouldering, outdoors or indoors", "Bloc, en falaise ou en salle")},
        {v:"Deportiva",   t:L("Vías de deportiva en roca", "Vies d'esportiva a roca", "Outdoor sport routes", "Voies sportives en falaise")},
        {v:"Fisura/Trad", t:L("Fisuras, clásicas y vías largas", "Fissures, clàssiques i vies llargues", "Cracks, trad and multi-pitch", "Fissures, terrain d'aventure et grandes voies")},
        {v:"Todoterreno", t:L("Un poco de todo", "Una mica de tot", "A bit of everything", "Un peu de tout")}
      ]},
    { id:"terreno", show:a=> adult(a) && !beginner(a) && a.uso !== "Fisura/Trad",
      q: L("¿En qué terreno te sientes más a gusto?", "En quin terreny t'hi sents més a gust?", "Which terrain do you enjoy most?", "Sur quel terrain es-tu le plus à l'aise ?"),
      opts:[
        {v:"placa",    t:L("Placas y vertical", "Plaques i vertical", "Slabs and vertical walls", "Dalles et vertical"), h:L("Mucho trabajo de pies en presas pequeñas y adherencia.", "Molta feina de peus en preses petites i adherència.", "Lots of footwork on small holds and smearing.", "Beaucoup de travail de pieds sur petites prises et en adhérence.")},
        {v:"desplome", t:L("Desplomes y techos", "Desploms i sostres", "Overhangs and roofs", "Dévers et toits"), h:L("Tirar con la punta, ganchos de talón y puntera.", "Tibar amb la punta, ganxos de taló i puntera.", "Pulling with the toes, heel and toe hooks.", "Tirer avec la pointe, crochets de talon et de pointe.")},
        {v:"todo",     t:L("De todo un poco", "Una mica de tot", "A mix of everything", "Un peu de tout")}
      ]},
    { id:"prioridad", show:adult,
      q: L("¿Qué es lo más importante para ti?", "Què és el més important per a tu?", "What matters most to you?", "Qu'est-ce qui compte le plus pour toi ?"),
      opts:[
        {v:"comodidad",  t:L("Comodidad: poder llevarlos horas", "Comoditat: poder-los portar hores", "Comfort: wearing them for hours", "Le confort : les porter des heures")},
        {v:"equilibrio", t:L("Un equilibrio entre comodidad y precisión", "Un equilibri entre comoditat i precisió", "A balance of comfort and precision", "Un équilibre entre confort et précision")},
        {v:"rendimiento",t:L("Rendimiento máximo, aunque aprieten", "Rendiment màxim, encara que estrenyin", "Maximum performance, even if they're tight", "Performance maximale, même s'ils serrent")}
      ]},
    { id:"rigidez", show:a=> adult(a) && !beginner(a),
      q: L("¿Cómo prefieres que sea la suela?", "Com prefereixes que sigui la sola?", "How do you like the sole to feel?", "Comment préfères-tu la semelle ?"),
      opts:[
        {v:"blanda", t:L("Blanda: quiero sentir la roca", "Tova: vull sentir la roca", "Soft: I want to feel the rock", "Souple : je veux sentir le rocher"), h:L("Más sensibilidad y agarre en volúmenes; los pies trabajan más.", "Més sensibilitat i adherència en volums; els peus treballen més.", "More feel and grip on volumes; your feet work harder.", "Plus de sensibilité et d'adhérence sur les volumes ; les pieds travaillent plus.")},
        {v:"media",  t:L("Intermedia", "Intermèdia", "Somewhere in between", "Intermédiaire")},
        {v:"firme",  t:L("Firme: apoyo en cantos pequeños", "Ferma: suport en cantells petits", "Stiff: support on small edges", "Rigide : du soutien sur les petites réglettes"), h:L("Los pies se cansan menos en vías largas y regletas.", "Els peus es cansen menys en vies llargues i regletes.", "Less foot fatigue on long routes and edges.", "Les pieds fatiguent moins dans les longues voies et sur les réglettes.")},
        {v:"nose",   t:L("No lo sé", "No ho sé", "I don't know", "Je ne sais pas")}
      ]},
    { id:"pie", show:adult,
      q: L("¿Cómo es tu pie?", "Com és el teu peu?", "What is your foot like?", "Comment est ton pied ?"),
      opts:[
        {v:"estrecho", t:L("Estrecho, fino o con talón pequeño", "Estret, prim o amb taló petit", "Narrow, slim or with a small heel", "Étroit, fin ou avec un petit talon"), h:L("Te sobra espacio en muchas zapatillas.", "Et sobra espai en moltes sabates.", "Most shoes feel roomy on you.", "Tu flottes dans beaucoup de chaussures.")},
        {v:"normal",   t:L("Normal", "Normal", "Average", "Normal")},
        {v:"ancho",    t:L("Ancho o con volumen", "Ample o amb volum", "Wide or high-volume", "Large ou volumineux"), h:L("Las zapatillas suelen apretarte por los lados.", "Les sabates t'acostumen a estrènyer pels costats.", "Shoes usually squeeze you at the sides.", "Les chaussures te serrent souvent sur les côtés.")},
        {v:"nose",     t:L("No lo sé", "No ho sé", "I don't know", "Je ne sais pas")}
      ]},
    { id:"cierre", show:()=>true,
      q: L("¿Qué tipo de cierre prefieres?", "Quin tipus de tancament prefereixes?", "Which closure do you prefer?", "Quelle fermeture préfères-tu ?"),
      opts:[
        {v:"velcro",   t:L("Velcro", "Velcro", "Velcro", "Velcro"), h:L("Rápido de poner y quitar. El más práctico.", "Ràpid de posar i treure. El més pràctic.", "Quick on and off. The most practical.", "Rapide à mettre et à enlever. Le plus pratique.")},
        {v:"cordones", t:L("Cordones", "Cordons", "Laces", "Lacets"), h:L("El ajuste más preciso, ideal para vías largas.", "L'ajust més precís, ideal per a vies llargues.", "The most precise fit, great for long routes.", "L'ajustement le plus précis, idéal pour les longues voies.")},
        {v:"slipper",  t:L("Slipper (sin cierre)", "Slipper (sense tancament)", "Slipper (no closure)", "Slipper (sans fermeture)"), h:L("Muy sensibles y ligeros; se ajustan por elástico.", "Molt sensibles i lleugers; s'ajusten amb elàstic.", "Very sensitive and light; elastic fit.", "Très sensibles et légers ; ajustement élastique.")},
        {v:"igual",    t:L("Me da igual", "M'és igual", "No preference", "Peu importe")}
      ]},
    { id:"vegano", show:()=>true,
      q: L("¿Buscas un modelo vegano?", "Busques un model vegà?", "Are you looking for a vegan model?", "Cherches-tu un modèle végan ?"),
      help: L("Sin piel ni colas de origen animal.", "Sense pell ni coles d'origen animal.", "No leather or animal-based glues.", "Sans cuir ni colles d'origine animale."),
      opts:[
        {v:"si",    t:L("Sí, solo veganos", "Sí, només vegans", "Yes, vegan only", "Oui, uniquement végans")},
        {v:"igual", t:L("Me da igual", "M'és igual", "No preference", "Peu importe")}
      ]}
  ];

  /* ---------------------------------------------------------------- *
   * Lectura de los datos de cada modelo
   * ---------------------------------------------------------------- */
  const NIVEL = {"Iniciación":0, "Intermedio":1, "Avanzado":2};
  const FORMA = {"Plana":0, "Casi plana":0.5, "Neutra":0.5, "Casi simétrica":0.5, "Moderada":2, "Moderada-agresiva":2.5, "Agresiva":3, "Muy agresiva":4};
  const ASIM = {"Baja":0, "Media":1, "Alta":2};
  const RIG = {"Blanda":0, "Media":1, "Rígida":2};

  function cierreTipo(c){
    c = String(c || "");
    if(/slipper|sin cierre/i.test(c) || /^el[aá]stico(?!.*velcro)/i.test(c)) return "slipper";
    if(/cord/i.test(c)) return "cordones";
    if(/velcro|correa|strap/i.test(c)) return "velcro";
    return "otro";
  }
  function horma(s){
    const v = String(s.volumen || "");
    if(/ancha.*estrecha|estrecha.*ancha|ancho disponibles/i.test(v)) return "ambas";
    if(s.lv || /bajo|estrech|\bLV\b|femenin|mujer/i.test(v)) return "estrecho";
    if(/alto|amplio|ancha|\bHV\b|est[aá]ndar-ancho/i.test(v)) return "ancho";
    return "normal";
  }
  function baseModelo(s){
    return (s.marca + " " + s.modelo).toLowerCase()
      .replace(/\b(lv|hv|wmns|women'?s?|woman|wmn|men'?s?|mujer|hombre|vegan|low volume|high volume|lace|laces|vcr|velcro|(19|20)\d\d)\b/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  /* ---------------------------------------------------------------- *
   * Estado
   * ---------------------------------------------------------------- */
  let SHOES = null, loadFailed = false, loading = null;
  let answers = {}, stage = "intro", pos = 0, shown = 6, slot = null;

  const lang = () => (window.GatoLab && window.GatoLab.getLang) ? window.GatoLab.getLang() : "es";
  const tr = o => { if(!o) return ""; if(typeof o === "string") return o; return o[lang()] || o.es || ""; };
  const ui = (k, vars) => { let s = tr(UI[k]); if(vars) Object.keys(vars).forEach(x=> s = s.replace("{"+x+"}", vars[x])); return s; };
  const esc = s => String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const label = (tipo, valor) => (window.GatoLab && window.GatoLab.filterLabel) ? window.GatoLab.filterLabel(tipo, valor) : valor;

  function loadShoes(){
    if(SHOES || loading) return loading;
    loading = fetch("content/shoes.json")
      .then(r => { if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(d => { SHOES = (d && d.zapatillas) || []; })
      .catch(e => { console.error("GATO LAB (test): no se pudo cargar content/shoes.json —", e); loadFailed = true; })
      .then(() => { if(stage === "results") render(); });
    return loading;
  }

  const visibleQuestions = () => QUESTIONS.filter(q => q.show(answers));

  /* ---------------------------------------------------------------- *
   * Motor de recomendación
   * ---------------------------------------------------------------- */
  function profile(a){
    const kid = a.quien === "nino";
    const expLvl = {nunca:0, poco:0.45, medio:1.15, mucho:1.75}[a.exp] ?? 0.6;
    const gradoLvl = {g1:0.15, g2:0.85, g3:1.55, g4:2}[a.grado];
    let lvl = kid ? 0 : (gradoLvl == null ? expLvl : (expLvl + 2*gradoLvl) / 3);
    const uso = kid ? "Rocódromo" : (a.uso || "Todoterreno");

    // Agresividad buscada (0 = plana … 4 = muy agresiva)
    let agg = 0.2 + lvl * 1.45;
    if(a.terreno === "placa") agg -= 0.8;
    if(a.terreno === "desplome") agg += 0.8;
    if(a.prioridad === "comodidad") agg -= 0.9;
    if(a.prioridad === "rendimiento") agg += 0.6;
    if(uso === "Bloque") agg += 0.3;
    if(uso === "Todoterreno" || uso === "Deportiva") agg -= 0.1;
    if(uso === "Fisura/Trad") agg = Math.min(agg, 0.9);
    if(uso === "Rocódromo" && lvl < 0.7) agg = Math.min(agg, 0.8);
    agg = Math.max(0, Math.min(4, agg));

    // Rigidez buscada (0 blanda … 2 rígida)
    let rig = {blanda:0.1, media:1, firme:1.9}[a.rigidez];
    if(rig == null){
      rig = 1;
      if(uso === "Fisura/Trad") rig += 0.7;
      if(uso === "Bloque") rig -= 0.45;
      if(a.terreno === "placa") rig += 0.3;
      if(a.terreno === "desplome") rig -= 0.4;
      if(lvl < 0.5) rig = Math.max(rig, 0.9);
      rig = Math.max(0, Math.min(2, rig));
    }
    return {kid, lvl, uso, agg, asim: Math.min(2, agg / 1.8), rig};
  }

  function scoreShoe(s, p, a){
    const parts = {};
    // Nivel
    const sl = NIVEL[s.nivel] ?? 1;
    let cL = Math.max(0, 1 - Math.abs(sl - p.lvl) / 2);
    if(sl - p.lvl > 0.8) cL *= 0.35;          // demasiado técnico para ti
    parts.nivel = [cL, 3];
    // Uso
    let cU = 0;
    const usos = Array.isArray(s.usos) ? s.usos : [];
    if(s.uso === p.uso) cU = 1;
    else if(usos.includes(p.uso)) cU = 0.72;
    else if(p.uso === "Todoterreno" && (s.uso === "Rocódromo" || s.uso === "Deportiva")) cU = 0.55;
    else if(s.uso === "Todoterreno") cU = 0.5;
    else if(s.uso === "Competición" && (p.uso === "Bloque" || p.uso === "Rocódromo")) cU = 0.5;
    parts.uso = [cU, 3];
    // Forma y asimetría
    const f = FORMA[s.forma] ?? 2;
    parts.forma = [Math.max(0, 1 - Math.abs(f - p.agg) / 3), 2.3];
    parts.asim = [Math.max(0, 1 - Math.abs((ASIM[s.asimetria] ?? 1) - p.asim) / 2), 1];
    // Rigidez
    parts.rig = [Math.max(0, 1 - Math.abs((RIG[s.rigidez] ?? 1) - p.rig) / 2), a.rigidez && a.rigidez !== "nose" ? 1.8 : 1.2];
    // Horma
    if(!p.kid){
      const h = horma(s);
      const pie = a.pie || "nose";
      const M = {
        estrecho: {estrecho:1, ambas:0.9, normal:0.55, ancho:0},
        normal:   {estrecho:0.55, ambas:0.9, normal:1, ancho:0.6},
        ancho:    {estrecho:0, ambas:0.9, normal:0.5, ancho:1},
        nose:     {estrecho:0.75, ambas:0.9, normal:1, ancho:0.85}
      }[pie] || {};
      parts.pie = [M[h] ?? 0.8, pie === "nose" ? 0.5 : 1.8];
    }
    // Cierre
    if(a.cierre && a.cierre !== "igual") parts.cierre = [cierreTipo(s.cierre) === a.cierre ? 1 : 0, 1.6];

    let sum = 0, w = 0;
    Object.keys(parts).forEach(k => { sum += parts[k][0] * parts[k][1]; w += parts[k][1]; });
    const pct = Math.round(100 * sum / w);

    // Desempate (a igual % de encaje): popularidad (orden destacado), sello GATO LAB y precio para quien empieza
    let bonus = 0;
    if(typeof s.destacado === "number") bonus += 1.2 * (1 - (s.destacado - 1) / 110);
    if(s.sello) bonus += 0.4;
    if(p.lvl < 0.6 && typeof s.precio === "number") bonus += s.precio <= 100 ? 0.8 : (s.precio > 140 ? -0.8 : 0);
    return {s, pct, bonus, parts};
  }

  function recommend(){
    const a = answers, p = profile(a);
    let pool = SHOES.filter(s => p.kid ? s.infantil === true : s.infantil !== true);
    const notes = [];
    const scored = pool.map(s => scoreShoe(s, p, a)).sort((x, y) => (y.pct - x.pct) || (y.bonus - x.bonus));

    const apply = (list, test, note) => {
      const f = list.filter(test);
      if(f.length >= 6) return f;
      notes.push(note);
      return f.concat(list.filter(x => !test(x)));
    };
    let list = scored;
    if(a.vegano === "si") list = apply(list, x => x.s.vegano === true, "fewVegan");
    if(a.cierre && a.cierre !== "igual") list = apply(list, x => cierreTipo(x.s.cierre) === a.cierre, "fewClosure");

    // Una sola versión de cada modelo (p. ej. no «Drago» y «Drago LV» a la vez)
    const seen = new Set(), out = [];
    list.forEach(x => { const b = baseModelo(x.s); if(!seen.has(b)){ seen.add(b); out.push(x); } });
    return {list: out, notes, p};
  }

  /* Por qué encaja: hasta 3 motivos, del más al menos importante */
  const WHY = {
    nivel:   {0:L("Pensado para empezar","Pensat per començar","Made for beginners","Pensé pour débuter"), 1:L("Nivel intermedio: para seguir progresando","Nivell intermedi: per seguir progressant","Intermediate level: built to help you progress","Niveau intermédiaire : pour continuer à progresser"), 2:L("Modelo técnico para escaladores con experiencia","Model tècnic per a escaladors amb experiència","Technical shoe for experienced climbers","Modèle technique pour grimpeurs expérimentés")},
    usoMain: L("Ideal para {u}","Ideal per a {u}","Ideal for {u}","Idéal pour {u}"),
    usoAlso: L("También rinde en {u}","També rendeix en {u}","Also performs in {u}","Performant aussi en {u}"),
    usoAll:  L("Versátil: sirve para casi todo","Versàtil: serveix per a gairebé tot","Versatile: works for almost everything","Polyvalent : convient à presque tout"),
    forma:   {0:L("Horma plana y cómoda","Horma plana i còmoda","Flat, comfortable fit","Forme plate et confortable"), 1:L("Curvatura moderada: cómodo y preciso","Curvatura moderada: còmode i precís","Moderate downturn: comfortable and precise","Cambrure modérée : confortable et précis"), 2:L("Horma agresiva para desplomes y puntera","Horma agressiva per a desploms i puntera","Aggressive shape for overhangs and toeing in","Forme agressive pour les dévers")},
    rig:     {0:L("Suela blanda y muy sensible","Sola tova i molt sensible","Soft, very sensitive sole","Semelle souple et très sensible"), 1:L("Rigidez media: sensibilidad y apoyo","Rigidesa mitjana: sensibilitat i suport","Medium stiffness: feel and support","Rigidité moyenne : sensibilité et soutien"), 2:L("Suela firme: apoyo en cantos pequeños","Sola ferma: suport en cantells petits","Stiff sole: support on small edges","Semelle rigide : soutien sur les petites prises")},
    estrecho: L("Horma estrecha (LV), para pies finos","Horma estreta (LV), per a peus prims","Low-volume (LV) fit for narrow feet","Forme étroite (LV) pour pieds fins"),
    ancho:   L("Horma amplia, para pies con volumen","Horma àmplia, per a peus amb volum","Roomy fit for wide feet","Forme large pour pieds volumineux"),
    cierre:  {velcro:L("Cierre de velcro","Tancament de velcro","Velcro closure","Fermeture velcro"), cordones:L("Cierre de cordones","Tancament de cordons","Lace-up","Fermeture à lacets"), slipper:L("Slipper, sin cierre","Slipper, sense tancament","Slipper, no closure","Slipper, sans fermeture")},
    vegano:  L("Vegano","Vegà","Vegan","Végan"),
    precio:  L("Buen precio para empezar","Bon preu per començar","Good price to start with","Bon prix pour débuter"),
    kids:    L("Pensado para niños","Pensat per a nens","Designed for kids","Conçu pour les enfants")
  };
  const usoTxt = u => String(label("uso", u)).toLowerCase();

  function reasons(r, p){
    const s = r.s, a = answers, out = [];
    const P = r.parts;
    if(p.kid) out.push(tr(WHY.kids));
    if(!p.kid && P.nivel[0] >= 0.75) out.push(tr(WHY.nivel[NIVEL[s.nivel] ?? 1]));
    if(!p.kid){
      if(s.uso === p.uso && p.uso === "Todoterreno") out.push(tr(WHY.usoAll));
      else if(s.uso === p.uso) out.push(tr(WHY.usoMain).replace("{u}", usoTxt(p.uso)));
      else if((s.usos || []).includes(p.uso)) out.push(tr(WHY.usoAlso).replace("{u}", usoTxt(p.uso)));
    }
    if(P.pie && P.pie[0] >= 0.9 && a.pie === "estrecho" && horma(s) !== "normal") out.push(tr(WHY.estrecho));
    if(P.pie && P.pie[0] >= 0.9 && a.pie === "ancho" && horma(s) !== "normal") out.push(tr(WHY.ancho));
    const f = FORMA[s.forma] ?? 2;
    if(P.forma[0] >= 0.7) out.push(tr(WHY.forma[f < 1 ? 0 : (f < 2.8 ? 1 : 2)]));
    if(P.rig[0] >= 0.75) out.push(tr(WHY.rig[RIG[s.rigidez] ?? 1]));
    if(a.vegano === "si" && s.vegano) out.push(tr(WHY.vegano));
    if(P.cierre && P.cierre[0] === 1) out.push(tr(WHY.cierre[a.cierre]));
    if(p.lvl < 0.6 && typeof s.precio === "number" && s.precio <= 100) out.push(tr(WHY.precio));
    return out.slice(0, 3);
  }

  /* ---------------------------------------------------------------- *
   * Pintado
   * ---------------------------------------------------------------- */
  function render(){
    if(!slot || !document.body.contains(slot)) return;
    if(stage === "intro") slot.innerHTML = introHTML();
    else if(stage === "quiz") slot.innerHTML = questionHTML();
    else slot.innerHTML = resultsHTML();
    wire();
  }

  function introHTML(){
    return `
      <div class="quiz-card quiz-intro">
        <div class="quiz-intro-text">
          <div class="quiz-eyebrow">${ui("eyebrow")}</div>
          <h2 class="quiz-title">${ui("title")}</h2>
          <p class="quiz-lead">${ui("intro")}</p>
        </div>
        <div class="quiz-intro-cta">
          <button type="button" class="btn-primary quiz-start">${ui("start")} →</button>
          <span class="quiz-meta">${ui("meta")}</span>
        </div>
      </div>`;
  }

  function questionHTML(){
    const qs = visibleQuestions();
    if(pos >= qs.length) pos = qs.length - 1;
    const q = qs[pos];
    const letters = "ABCDEFG";
    const pctDone = Math.round(100 * pos / qs.length);
    return `
      <div class="quiz-card quiz-step" role="group" aria-labelledby="quizQ">
        <div class="quiz-top">
          <button type="button" class="quiz-back"${pos === 0 ? " hidden" : ""}>← ${ui("back")}</button>
          <span class="quiz-count">${ui("step", {n: pos + 1, t: qs.length})}</span>
        </div>
        <div class="quiz-progress" aria-hidden="true"><span style="width:${pctDone}%"></span></div>
        <h3 class="quiz-question" id="quizQ">${esc(tr(q.q))}</h3>
        ${q.help ? `<p class="quiz-help">${esc(tr(q.help))}</p>` : ""}
        <div class="quiz-options">
          ${q.opts.map((o, i) => `
            <button type="button" class="quiz-option${answers[q.id] === o.v ? " is-selected" : ""}" data-q="${q.id}" data-v="${esc(o.v)}">
              <span class="quiz-letter">${letters[i]}</span>
              <span class="quiz-option-text"><strong>${esc(tr(o.t))}</strong>${o.h ? `<small>${esc(tr(o.h))}</small>` : ""}</span>
            </button>`).join("")}
        </div>
      </div>`;
  }

  function summaryChips(p){
    const a = answers, chips = [];
    if(p.kid) chips.push(tr(QUESTIONS[0].opts[1].t));
    else {
      chips.push(label("nivel", ["Iniciación","Intermedio","Avanzado"][p.lvl < 0.6 ? 0 : (p.lvl < 1.5 ? 1 : 2)]));
      chips.push(label("uso", p.uso));
      if(a.pie && a.pie !== "nose" && a.pie !== "normal") chips.push(tr(QUESTIONS.find(q=>q.id==="pie").opts.find(o=>o.v===a.pie).t).split(/[,(]/)[0].trim());
    }
    if(a.cierre && a.cierre !== "igual") chips.push(tr(WHY.cierre[a.cierre]));
    if(a.vegano === "si") chips.push(tr(WHY.vegano));
    return chips.map(c => `<span class="quiz-chip">${esc(c)}</span>`).join("");
  }

  function resultsHTML(){
    if(!SHOES){
      if(loadFailed) return `<div class="quiz-card"><p class="quiz-status">${ui("error")}</p></div>`;
      loadShoes();
      return `<div class="quiz-card"><p class="quiz-status">${ui("loading")}</p></div>`;
    }
    const {list, notes, p} = recommend();
    const top = list.slice(0, shown);
    const L2 = lang();
    return `
      <div class="quiz-card quiz-results">
        <div class="quiz-eyebrow">${ui("resEyebrow")}</div>
        <h2 class="quiz-title">${ui("resTitle")}</h2>
        <div class="quiz-chips">${summaryChips(p)}</div>
        <p class="quiz-lead">${ui("resIntro")}</p>
        ${notes.map(n => `<p class="quiz-note">${ui(n)}</p>`).join("")}
        <ol class="quiz-grid">
          ${top.map((r, i) => {
            const s = r.s;
            const para = (s.para_quien_i18n && s.para_quien_i18n[L2]) || s.para_quien || "";
            const foto = s.fotos && s.fotos[0];
            return `
            <li class="quiz-result">
              <button type="button" class="quiz-result-photo" data-open="${esc(s.id)}" aria-label="${esc(ui("seeSheet"))}: ${esc(s.marca + " " + s.modelo)}">
                <span class="quiz-rank">${i + 1}</span>
                ${foto ? `<img src="${esc(foto)}" alt="${esc(s.marca + " " + s.modelo)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'quiz-nophoto',textContent:'${esc(ui("noPhoto"))}'}))">` : `<span class="quiz-nophoto">${ui("noPhoto")}</span>`}
              </button>
              <div class="quiz-result-body">
                <div class="quiz-result-head">
                  <div>
                    <div class="quiz-brand">${esc(s.marca)}</div>
                    <h4 class="quiz-model">${esc(s.modelo)}</h4>
                  </div>
                  <div class="quiz-match"><strong>${r.pct}%</strong><span>${ui("match")}</span></div>
                </div>
                <ul class="quiz-why">${reasons(r, p).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
                ${para ? `<p class="quiz-para">${esc(para)}</p>` : ""}
                <div class="quiz-result-foot">
                  <span class="quiz-price">${typeof s.precio === "number" ? esc((Number.isInteger(s.precio) ? String(s.precio) : s.precio.toFixed(2)).replace(".", L2 === "en" ? "." : ",")) + " €" : ""}</span>
                  <button type="button" class="btn-secondary quiz-open" data-open="${esc(s.id)}">${ui("seeSheet")} →</button>
                </div>
              </div>
            </li>`;
          }).join("")}
        </ol>
        <div class="quiz-actions">
          ${list.length > shown && shown < 18 ? `<button type="button" class="btn-secondary quiz-more">${ui("more")}</button>` : ""}
          ${top.length >= 2 ? `<button type="button" class="btn-secondary quiz-compare" data-a="${esc(top[0].s.id)}" data-b="${esc(top[1].s.id)}">${ui("compare")} →</button>` : ""}
          <button type="button" class="btn-secondary quiz-edit">← ${ui("edit")}</button>
          <button type="button" class="btn-secondary quiz-restart">${ui("restart")}</button>
        </div>
      </div>`;
  }

  function keepInView(){
    if(!slot) return;
    const bar = document.querySelector("header");
    const off = (bar && getComputedStyle(bar).position === "sticky" ? bar.getBoundingClientRect().height : 0) + 14;
    const top = slot.getBoundingClientRect().top;
    if(top < off || top > window.innerHeight * 0.6){
      window.scrollTo({top: Math.max(0, top + window.scrollY - off), behavior: "smooth"});
    }
  }

  function go(newStage, newPos){
    stage = newStage;
    if(typeof newPos === "number") pos = newPos;
    render();
    keepInView();
    const focusEl = slot && slot.querySelector(stage === "quiz" ? ".quiz-question" : ".quiz-title");
    if(focusEl){ focusEl.setAttribute("tabindex", "-1"); focusEl.focus({preventScroll:true}); }
  }

  function wire(){
    const q = sel => slot.querySelector(sel);
    const all = sel => slot.querySelectorAll(sel);
    if(q(".quiz-start")) q(".quiz-start").addEventListener("click", () => { answers = {}; shown = 6; loadShoes(); go("quiz", 0); });
    if(q(".quiz-back")) q(".quiz-back").addEventListener("click", () => go("quiz", Math.max(0, pos - 1)));
    all(".quiz-option").forEach(b => b.addEventListener("click", () => {
      answers[b.dataset.q] = b.dataset.v;
      // Borra respuestas de preguntas que ya no aplican
      QUESTIONS.forEach(x => { if(!x.show(answers)) delete answers[x.id]; });
      const qs = visibleQuestions();
      const idx = qs.findIndex(x => x.id === b.dataset.q);
      if(idx + 1 < qs.length) go("quiz", idx + 1);
      else { shown = 6; go("results"); }
    }));
    all("[data-open]").forEach(b => b.addEventListener("click", () => {
      if(window.GatoLab && window.GatoLab.openDetail) window.GatoLab.openDetail(b.dataset.open);
    }));
    if(q(".quiz-more")) q(".quiz-more").addEventListener("click", () => { shown += 6; render(); });
    if(q(".quiz-compare")) q(".quiz-compare").addEventListener("click", e => {
      const t = e.currentTarget;
      location.hash = "#compare/" + encodeURIComponent(t.dataset.a) + "/" + encodeURIComponent(t.dataset.b);
    });
    if(q(".quiz-edit")) q(".quiz-edit").addEventListener("click", () => go("quiz", 0));
    if(q(".quiz-restart")) q(".quiz-restart").addEventListener("click", () => { answers = {}; shown = 6; go("quiz", 0); });
  }

  function mount(container){
    slot = container || null;
    render();
  }

  window.GatoLabQuiz = { mount };
  const existing = document.getElementById("guideQuiz");
  if(existing) mount(existing);
})();
