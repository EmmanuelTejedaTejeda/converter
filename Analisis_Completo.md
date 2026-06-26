# Análisis Técnico Detallado - My Local Picture (mylocalpicture.com)

## 1. Descripción del Proyecto
My Local Picture (`mylocalpicture.com`) es una suite de herramientas web de procesamiento y conversión de imágenes. Su principal propuesta de valor es que todas las operaciones se realizan 100% de manera local en el navegador del usuario, garantizando la privacidad y seguridad, ya que no se suben archivos a servidores externos.

## 2. Pila Tecnológica (Tech Stack)
*   **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (Vanilla ES6+).
*   **APIs del Navegador Utilizadas:** File API, Canvas API, URL API (para `createObjectURL`), Web Workers (potencialmente para procesamiento pesado como PDF).
*   **Librerías de Terceros (en local):**
    *   `heic2any.min.js`: Conversión de formato HEIC/HEIF de Apple.
    *   `jspdf.umd.min.js`: Generación de documentos PDF a partir de imágenes.
    *   `pdf.min.mjs` y `pdf.worker.min.mjs` (PDF.js): Renderizado y extracción de imágenes desde archivos PDF.
    *   `jszip.min.js`: Compresión local de múltiples archivos procesados en lote para descarga en formato ZIP.
*   **Despliegue & Dominio:** Desplegado en Cloudflare Pages, respondiendo bajo el dominio principal propio **`mylocalpicture.com`** (evidenciado por `wrangler.toml` y `_headers`).

## 3. Arquitectura del Proyecto
El proyecto sigue una arquitectura de sitio estático con múltiples páginas (Multi-Page Application - MPA) y un enrutamiento basado en carpetas físicas.

*   **Raíz (`/`):** Contiene la página principal (`index.html`), rediseñada con un sistema dinámico de pestañas de filtrado interactivo por categorías (Conversión, Optimización, Edición, Documentos), tarjetas con identidad visual propia, y un buscador destacado en el Hero con soporte en tiempo real y alerta de "sin resultados".
*   **Subdirectorios de Herramientas (`/jpg-a-png/`, `/comprimir-imagenes/`, etc.):** Cada herramienta tiene su propia carpeta, con su propio `index.html` para mejorar el SEO y permitir el acceso directo a herramientas específicas.
*   **Directorio `/assets/`:** Contiene los recursos compartidos:
    *   Lógica JS compartida y específica: `app.js`, `theme.js`, scripts por herramienta.
    *   Hoja de estilos global: `styles.css` (actualizada con variables de color y estilos interactivos para el rediseño y buscador).
    *   Iconos, fuentes y librerías de terceros minificadas.
*   **Internacionalización (`/en/`, `/zh/`, `/ja/`):** Carpetas que replican la estructura para soportar otros idiomas. Tienen el buscador central en el Hero y la lógica de filtrado unificada y traducida correspondiente a su idioma.
*   **Archivos de Compatibilidad de Rastreo:** Se dispone de `favicon.ico` en la raíz (para peticiones automáticas de navegadores/crawlers) y archivos `apple-app-site-association` (en la raíz y en `.well-known/`) con contenido JSON vacío para evitar falsos errores 404 de integración móvil de iOS, configurados en `_headers` con su tipo MIME correspondiente.


## 4. Flujo de Trabajo Típico de una Herramienta
1.  **Entrada:** El usuario arrastra o selecciona un archivo (File API).
2.  **Validación:** Se valida el tamaño y formato del archivo.
3.  **Procesamiento (Canvas/Librería):**
    *   Si es imagen estándar: Se carga en un elemento `<canvas>`, se aplican transformaciones (redimensionar, recortar) y se exporta usando `canvas.toBlob()` o `canvas.toDataURL()` al formato deseado.
    *   Si es HEIC o PDF: Se procesa a través de la librería correspondiente (`heic2any` o `pdf.js`) para extraer o convertir antes de pasarlo por el flujo estándar.
4.  **Salida:** Se genera una URL de objeto (`URL.createObjectURL`) para que el usuario descargue el resultado localmente.

## 5. Puntos Fuertes y Consideraciones
*   **Rendimiento y Seguridad:** Al ejecutarse en el cliente, es rápido (dependiendo del hardware del usuario) e inherentemente seguro.
*   **SEO y Compartibilidad:** Estructura MPA con metadatos localizados nítidos y canonicals en todos los idiomas, esquemas JSON-LD integrados (`WebApplication` y `FAQPage` en todas las herramientas) para rich snippets de Google, y un botón de compartir flotante dinámico (Web Share API con fallback a portapapeles) integrado globalmente en `theme.js`.
*   **PWA e Instalación:** Cuenta con Service Worker (`sw.js`), manifiesto y un banner/promoción de instalación PWA personalizada flotante e interactiva (capturando `beforeinstallprompt`). El estado de descarte se guarda temporalmente en `sessionStorage` para no resultar invasivo sin bloquear permanentemente la promoción en futuras visitas.
*   **Mantenimiento y Control de Eventos:** El procesamiento por lotes intercepta las descargas secuenciales a través de un event listener en la fase de captura (`useCapture = true`) en `theme.js`. Esto evita tener que modificar los archivos JS específicos de cada herramienta, garantizando una arquitectura desacoplada y libre de descargas duplicadas.
*   **Mantenimiento:** El uso de Vanilla JS requiere cuidado en la gestión del DOM para evitar memory leaks y mantener el código ordenado.
