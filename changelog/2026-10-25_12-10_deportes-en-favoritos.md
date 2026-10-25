# Deportes en lugar de Videojuegos en Favoritos

**Fecha:** 2026-10-25 12:10
**Tipo:** Feature
**Requisitos:** S-03 (cambio de sección)

## Qué se hizo
- **La sección Videojuegos pasa a ser Deportes:** básquet, fútbol y pádel, cada uno con una foto y su nombre. Se acaba la tarjeta vacía «Videojuegos · Top 0».
- **Fotos con licencia libre de Wikimedia Commons**, guardadas en el repositorio y recortadas a 600 × 800: básquet de noahsilliman (CC0), fútbol de Peter Glaser (CC0) y pádel de Sniper Zeta (CC BY-SA 4.0). Al pie de la sección, una línea acredita cada foto con su autor, su licencia y un enlace a su ficha.
- **Terminal:** `open deportes` y `open sports` abren la sección; `open juegos`, `open videojuegos` y `open games` ya no abren nada.
- **La spec e2e de Favoritos vuelve a correr**, porque `loadFavorites()` ya encuentra los cuatro archivos.

## Qué se modificó
- `src/lib/favorites.ts`: la sección `sports` (`SportItem`, `PhotoCredit`, `COMMONS_ORIGIN`) en lugar de `games` y Shelvid.
- `src/content.config.ts`, `src/content/favorites/sports.json` (nuevo) y `public/favoritos/deportes/` (nuevo).
- `src/os/apps/favorites/CoverGrid.svelte` y `src/os/terminal/commands.ts`.
- Tests: `src/lib/favorites.test.ts`, `src/os/terminal/commands.test.ts`, `tests/e2e/helpers.ts`, `tests/e2e/s-03-favoritos.spec.ts`, `tests/csp/s-03-favoritos.spec.ts` y `tests/csp/m-11-csp.spec.ts`.
- `scripts/generar-portadas-ejemplo.mjs`: la carpeta de deportes.
- Docs: `docs/prd.md` (S-03), `docs/architecture.md`, `docs/design-system.md`, `docs/testing.md`, `docs/features/favoritos.md` y `README.md`.

## Por qué
Agustín no juega videojuegos; sus deportes favoritos son el básquet, el fútbol y el pádel. Eligió fotos libres de la web en lugar de ilustraciones o fotos propias.
