# Sin «inconformista» en el CV ni en la terminal

**Fecha:** 2026-10-25 12:45
**Tipo:** Contenido
**Requisitos:** ninguno

## Qué se hizo
- El CV ya no se define como «inconformista»: el tagline queda «Data Scientist, Data Engineer y AI Engineer.» y el párrafo de «Sobre mí» empieza en «Disfruto entender qué está pasando…». No se reemplazó por nada.
- La presentación del comando `about` de la Terminal tampoco lo dice: empieza en «Entiendo qué está pasando…».
- PDF del CV regenerado con `node scripts/generar-cv.mjs`.
- Dos tests nuevos impiden que vuelva: uno sobre `sobre-mi.md` y otro sobre la salida de `about`.

## Qué se modificó
- `src/content/sobre-mi.md`, `src/content/persona.ts`, `public/cv.pdf` y `src/content/sobre-mi.pdf.sha256`.
- `src/lib/cv.test.ts` y `src/os/terminal/commands.test.ts`.

## Por qué
Pedido de Agustín.
