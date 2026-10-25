# Resúmenes de libros en Favoritos

**Fecha:** 2026-10-25 11:15
**Tipo:** Feature
**Requisitos:** S-03 (ampliación)

## Qué se hizo
- **Los libros pueden llevar resumen** (`summary`, opcional): secciones con título y puntos, cada punto con una etiqueta en negrita, un texto o los dos, y como mucho un nivel de subpuntos. Se valida al compilar y se pinta siempre como texto plano.
- **Vista de detalle dentro de la ventana:** la portada de un libro con resumen es un botón («Leer resumen»); al pulsarlo, Favoritos pasa al resumen (portada, título, autor y secciones), con la barra «‹ Libros» para volver. Escape también vuelve, sin cerrar la ventana, y el foco regresa a la portada.
- **Los resúmenes de AI Engineering, Nos vemos en el barro, El valor de la atención y Esto es marketing**, escritos por Agustín y copiados tal cual; solo se corrigieron erratas de espacios, tildes y concordancia.
- **Hábitos atómicos (James Clear)** entra como quinto libro, sin resumen, con la portada de la edición en español.

## Qué se modificó
- `src/lib/favorites.ts`: tipos `SummarySection` y `SummaryPoint`, `BookItem.summary` y los topes `SUMMARY_LIMITS`.
- `src/content.config.ts`: el esquema del resumen.
- `src/content/favorites/books.json` y `public/favoritos/libros/habitos-atomicos.jpg`.
- `src/os/apps/favorites/BookSummary.svelte` (nuevo), `CoverGrid.svelte` y `Favorites.svelte`.
- Tests: `src/lib/favorites.test.ts` (dos nuevos) y `tests/e2e/s-03-favoritos.spec.ts` (uno nuevo).
- Docs: `docs/features/favoritos.md` y `docs/design-system.md`.

## Por qué
Agustín quería que los visitantes leyeran lo que sacó de sus libros favoritos. Los resúmenes miden entre 2.600 y 3.800 caracteres y tienen secciones y viñetas: no caben en una sinopsis corta como la de las películas (20–240), así que necesitan su propia vista.
