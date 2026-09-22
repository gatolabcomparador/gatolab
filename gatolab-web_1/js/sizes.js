/* ==========================================================================
   Gato Lab — comparador de tallas entre marcas
   --------------------------------------------------------------------------
   Cada marca se define como una lista de [talla EU, longitud de pie en cm],
   tomada de las tablas de conversión oficiales/publicadas por cada marca.
   Para comparar tallas entre marcas: se busca la longitud en cm de la talla
   de origen y se busca la talla EU más cercana a esa longitud en la tabla
   de la marca de destino.

   Fuentes (longitud de pie en cm por talla EU), verificadas en septiembre 2026:
   - La Sportiva: lasportiva.com/en/footwear-size-guide (tabla Mondopoint/EU)
   - Scarpa: climbingfacts.com — Scarpa Sizing Chart (Mondopoint/EU)
   - Tenaya: absolute-snow.com — Tenaya Rock Climbing Shoe Sizing Chart (EU/CM)
   - Five Ten (Adidas): bergfreunde.eu/five-ten-size-chart (Mondopoint/EU)
   - Evolv: nextadventure.net/pages/evolv-size-chart (tabla oficial Evolv, MM Asia/10=cm)
   - Butora: bergfreunde.eu/butora-size-chart (Mondopoint/EU)
   - Red Chili: bergfreunde.eu/red-chili-size-chart (Mondopoint/EU)
   - Boreal: bergfreunde.eu/boreal-size-chart y bergfreunde.es/boreal-guia-de-tallas
     (se han descartado 2 tallas, EU 39,5 y EU 40, porque la propia tabla del
     fabricante/distribuidor invierte la progresión en ese punto — ver aviso)
   - Mad Rock: madrock.ca/pages/sizing-chart (tabla oficial; se ha descartado
     la talla EU 36 por un salto anómalo respecto al resto de la progresión
     — ver aviso)
   - Ocún: ocun.com — ficha técnica oficial en PDF (Mondopoint mm/10=cm)
   - Black Diamond: blackdiamondequipment.com/pages/climbing-shoe-sizing-charts
     (tabla oficial)
   - Unparallel: unparallelsports.com — ficha técnica oficial en PDF (mm/10=cm)
   - Simond: alpiniste.fr/simond-guide-des-tailles (tabla específica de
     chaussons d'escalade Simond, no de calzado de senderismo)

   Marcas del catálogo revisadas pero NO añadidas por falta de una tabla
   EU→cm fiable y comparable: EB Climbing, Millet y Zebrados solo publican
   equivalencia "tu talla de calle = tu talla de escalada", sin tabla
   numérica verificable. So iLL sí publica una tabla EU/US/UK/cm
   (bergfreunde.eu/so-ill-size-chart), pero es una conversión genérica de
   calzado de calle (coincide con tablas US-UK-EU estándar y su propio
   aviso dice "para principiantes, pide una talla más que tu talla EU
   habitual"), no una tabla específica de horma de escalada como las demás
   — mezclarla habría dado resultados sistemáticamente erróneos (2+ tallas
   de diferencia), así que se ha descartado.

   AVISO sobre Boreal y Mad Rock: en ambos casos la tabla original (oficial
   o de distribuidor especializado) contiene un punto donde la longitud de
   pie no aumenta de forma consistente con la talla EU (probable errata del
   propio fabricante/distribuidor, confirmada en más de una fuente para
   Boreal). En vez of inventar un valor corregido, se ha optado por omitir
   esas tallas concretas y mantener el resto de la tabla, que sí es
   consistente.

   IMPORTANTE: esto es una equivalencia orientativa por longitud de pie, NO
   una garantía de que la talla "sienta" igual en las dos marcas — cada
   horma (last) tiene su propio volumen y agresividad, así que es habitual
   subir o bajar media talla al cambiar de marca aunque la longitud de pie
   coincida exactamente. Para añadir una marca nueva, añade su propia lista
   [EU, cm] siguiendo el mismo patrón, y solo si hay una fuente fiable.
   ========================================================================== */
(function(){
  const CHARTS = {
    "La Sportiva": [
      [32,20.5],[33,21.0],[34,21.5],[34.5,22.0],[35,22.3],[35.5,22.7],
      [36,23.0],[36.5,23.3],[37,23.7],[37.5,24.0],[38,24.3],[38.5,24.7],
      [39,25.0],[39.5,25.3],[40,25.7],[40.5,26.0],[41,26.3],[41.5,26.7],
      [42,27.0],[42.5,27.3],[43,27.7],[43.5,28.0],[44,28.3],[44.5,28.7],
      [45,29.0],[45.5,29.3],[46,29.7],[46.5,30.0],[47,30.3],[47.5,30.7]
    ],
    "Scarpa": [
      [35.5,21.5],[36,22.0],[36.5,22.5],[37,23.0],[37.5,23.5],[38.5,24.0],
      [39,24.5],[39.5,25.0],[40.5,25.5],[41,26.0],[41.5,26.5],[42,27.0],
      [42.5,27.5],[43,28.0],[44,28.5],[44.5,29.0],[45.5,29.5],[46,30.0],
      [46.5,30.5],[47,31.0],[47.5,31.5],[48,32.0],[49,32.5],[50,33.0]
    ],
    "Tenaya": [
      [33,20.2],[33.5,20.6],[34,21.0],[35,21.4],[35.5,21.8],[36,22.3],
      [36.5,22.7],[37.5,23.1],[38,23.5],[38.5,24.0],[39.5,24.4],[40,24.8],
      [40.5,25.2],[41,25.6],[42,26.1],[42.5,26.5],[43,26.9],[44,27.3],
      [44.5,27.8],[45,28.2],[46,28.6],[46.5,29.0],[47,29.5],[47.5,29.9],
      [48.5,30.7]
    ],
    "Five Ten": [
      [36,22.1],[36.667,22.5],[37.333,22.9],[38,23.3],[38.667,23.8],
      [39.333,24.2],[40,24.6],[40.667,25.0],[41.333,25.5],[42,25.9],
      [42.667,26.3],[43.333,26.7],[44,27.1],[44.667,27.6],[45.333,28.0],
      [46,28.4],[46.667,28.8],[47.333,29.3],[48,29.7]
    ],
    "Evolv": [
      [33,20.0],[34,20.5],[34.5,21.0],[35,21.5],[35.5,22.0],[36,22.5],
      [37,23.0],[37.5,23.5],[38,24.0],[39,24.5],[39.5,25.0],[40,25.5],
      [41,26.0],[41.5,26.5],[42,27.0],[42.5,27.5],[43,28.0],[44,28.5],
      [44.5,29.0],[45,29.5],[46,30.0],[46.5,30.5],[47,31.0],[48,31.5],
      [48.5,32.0],[49.5,32.5],[50,33.0]
    ],
    "Butora": [
      [34.5,21],[35,21.5],[36,22.5],[37,23],[38,24],[39,24.5],[40,25.5],
      [41,26],[42,27],[43,28],[44,28.5],[45,29.5],[46,30],[47,31],
      [49.5,32],[51,33]
    ],
    "Red Chili": [
      [34,20.9],[35,21.7],[36,22.6],[37,23.0],[38,23.9],[39,24.7],
      [40,25.1],[41,26.0],[42,26.4],[43,27.2],[44,27.6],[45,28.5],
      [46,29.3],[47,29.7],[48,30.6],[51,32.2],[52,33.0]
    ],
    "Boreal": [
      [34.25,21.5],[35,21.9],[35.5,22.3],[36.25,22.8],[37,23.2],[37.5,23.6],
      [38,24.1],[38.75,24.5],
      // EU 39,5 y 40 omitidas: la tabla fuente invierte la progresión ahí
      [40.75,25.8],[41.5,26.2],[42,26.6],[42.5,27.0],[43.25,27.4],[44,27.8],
      [44.5,28.3],[45.25,28.7],[45.5,28.7],[46,29.1],[46.5,29.6],[47,30.0],
      [47.75,30.4]
    ],
    "Mad Rock": [
      [34.5,18.8],[35,19.4],[35.5,19.9],
      // EU 36 omitida: la tabla oficial tiene un salto anómalo (21.5) ahí
      [37,22.0],[37.5,22.4],[38,23.0],[39,23.6],[39.5,24.1],[40,24.6],
      [41.5,25.4],[42.5,26.3],[44,27.1],[45,28.0],[46.5,28.9],[48.5,30.1],
      [50,31.0]
    ],
    "Ocún": [
      [33,21.0],[34,21.5],[35,22.0],[36,22.5],[37,23.0],[37.5,23.5],
      [38,24.0],[38.5,24.5],[39,25.0],[40,25.5],[41,26.0],[41.5,26.5],
      [42,27.0],[42.5,27.5],[43,28.0],[44,28.5],[45,29.0],[45.5,29.5],
      [46,30.0],[46.5,30.5],[47,31.0],[48,31.5],[49,32.0],[50,32.5]
    ],
    "Black Diamond": [
      [35,21.72],[36,22.38],[37,23.04],[38,23.70],[39,24.36],[40,25.02],
      [41,25.68],[42,26.34],[43,27.00],[44,27.66],[45,28.32],[46,28.98],
      [47,29.64]
    ],
    "Unparallel": [
      [35.5,22.0],[36,22.5],[37,23.0],[38,24.0],[39,24.5],[40,25.5],
      [41,26.0],[42,27.0],[43,28.0],[44.5,29.0],[45,29.5],[46,30.0],[46.5,30.5]
    ],
    "Simond": [
      [35,21.6],[36,22.3],[37,22.9],[38,23.6],[39,24.3],[40,24.9],
      [41,25.6],[42,26.3],[43,26.9],[44,27.6],[45,28.3],[46,28.9],
      [47,29.6],[48,30.3],[49,30.9]
    ]
  };

  function cmForSize(brand, eu){
    const table = CHARTS[brand];
    if(!table) return null;
    const row = table.find(r=>r[0]===eu);
    return row ? row[1] : null;
  }

  function closestSizeForCm(brand, cm){
    const table = CHARTS[brand];
    if(!table || !table.length) return null;
    let best = table[0], bestDiff = Math.abs(table[0][1]-cm);
    for(const row of table){
      const diff = Math.abs(row[1]-cm);
      if(diff < bestDiff){ best = row; bestDiff = diff; }
    }
    return best; // [eu, cm]
  }

  function convert(brand, eu){
    const cm = cmForSize(brand, eu);
    if(cm == null) return null;
    const out = {};
    Object.keys(CHARTS).forEach(b=>{
      if(b === brand){ out[b] = { eu: eu, cm: cm, exact:true }; return; }
      const match = closestSizeForCm(b, cm);
      out[b] = match ? { eu: match[0], cm: match[1], exact: Math.abs(match[1]-cm) < 0.05 } : null;
    });
    return { originCm: cm, results: out };
  }

  window.GatoLabSizes = {
    brands: Object.keys(CHARTS),
    sizesOf: (brand)=> (CHARTS[brand]||[]).map(r=>r[0]),
    convert: convert
  };
})();
