/* ==========================================================================
   Gato Lab — base de datos de pies de gato
   --------------------------------------------------------------------------
   Los modelos YA NO viven en este archivo: se leen en tiempo real desde
   content/shoes.json, que es exactamente el archivo que edita el panel de
   administración (/admin/, Decap CMS — ver README, sección "Panel admin
   del catálogo"). Para añadir, editar o borrar un modelo no hace falta
   tocar este archivo ni ningún otro .js — basta con usar el panel.

   Si prefieres seguir editando a mano (o el panel todavía no está activado
   en tu despliegue), edita directamente content/shoes.json con el mismo
   formato: es una lista de objetos, uno por modelo, con estos campos:

   id          -> identificador único, sin espacios (se usa en la URL interna)
   marca       -> nombre de la marca
   modelo      -> nombre del modelo
   cierre      -> "Velcro" | "Cordones" | "Slipper elástico" | combinaciones
   forma       -> "Plana" | "Moderada" | "Agresiva" | "Muy agresiva" | ...
   asimetria   -> "Baja" | "Media" | "Alta"
   rigidez     -> "Blanda" | "Media" | "Rígida"
   goma        -> compuesto de la suela (texto libre)
   grosor      -> grosor de la suela en mm (número o null si no se conoce)
   uso         -> categoría principal: "Rocódromo" | "Todoterreno" | "Deportiva"
                  | "Bloque" | "Fisura/Trad" | "Competición" | "Velocidad"
   nivel       -> "Iniciación" | "Intermedio" | "Avanzado"
   precio      -> precio de referencia en euros (número, aproximado)
   peso_g      -> peso aproximado en gramos de un pie (número o null si no hay
                  dato fiable). Fuente: fichas técnicas públicas y bases de
                  datos como weighmyrack.com — ver aviso en el pie de página.
   peso_talla  -> talla de referencia sobre la que se midió peso_g (texto o
                  null). Ayuda a interpretar el dato: el peso varía con la talla.
   volumen     -> volumen de horma en texto libre ("Estándar", "Bajo (LV)",
                  "Alto (horma ancha)"...).
   forro       -> "Forrado" | "Sin forro" | "Parcialmente forrado" | null si no
                  se ha podido verificar
   infantil    -> true si es un modelo específico para niños/as; se omite
                  (o se deja false) en el resto de modelos
   caracteristicas -> lista de 2 a 4 frases cortas con tecnologías o rasgos
                  técnicos reales y distintivos del modelo (se muestran como
                  lista en la ficha de detalle y en el comparador 1 vs 1)
   resumen     -> descripción editorial (2-3 frases) para la ficha, la tarjeta
                  de búsqueda y el comparador
   para_quien  -> 1 frase que recomienda el perfil de escalador/a ideal para
                  este modelo (se muestra como aviso destacado en la ficha)

   resumen_i18n         -> { ca, en, fr } traducción del campo "resumen" a
                            catalán/inglés/francés (opcional; si falta, la
                            interfaz usa el "resumen" en castellano)
   caracteristicas_i18n -> { ca, en, fr } traducción del array "caracteristicas"
                            a catalán/inglés/francés (mismas longitudes que el
                            array original; opcional, con el mismo fallback)
   para_quien_i18n      -> { ca, en, fr } traducción del campo "para_quien"
                            (opcional, con el mismo fallback)

   Estos tres campos *_i18n son SOLO para el texto editorial. Nunca traducen
   nombres de modelo/marca, nombres de goma/suela, sistemas de cierre (cierre)
   ni tecnologías o patentes propias de cada marca: esos términos se
   mantienen idénticos en los 4 idiomas por diseño, tanto en los campos base
   como dentro del propio texto traducido.

   fotos -> array de URLs de imagen, enlazadas directamente a la CDN de la
            propia web oficial de la marca (no se descargan ni se alojan
            aquí — no subas fotos propias ni de otras webs, solo enlaces a
            la página oficial del fabricante, para respetar sus derechos de
            imagen). La primera URL es siempre la foto principal/de portada
            y se muestra con un encuadre y fondo uniformes en toda la web,
            para que el catálogo se vea homogéneo aunque cada marca
            fotografíe sus productos de forma distinta. Las siguientes URLs
            (si existen) son fotos adicionales del mismo modelo (otro ángulo,
            detalle de suela, etc.): en la ficha de detalle se pueden elegir
            con miniaturas y ampliar a pantalla completa. Un array vacío
            significa que no hay foto todavía (normalmente porque no se
            encontró una oficial fiable, o porque está descatalogado); en
            ese caso la interfaz muestra el icono esquemático de siempre.
            Al ser enlaces externos, la marca puede cambiarlos o retirarlos
            en cualquier momento sin que dependa de nosotros.

   radarOverride -> opcional. Objeto con hasta 5 números de 0 a 4
            (agresividad, asimetria, rigidez, sensibilidad, ajuste) para
            corregir A MANO la posición de esos ejes en el gráfico de
            "Perfil visual", cuando el cálculo automático (a partir de
            forma/asimetria/rigidez/grosor/volumen) no coincide con lo que
            ves en la zapatilla real. Por defecto este campo no existe y el
            gráfico usa siempre el valor calculado; solo hay que rellenar
            los ejes que quieras corregir, el resto sigue siendo automático.
            El punto corregido se marca con un borde discontinuo en el
            gráfico para que quede claro que es un ajuste manual.

   Todos los campos han sido verificados contra fichas oficiales de cada marca
   y tiendas/reviews especializadas (septiembre 2026). Cuando un dato no pudo
   confirmarse con una fuente fiable se ha dejado como null en vez de
   inventarlo — ver el aviso legal en el pie de página del sitio.
   ========================================================================== */

window.SHOES = [];

/* Promesa que se resuelve en cuanto window.SHOES tiene los datos reales.
   js/app.js y js/news.js esperan a esta promesa antes de pintar catálogo,
   filtros, fichas o el cruce con NEWS — así el catálogo puede vivir en un
   archivo editable por el panel de administración (content/shoes.json) en
   vez de venir escrito a mano en este .js. */
window.__gatoLabShoesReady = fetch("content/shoes.json", { cache: "no-store" })
  .then(r => { if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
  .then(data => {
    window.SHOES = Array.isArray(data) ? data : (Array.isArray(data.zapatillas) ? data.zapatillas : []);
    return window.SHOES;
  })
  .catch(err => {
    console.error("GATO LAB: no se pudo cargar content/shoes.json —", err);
    window.SHOES = [];
    return window.SHOES;
  });

/* Textos editoriales de la web (inicio, comparador, sobre nosotros, pie de
   página) YA NO viven escritos a mano en el HTML/JS: se leen en tiempo real
   desde content/site.json, que es el archivo que edita el panel de
   administración (/admin/, colección "TEXTOS DEL SITIO"). Para cambiar
   cualquiera de esos textos no hace falta tocar código, solo usar el panel.
   Si el archivo no carga por lo que sea, la web sigue funcionando con el
   texto que ya está escrito directamente en index.html como último recurso. */
window.SITE_TEXT = null;
window.__gatoLabSiteReady = fetch("content/site.json", { cache: "no-store" })
  .then(r => { if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
  .then(data => {
    window.SITE_TEXT = data && typeof data === "object" ? data : {};
    return window.SITE_TEXT;
  })
  .catch(err => {
    console.error("GATO LAB: no se pudo cargar content/site.json —", err);
    window.SITE_TEXT = {};
    return window.SITE_TEXT;
  });

/* Tallas disponibles por marca (orientativo, de guías de tallaje de cada
   marca — no es un dato por modelo, puede variar según la línea/versión). */
window.TALLAS = {
  "La Sportiva": "EU 33–50.5 (H) · EU 33–47 (M)",
  "Scarpa": "EU 36–50 (H) · EU 35–45 (M)",
  "Five Ten": "EU 36–50 (unisex)",
  "Tenaya": "EU 33–48.5 (unisex)",
  "Evolv": "EU 33–49.5 (H) · EU 33–42.5 (M)",
  "Butora": "EU 34.5–51 (unisex)",
  "Red Chili": "EU 35.5–52 (unisex)",
  "Boreal": "EU 34.25–47.75 (H) · EU 34.25–42.5 (M)",
  "Black Diamond": "US 5–13 (unisex)",
  "Mad Rock": "EU 34–46 (unisex)",
  "So iLL": "US 5–13 (unisex)",
  "Ocun": "EU 35–48 (unisex)",
  "Simond": "EU 34–48 (unisex)",
  "Millet": "EU 35–46 (unisex)"
};
