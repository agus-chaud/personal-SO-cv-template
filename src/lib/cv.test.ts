import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { appLinkTarget, externalLinks, pdfHref, splitFrontmatter, withoutAppLinks } from './cv';
import { cvHash } from './cv-hash';

const root = process.cwd();
const markdown = readFileSync(join(root, 'src/content/sobre-mi.md'), 'utf8');

/** El único correo que se publica: el de contacto, a pedido de su dueño. */
const CONTACT_EMAIL = 'aguschaud@gmail.com';

describe('texto de Sobre mí', () => {
  const { data, body } = splitFrontmatter(markdown);

  test('tiene la línea de presentación y el gancho', () => {
    expect(data.tagline).toBe('Inconformista. Data Scientist, Data Engineer y AI Engineer.');
    expect(data.hook).toMatch(/^Docente de IA aplicada y tutor de tesis en ITBA\./);
  });

  test('tiene todas las secciones acordadas, en orden', () => {
    const headings = [...body.matchAll(/^## (.+?)\r?$/gm)].map((m) => m[1]);
    expect(headings).toEqual(['Sobre mí', 'Experiencia', 'Proyectos', 'Habilidades', 'Formación', 'Referencias', 'Datos']);
  });

  test('el único correo publicado es el de contacto', () => {
    const emails = [...markdown.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)].map((m) => m[0]);
    expect(new Set(emails)).toEqual(new Set([CONTACT_EMAIL]));
    for (const [, address] of markdown.matchAll(/mailto:([^)\s]+)/g)) expect(address).toBe(CONTACT_EMAIL);
  });

  test('no publica teléfonos', () => {
    expect(markdown).not.toMatch(/\+?\d[\d\s-]{7,}\d/);
  });

  test('no publica los nombres de terceros ni lo que se acordó dejar fuera', () => {
    for (const excluded of ['Lucía Ejemplo', 'Marcos Ejemplo']) {
      expect(markdown, excluded).not.toContain(excluded);
    }
  });

  test('no deja marcas de revisión pendientes', () => {
    expect(markdown).not.toMatch(/CONFIRMAR|\[¿\?\]|TODO/);
  });

  test('los únicos enlaces son https, a una app del escritorio o al correo de contacto', () => {
    for (const [, href] of body.matchAll(/\]\(([^)]+)\)/g)) {
      expect(/^https:\/\//.test(href) || appLinkTarget(href) !== null || href === `mailto:${CONTACT_EMAIL}`, href).toBe(true);
    }
  });
});

describe('PDF', () => {
  test('el PDF publicado se generó con el texto actual (si cambias sobre-mi.md, ejecuta scripts/generar-cv.mjs)', () => {
    const stored = readFileSync(join(root, 'src/content/sobre-mi.pdf.sha256'), 'utf8').trim();
    expect(stored).toBe(cvHash(markdown));
  });

  test('el PDF existe y es un PDF de verdad', () => {
    const file = join(root, 'public/cv.pdf');
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file).subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('sin PDF no hay botón de descarga', () => {
    expect(pdfHref(false)).toBeNull();
    expect(pdfHref(true)).toBe('/cv.pdf');
  });
});

describe('utilidades', () => {
  test('la huella no cambia con los saltos de línea de Windows', () => {
    expect(cvHash('a\r\nb')).toBe(cvHash('a\nb'));
    expect(cvHash('a')).not.toBe(cvHash('b'));
  });

  test('splitFrontmatter separa los datos del texto, y sin bloque devuelve todo como texto', () => {
    expect(splitFrontmatter('---\na: uno\nb: dos: tres\n---\n\nHola')).toEqual({ data: { a: 'uno', b: 'dos: tres' }, body: '\nHola' });
    expect(splitFrontmatter('Hola')).toEqual({ data: {}, body: 'Hola' });
  });

  test('los enlaces https se abren en pestaña nueva y los de apps no se tocan', () => {
    const html = '<a href="https://x.test/a">x</a> <a href="#abrir-correo">c</a>';
    expect(externalLinks(html)).toBe('<a href="https://x.test/a" target="_blank" rel="noopener noreferrer">x</a> <a href="#abrir-correo">c</a>');
  });

  test('en el PDF los enlaces a apps quedan como texto', () => {
    expect(withoutAppLinks('ve <a href="#abrir-proyectos"><strong>Proyectos</strong></a> ya')).toBe('ve <strong>Proyectos</strong> ya');
  });

  test('appLinkTarget solo acepta apps conocidas, nunca nombres heredados del objeto', () => {
    expect(appLinkTarget('#abrir-proyectos')).toBe('projects');
    expect(appLinkTarget('#abrir-correo')).toBe('mail');
    for (const bad of ['#abrir-otra', '#constructor', '#__proto__', 'https://x.test', '', null, undefined]) {
      expect(appLinkTarget(bad as string | null | undefined), String(bad)).toBeNull();
    }
  });
});
