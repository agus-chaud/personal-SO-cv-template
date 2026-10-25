# Correo: tarjeta de contacto en lugar del formulario

**Fecha:** 2026-10-25 13:40
**Tipo:** Feature
**Requisitos:** M-08 (redefinido)

## Qué se hizo
- La ventana de Correo deja de ser un formulario y pasa a ser una tarjeta con el nombre, el correo (`mailto:aguschaud@gmail.com`), LinkedIn y GitHub. Los perfiles se abren en una pestaña nueva.
- Se borra el envío por el servidor: el endpoint `/api/contact`, su validación y su servicio, con sus tests. El formulario no podía funcionar: el remitente de `wrangler.jsonc` seguía siendo el de la plantilla.
- «Cómo está hecho»: la sección pasa a llamarse «El Correo y el Libro de visitas» y explica que el Correo ya no pasa por el servidor.
- Dos e2e que usaban los campos del Correo para probar cosas generales (un borrador que sobrevive al minimizar; Cortar y Deshacer) usan ahora el formulario del Libro de visitas.

## Qué se modificó
- Nuevo: `src/lib/contact-card.ts` y `src/lib/contact-card.test.ts`.
- `src/os/apps/mail/Mail.svelte` reescrito.
- Borrados: `src/pages/api/contact.ts`, `src/lib/contact.ts`, `src/lib/contact.test.ts`, `src/lib/contact-service.ts`, `src/lib/contact-service.test.ts` y `tests/e2e/m-08-correo-api.spec.ts`.
- Tests: `tests/e2e/m-08-correo.spec.ts`, `tests/e2e/helpers.ts`, `tests/e2e/s-04-terminal.spec.ts`, `tests/e2e/s-05-menus.spec.ts`, `tests/csp/m-11-csp.spec.ts`, `src/lib/howto.test.ts` y los dos `s-10-como-esta-hecho.spec.ts`.
- `src/content/como-esta-hecho.md`.
- Docs: `docs/prd.md` (M-08), `docs/architecture.md`, `docs/design-system.md` y `docs/features/correo.md`.

## Por qué
El formulario no enviaba en producción y hacerlo funcionar pedía un dominio propio en Cloudflare Email Service. Agustín prefirió mostrar su contacto directamente.
