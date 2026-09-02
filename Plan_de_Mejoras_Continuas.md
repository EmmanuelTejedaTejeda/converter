# Documento de Plan de Mejoras Continuas: My Local Picture

Este documento consolida la hoja de ruta técnica y estratégica para la optimización de SEO On-Page, seguridad Edge en Cloudflare Pages, rendimiento de carga y automatización CI/CD.

---

## 🎯 1. Optimización SERP de Títulos y Meta Descripciones (SEO On-Page)

* **Objetivo**: Garantizar que ningún `<title>` supere los 600px (~55-60 caracteres) y ninguna `<meta name="description">` supere los 920px (~150-155 caracteres) para evitar que Google trunque los fragmentos con puntos suspensivos (`...`).
* **Estándar de Formato**:
  * Título: `[Acción / Herramienta] | My Local Picture` (ej. `Convertir PNG a JPG Online Gratis | My Local Picture`).
  * Descripción: Beneficio directo + Garantía de privacidad local (100% Client-Side) + Llamado a la acción (140-155 caracteres).

---

## 📝 2. Enriquecimiento de Contenido en Herramientas (*Thin Content Prevention*)

* **Objetivo**: Extender el recuento de palabras en páginas de conversión clave (< 200 palabras) agregando guías explicativas de casos de uso y FAQs estructuradas con `JSON-LD`.
* **Beneficio**: Posicionamiento orgánico de palabras clave *Long-Tail* y mejor indexación contextual por Googlebot.

---

## 🔒 3. Fortalecimiento de Cabeceras de Seguridad Edge (`_headers`)

* **Objetivo**: Configurar cabeceras de seguridad estrictas en Cloudflare Pages.
* **Cabeceras a incluir/actualizar**:
  * `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  * `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' data: blob: https:; frame-ancestors 'none'; object-src 'none'; base-uri 'self';`
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `X-Content-Type-Options: nosniff`
  * `X-Frame-Options: DENY`
  * `X-XSS-Protection: 1; mode=block`

---

## 🚀 4. Auditorías Automatizadas Continuas (Lighthouse CI)

* **Objetivo**: Integrar [`lighthouserc.json`](file:///d:/DESAROLLO/MY_LOCALE_IMAGE/lighthouserc.json) y [`.github/workflows/lighthouse-ci.yml`](file:///d:/DESAROLLO/MY_LOCALE_IMAGE/.github/workflows/lighthouse-ci.yml) en el flujo de trabajo Git.
