# Gato Lab — Climbing Shoe Database

Proyecto listo para subir a un hosting propio. Es un sitio 100% estático
(HTML + CSS + JS, sin base de datos ni servidor), así que cualquier
hosting de páginas estáticas sirve.

**Alcance de esta primera versión:** Gato Lab es una base de datos para
descubrir, analizar y comparar pies de gato — no una tienda. No hay botón de
comprar, ni carrito, ni checkout, y no se plantea como ecommerce. El precio
de cada modelo se muestra solo como dato orientativo para comparar. Esto es
una decisión de esta v1, no una limitación permanente: más adelante se puede
añadir afiliación, enlaces a tiendas u otra monetización (ver sección 6).

## Estructura

```
index.html          página principal (catálogo, filtros, comparador, NEWS)
privacidad.html      plantilla de política de privacidad (edítala, ver abajo)
og-image.png         imagen de vista previa al compartir el enlace (Open Graph / Twitter)
apple-touch-icon.png icono de la marca para "Añadir a pantalla de inicio" (iOS/Android)
favicon-32.png       icono de repuesto para la pestaña del navegador (32×32)
favicon-16.png       icono de repuesto para la pestaña del navegador (16×16)
css/styles.css       estilos
js/data.js           carga content/shoes.json (ya no contiene el catálogo a mano)
js/sizes.js          guías de tallaje por marca (independiente del catálogo)
js/app.js            lógica de filtros, comparador y consentimiento de cookies
js/news.js           lee content/news.json y pinta la sección NEWS
content/shoes.json   catálogo de modelos — esto es lo que edita el panel admin
content/news.json    artículos de NEWS — esto es lo que edita el panel admin
admin/config.yml     configuración de los dos paneles (catálogo y NEWS, Decap CMS)
admin/index.html     panel de administración (en /admin/, catálogo + NEWS)
_redirects           redirección de Netlify para URLs /news/<slug>
uploads/             imágenes que subas desde el panel de NEWS
robots.txt           indica a los buscadores qué pueden rastrear
sitemap.xml          mapa del sitio para Google Search Console
ads.txt.example      plantilla del archivo ads.txt que exige Google AdSense
```

## 1. Elegir dominio y hosting

Para monetizar con Google AdSense necesitas un **dominio propio** (por ejemplo
`gatolab.com` o `.es`) — AdSense no admite páginas de demo ni subdominios
gratuitos de algunos proveedores. Opciones sencillas y baratas:

- Comprar el dominio en Namecheap, Google Domains/Squarespace, IONOS o similar.
- Hosting estático gratuito o muy barato: **Netlify**, **Vercel**, **Cloudflare
  Pages** o **GitHub Pages** (arrastras esta carpeta o conectas un repositorio
  de Git y listo). También sirve cualquier hosting compartido tipo cPanel:
  sube el contenido de esta carpeta a `public_html`.

Pasos típicos con Netlify (el más simple si no usas Git):
1. Crea una cuenta gratuita en netlify.com.
2. Arrastra esta carpeta completa a "Deploys" → "Add new site" → "Deploy manually".
3. Netlify te da una URL provisional; en "Domain settings" conecta tu dominio propio.

## 2. Antes de solicitar Google AdSense

Google revisa el sitio antes de aprobarlo. Necesitas, como mínimo:

- El sitio ya publicado en tu dominio propio (no en local, no en una demo).
- Contenido real y navegable (el catálogo ya lo tiene).
- Una **política de privacidad** accesible — edita `privacidad.html` y
  sustituye los datos entre corchetes ([tu nombre], [tu email], fecha).
- Un poco de tráfico y tiempo: cuentas nuevas suelen tardar entre unos días
  y unas semanas en revisarse.
- Recomendable: añadir una página "Sobre Gato Lab" o "Metodología" que
  explique cómo se recopilan y actualizan los datos, ya que Google valora el
  contenido original y la transparencia sobre las fuentes.

Solicítalo en **https://adsense.google.com** con tu dominio.

## 3. Activar los anuncios cuando te aprueben

**Dos formas de que aparezcan anuncios, y no son excluyentes:**

- **Auto ads:** pegas un único script en todas las páginas y es Google quien
  decide automáticamente dónde y cuántos anuncios mostrar, analizando el
  diseño de cada página. Es la opción más cómoda, pero **no puedes decidir
  la posición exacta** — Google elige por ti, y puede colocar (o no) un
  anuncio cada 3 fichas, cada 15, o donde su algoritmo prefiera ese día.
- **Unidades de anuncio manuales:** creas cada unidad en tu panel de AdSense
  (display, "in-feed", "in-article"...) y Google te da un bloque de código
  que tú colocas exactamente donde quieras. Es la única forma de controlar
  con precisión "un anuncio cada X fichas" — por eso es la que usa este
  proyecto para el catálogo.

Puedes activar las dos a la vez sin problema (Auto ads para el resto del
sitio + unidades manuales para el catálogo), o solo una de ellas.

**Huecos de anuncio ya preparados en el sitio** (los ves como cajas
punteadas grises con el texto "Espacio publicitario" mientras no haya
anuncios reales):

- `ad-leaderboard` — cabecera de HOME, un solo hueco fijo.
- `ad-footer` — pie de página, un solo hueco fijo, se repite en todas las
  vistas.
- `ad-infeed` (dos huecos fijos, uno debajo del catálogo de HOME y otro
  debajo del comparador).
- **`ad-infeed-catalog`** — huecos "in-feed" repartidos automáticamente
  dentro de la propia rejilla de fichas, aproximadamente uno cada 8 modelos.
  Estos no están escritos a mano en el HTML: los genera `renderCatalog()`
  en `js/app.js`, así que se recalculan solos según cuántas fichas queden
  visibles tras aplicar filtros (con menos de 8 resultados no aparece
  ninguno). "Aproximadamente" porque el catálogo tiene distinto número de
  columnas según el ancho de pantalla (2 en móvil, 3 o más en ordenador), y
  el código ajusta el hueco real al múltiplo de esa cifra más cercano al
  número de columnas actual (`catalogAdInterval()`), para que el anuncio
  siempre cierre una fila completa y no deje un hueco vacío antes de él —
  en la práctica, cada 8 en móvil y cada 9 en la mayoría de ordenadores. Si
  quieres cambiar la frecuencia orientativa, toca el número `8` de la
  constante `CATALOG_AD_TARGET_INTERVAL` al principio de esa función — no
  hay que tocar nada más.

**Pasos para activar los anuncios reales:**

1. Google te da un ID de cliente con forma `ca-pub-XXXXXXXXXXXXXXXX`.
2. En tu panel de AdSense, crea una unidad de anuncio de tipo **"In-feed"**
   (pensada exactamente para listas/rejillas como esta) y ajusta su estilo
   visual (tipografía, colores) para que se parezca al resto de la web.
   Google te da un bloque de código único para esa unidad.
3. En `js/app.js`, dentro de la función `loadAdsense()`, sustituye
   `ADSENSE_CLIENT_ID` por tu ID y descomenta esas líneas.
4. Sustituye el contenido de texto de cada hueco ("Espacio publicitario...")
   por el bloque `<ins class="adsbygoogle">...</ins>` que te dio Google —
   en `catalogAdSlotNode()` (`js/app.js`) para los huecos del catálogo, y
   directamente en `index.html` para los huecos fijos (`ad-leaderboard`,
   `ad-infeed`, `ad-footer`). **Importante:** para los huecos del catálogo
   usa siempre el código de la MISMA unidad in-feed en los 19 huecos — no
   hace falta crear una unidad distinta por cada posición, AdSense la
   reutiliza automáticamente en cada aparición.
5. Renombra `ads.txt.example` a `ads.txt`, sustituye `ADSENSE_CLIENT_ID` por
   tu ID y súbelo a la raíz del dominio (debe quedar en
   `https://tu-dominio.example/ads.txt`).

**Importante (RGPD/ePrivacy, aplica en España y la UE):** el sitio ya incluye
un aviso de cookies (`initCookieConsent` en `js/app.js`) que impide cargar el
script de AdSense hasta que la persona acepta. No lo quites: es un requisito
legal y también una condición del programa de AdSense para editores
europeos. Si quieres algo más robusto que el aviso incluido, puedes sustituirlo
por una plataforma de consentimiento (CMP) certificada por Google, como
CookieYes o Cookiebot (tienen planes gratuitos para sitios pequeños).

## 4. SEO básico ya incluido

- Metaetiquetas de título y descripción en `index.html`.
- `robots.txt` y `sitemap.xml` (sustituye `TU-DOMINIO.example` por tu dominio
  real en ambos archivos y en las etiquetas `canonical`/`og:url`/`og:image`/
  `twitter:image` de `index.html`).
- **Logo en la vista previa al compartir el enlace:** `og-image.png` (el logo
  de GATO LAB sobre fondo blanco, 1200×630) es lo que se ve en WhatsApp,
  Twitter/X, Facebook, Slack, etc. al pegar el enlace del sitio. Si cambias
  el logo, regenera esta imagen a mano o pídeme que la actualice.
- **Logo en la pestaña del navegador y al guardar la web:** además del
  favicon SVG ya incluido, `favicon-32.png` / `favicon-16.png` son su
  repuesto para navegadores que no soportan favicons en SVG, y
  `apple-touch-icon.png` es el icono (fondo morado, 180×180) que aparece al
  "Añadir a pantalla de inicio" en móvil.
- Una vez publicado, registra el dominio en **Google Search Console** y envía
  el `sitemap.xml` para que Google indexe la página cuanto antes.

## 5. Añadir o corregir marcas y modelos

Todo el catálogo vive en `content/shoes.json` (una lista de modelos, cada uno
con marca, modelo, características, fotos, etc. — el formato está documentado
con comentarios al principio de `js/data.js`, que es quien lo carga). Puedes
editar ese JSON a mano si quieres, pero la forma cómoda de hacerlo es desde
el **panel de administración del catálogo**, sin tocar ningún archivo — ver
sección 8.

## 6. Imágenes de producto y futura monetización por compra/afiliación

El prototipo usa un icono genérico de pie de gato (dibujado en SVG dentro de
`index.html`) en vez de fotos reales, para no usar imágenes de las marcas sin
permiso. Esta v1 tampoco incluye ningún enlace de compra: es intencionado,
para quedarse en "base de datos comparativa" y no en tienda. Si en el futuro
decides ir más allá de AdSense, el camino habitual es:
- **Programas de afiliados** de tiendas (Amazon, Trekkinn, Bergfreunde,
  etc.): te dan imágenes de producto y enlaces que generan comisión por
  venta, complementando los ingresos de AdSense.
- Contactar directamente con cada marca para pedir permiso de uso de sus
  fotos de producto.

Cuando llegue ese momento, lo natural es añadir un botón "Ver en tienda" (o
similar) junto al precio de cada ficha — hoy ese botón no existe a propósito.

## 7. NEWS: activar el panel de administración

La sección **NEWS** (noticias y análisis editorial) lee sus artículos de
`content/news.json` y los pinta con `js/news.js`. Puedes editar ese archivo
a mano si quieres, pero la idea es no tener que hacerlo: el proyecto incluye
un panel de administración real en `/admin/` (Decap CMS, antes llamado
"Netlify CMS") desde el que puedes **crear, editar y borrar artículos sin
tocar código**, con campos para título, subtítulo, imagen principal,
galería, marca, modelo relacionado, fecha, categoría, texto del artículo,
ficha técnica, características principales, pros, contras, tipo de escalada
recomendado, nivel recomendado, enlaces externos, veredicto editorial y
campos SEO (SEO title y meta description — el resto de datos SEO que pide
esta sección, como el slug, la imagen principal, su texto alternativo, la
categoría y el modelo relacionado, son los mismos campos que ya rellenas
más arriba en el propio artículo).

**El panel solo funciona una vez el sitio está desplegado en Netlify** (no
funciona abriendo `index.html` en local ni en otro hosting sin adaptar el
`backend` de `admin/config.yml`). Pasos de activación, una sola vez:

1. **Despliega el sitio en Netlify** conectado a un repositorio Git (GitHub,
   GitLab o Bitbucket) — necesitas Git para este paso, a diferencia del resto
   del sitio. Si ya lo desplegaste arrastrando la carpeta (paso 1 de este
   README), muévalo a un repositorio Git y reconéctalo desde Netlify para
   poder seguir estos pasos.
2. En el panel de Netlify de tu sitio: **Identity → Enable Identity**.
3. Dentro de Identity, en **Services → Git Gateway → Enable Git Gateway**.
   Esto es lo que permite que el panel guarde artículos directamente en tu
   repositorio sin que cada persona necesite una cuenta de Git.
4. En **Identity → Invite users**, invítate a ti mismo/a con tu email.
   Te llegará un correo con un enlace de invitación.
5. Abre `https://tu-dominio.example/admin/`, sigue el enlace del correo para
   crear tu contraseña, e inicia sesión.

A partir de aquí, cualquier cambio que hagas en `/admin/` (crear, editar o
borrar un artículo) se guarda como un commit en tu repositorio y Netlify
vuelve a publicar el sitio automáticamente — normalmente en menos de un
minuto. Puedes seguir escribiendo artículos desde el móvil o desde cualquier
ordenador, sin abrir un editor de código.

**Vincular una noticia a un modelo:** en el campo "Modelo relacionado (ID
interno)" escribe el `id` exacto del modelo tal como aparece en `js/data.js`
(por ejemplo `ls-skwama` o `sc-drago`). Si lo rellenas, el artículo mostrará
automáticamente una ficha de ese producto con un botón "Ver modelo →" que
lleva directo a su ficha dentro de GATO LAB, y esa ficha de producto mostrará
a su vez el artículo en un apartado "Más NEWS sobre este modelo" — así HOME,
COMPARE y NEWS quedan conectados entre sí, tal como se pidió.

**Sobre el SEO de NEWS:** cada artículo tiene su propia URL
(`/news/<slug>`, gracias al archivo `_redirects`) y su propio `<title>` y
meta description, que `js/news.js` actualiza en el navegador al abrir el
artículo. Esto ayuda a Google en la mayoría de los casos, pero como el sitio
es una SPA sin renderizado en servidor, algunos rastreadores que no ejecutan
JavaScript verán solo el HTML base. Si más adelante quieres el máximo
posible de SEO, el siguiente paso natural es añadir un pequeño paso de build
que "pre-renderice" cada artículo como su propio archivo HTML — no es
necesario para empezar, pero queda anotado aquí como mejora futura.

## 8. Panel admin del catálogo de zapatillas

El catálogo completo (todos los modelos que ves en HOME y en el comparador)
lee sus datos de `content/shoes.json` y los pinta `js/app.js`. Igual que con
NEWS, puedes editar ese archivo a mano, pero la idea es no tener que hacerlo:
el mismo panel de `/admin/` (Decap CMS) incluye ahora una segunda sección,
**CATÁLOGO**, con un editor para **añadir, editar y borrar modelos sin tocar
código** — cierre, perfil, asimetría, rigidez, goma, grosor, uso, nivel,
precio, peso, volumen de horma, forro, si es infantil, características
técnicas, resumen editorial, para quién es, fotos, ajuste manual del gráfico
de radar y traducciones.

**Activación:** es la misma infraestructura que ya activaste para NEWS en la
sección 7 (Netlify Identity + Git Gateway) — si ya la activaste, el panel de
CATÁLOGO funciona automáticamente en cuanto abras `/admin/`, sin ningún paso
adicional. Si todavía no la has activado, sigue los 5 pasos de la sección 7:
valen igual para las dos secciones del panel.

**Fotos: tu propia foto o un enlace oficial de marca.** El campo "Fotos" del
catálogo admite, para cada foto, dos opciones: subir tu propia imagen desde
tu ordenador/galería (se guarda en `/uploads`, igual que el campo "Imagen
principal" de NEWS) o pegar una URL que apunte directamente a la ficha de
producto de la página oficial del fabricante. Si pegas una URL, usa siempre
la web oficial de la marca — nunca copies fotos de otras webs que no sean
tuyas ni de la marca, para respetar sus derechos de imagen (ver sección 6).
Cada pulsación de «Añadir fotos» sube o enlaza una sola foto: si quieres
varias, pulsa «Añadir fotos» una vez por cada una (el selector no permite
elegir más de un archivo a la vez). Formatos que se reconocen al subir tu
propia foto: JPG, PNG, WEBP, GIF, BMP, TIFF y SVG — si una foto hecha con el
móvil no se reconoce, casi siempre es porque se guardó en HEIC (el formato
por defecto del iPhone); conviértela a JPG o PNG antes de subirla, o cambia
el iPhone a Ajustes → Cámara → Formatos → «Más compatible» para que las
guarde ya en JPEG. La primera foto de la lista es siempre la principal/de
portada; las siguientes se podrán elegir con miniaturas y ampliar a pantalla
completa en la ficha de cada modelo. Si no tienes ninguna foto, deja la
lista vacía — la web mostrará el icono esquemático de siempre, y siempre
puedes añadirla más adelante sin tener que volver a publicar nada más.

**Ajuste manual del gráfico de radar.** El gráfico de "Perfil visual" de
cada ficha se calcula siempre automáticamente a partir de otros campos
(perfil, asimetría, rigidez, grosor, volumen de horma) — es el
comportamiento por defecto y no hace falta tocar nada para que funcione. El
campo "Ajuste manual del gráfico de radar" está para el caso puntual en que,
mirando la zapatilla real, veas que ese cálculo automático no coincide:
rellena solo el eje (o los ejes) que quieras corregir con un número de 0 a
4, y deja el resto vacío — esos ejes seguirán siendo automáticos. El punto
corregido se marca en el gráfico con un borde discontinuo, para que quede
claro que es un ajuste manual y no un dato calculado.

Como con NEWS, cualquier cambio que guardes en la sección CATÁLOGO del panel
se sube como un commit a tu repositorio y Netlify vuelve a publicar el sitio
solo, normalmente en menos de un minuto.

## 9. Próximos pasos sugeridos

- Página "Cómo elegir tallaje" o "Glosario" (asimetría, downturn, etc.) —
  buen contenido para SEO y para que Google valore el sitio como útil.
- Guardar comparativas o favoritos por usuario (requeriría ya un backend
  sencillo o una base de datos; el sitio actual es 100% estático).
- Traducir a otros idiomas si quieres audiencia fuera de España.
- Prerenderizado de cada artículo de NEWS como HTML propio, para el máximo
  SEO posible (ver nota al final de la sección 7).
