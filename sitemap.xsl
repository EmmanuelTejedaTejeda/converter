<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
                xmlns:html="http://www.w3.org/1999/xhtml"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
    <xsl:template match="/">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="es">
            <head>
                <title>Sitemap XML - My Local Picture</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet" />
                <style type="text/css">
                    body {
                        font-family: 'Inter', sans-serif;
                        background-color: #0f172a;
                        color: #cbd5e1;
                        margin: 0;
                        padding: 40px 20px;
                    }
                    .container {
                        max-width: 1100px;
                        margin: 0 auto;
                        background: #1e293b;
                        padding: 35px;
                        border-radius: 16px;
                        box-shadow: 0 10px 35px rgba(0,0,0,0.4);
                        border: 1px solid #334155;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        border-bottom: 1px solid #334155;
                        padding-bottom: 20px;
                        margin-bottom: 24px;
                        flex-wrap: wrap;
                        gap: 15px;
                    }
                    h1 {
                        font-family: 'Space Grotesk', sans-serif;
                        color: #ffffff;
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .badge-count {
                        background: #38bdf8;
                        color: #0f172a;
                        padding: 4px 10px;
                        border-radius: 9999px;
                        font-size: 14px;
                        font-weight: 700;
                    }
                    .info {
                        color: #94a3b8;
                        font-size: 14px;
                        line-height: 1.6;
                        margin-bottom: 25px;
                    }
                    .table-wrapper {
                        overflow-x: auto;
                        border-radius: 12px;
                        border: 1px solid #334155;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                        font-size: 14px;
                        background: #182235;
                    }
                    th {
                        font-family: 'Space Grotesk', sans-serif;
                        color: #ffffff;
                        background: #0f172a;
                        padding: 14px 18px;
                        font-weight: 600;
                        text-transform: uppercase;
                        font-size: 12px;
                        letter-spacing: 0.05em;
                        border-bottom: 2px solid #334155;
                    }
                    td {
                        padding: 14px 18px;
                        border-bottom: 1px solid #334155;
                        word-break: break-all;
                    }
                    tr:last-child td {
                        border-bottom: none;
                    }
                    tr:nth-child(even) td {
                        background: #1e293b;
                    }
                    tr:hover td {
                        background: #0f172a;
                    }
                    a {
                        color: #38bdf8;
                        text-decoration: none;
                        font-weight: 500;
                        transition: color 0.2s ease;
                    }
                    a:hover {
                        color: #7dd3fc;
                        text-decoration: underline;
                    }
                    .badge {
                        display: inline-block;
                        padding: 3px 8px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.02em;
                    }
                    .badge-freq {
                        background: rgba(3, 105, 161, 0.2);
                        color: #7dd3fc;
                        border: 1px solid rgba(3, 105, 161, 0.4);
                    }
                    .badge-prio {
                        background: rgba(21, 128, 61, 0.2);
                        color: #86efac;
                        border: 1px solid rgba(21, 128, 61, 0.4);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            My Local Picture Sitemap XML
                        </h1>
                        <span class="badge-count">
                            <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs
                        </span>
                    </div>
                    <div class="info">
                        Este es un archivo XML Sitemap optimizado para motores de búsqueda como Google, Bing o Yandex. 
                        Usa esta página para comprobar todas las secciones y páginas de My Local Picture indexadas para cada idioma (Español, Inglés, Chino y Japonés).
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 55%;">Dirección URL</th>
                                    <th style="width: 15%;">Última Modificación</th>
                                    <th style="width: 15%;">Frecuencia</th>
                                    <th style="width: 15%;">Prioridad</th>
                                </tr>
                            </thead>
                            <tbody>
                                <xsl:for-each select="sitemap:urlset/sitemap:url">
                                    <tr>
                                        <td>
                                            <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                                        </td>
                                        <td>
                                            <xsl:value-of select="sitemap:lastmod"/>
                                        </td>
                                        <td>
                                            <span class="badge badge-freq"><xsl:value-of select="sitemap:changefreq"/></span>
                                        </td>
                                        <td>
                                            <span class="badge badge-prio"><xsl:value-of select="sitemap:priority"/></span>
                                        </td>
                                    </tr>
                                </xsl:for-each>
                            </tbody>
                        </table>
                    </div>
                </div>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
