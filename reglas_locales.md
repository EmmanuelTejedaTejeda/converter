# Reglas Locales del Proyecto

## 1. Directiva de Comportamiento de la IA (CRÍTICO)

Para cualquier tarea de desarrollo, refactorización, depuración o modificación en este proyecto, se deben seguir obligatoriamente estos 3 pasos en orden secuencial:

1. **Consulta Previa Obligatoria**: Antes de comenzar a programar o realizar cambios, se debe leer y consultar obligatoriamente [Analisis_Completo.md](file:///d:/Descargas/Desarrollo%20de%20aplicaciones/converter/Analisis_Completo.md) y [Grafo.md](file:///d:/Descargas/Desarrollo%20de%20aplicaciones/converter/Grafo.md) para comprender la arquitectura técnica y el contexto de dependencias, evitando búsquedas a ciegas.
2. **Implementación Arquitectónica**: Cualquier cambio o nueva funcionalidad debe implementarse respetando estrictamente la arquitectura técnica client-side detallada en los documentos de análisis.
3. **Sincronización Destructiva y Limpieza**: Al finalizar cualquier cambio o edición en el código, se deben actualizar de inmediato [Analisis_Completo.md](file:///d:/Descargas/Desarrollo%20de%20aplicaciones/converter/Analisis_Completo.md) y [Grafo.md](file:///d:/Descargas/Desarrollo%20de%20aplicaciones/converter/Grafo.md). Está **estrictamente prohibido** agregar texto al final del documento acumulando datos obsoletos. Se debe localizar la sección desactualizada y eliminarla o reemplazarla por completo para mantener la documentación limpia, precisa y libre de duplicados o historiales muertos.

---

## 2. Protocolo de Validación por Evidencias (Logs Dinámicos)

- **Prohibido Asumir Éxito**: Está estrictamente prohibido dar una tarea por completada asumiendo que el código "parece correcto" o libre de errores de sintaxis. Se debe verificar y depurar de forma activa mediante logs y evidencias tangibles.
- **Sincronización Efímera de Logs**: Los registros e historiales de logs antiguos deben ser ignorados o vaciados antes de cada ejecución de prueba. Solo se permite inspeccionar y analizar los logs de la ejecución de prueba actual para evitar diagnósticos incorrectos sobre fallos pasados ya resueltos.
- **Evidencia Tangible**: El ciclo de vida de una tarea no se cerrará hasta presentar o analizar las evidencias y logs generados tras la ejecución en el entorno real del usuario.

---

## 3. Optimización de Tokens y Navegación Estricta

- **Prohibido Explorar a Ciegas**: Queda estrictamente prohibido ejecutar lecturas masivas de directorios o inspección de archivos al azar para localizar módulos o dependencias.
- **Uso Obligatorio del Mapa**: Para localizar cualquier componente, archivo, script de herramienta o ruta, el **único punto de partida permitido** es leer [Grafo.md](file:///d:/Descargas/Desarrollo%20de%20aplicaciones/converter/Grafo.md).
- **Precisión Quirúrgica**: Se debe extraer la ruta exacta desde el grafo y abrir de forma exclusiva y directa el archivo que se necesita modificar o leer. Si un archivo o dependencia no figura en el grafo, se debe actualizar el documento [Grafo.md](file:///d:/Descargas/Desarrollo%20de%20aplicaciones/converter/Grafo.md) inmediatamente después de localizarlo.
