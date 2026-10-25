/**
 * Lo que enseña la ventana de Correo: el correo de contacto y los perfiles. Sin formulario ni servidor: el visitante escribe
 * desde su propio programa de correo.
 */
import { LINKS } from '../content/links';
import { PERSONA } from '../content/persona';

/** El único correo que se publica, a pedido de su dueño (el mismo que figura en el CV). */
export const CONTACT_EMAIL = 'aguschaud@gmail.com';

export interface ContactLine {
  label: string;
  /** Lo que se lee: el correo, o la dirección del perfil sin https:// ni www. */
  text: string;
  href: string;
  /** Los perfiles se abren en una pestaña nueva; el correo, en el programa de correo. */
  external: boolean;
}

const readable = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export function contactLines(): ContactLine[] {
  const linkedin = LINKS.find((l) => l.id === 'linkedin')!.url;
  const github = `https://github.com/${PERSONA.github}`;
  return [
    { label: 'Mail', text: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false },
    { label: 'LinkedIn', text: readable(linkedin), href: linkedin, external: true },
    { label: 'GitHub', text: readable(github), href: github, external: true },
  ];
}
