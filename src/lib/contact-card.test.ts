import { describe, expect, test } from 'vitest';
import { LINKS } from '../content/links';
import { PERSONA } from '../content/persona';
import { CONTACT_EMAIL, contactLines } from './contact-card';

describe('ventana de Correo: el contacto', () => {
  test('el correo de contacto es el de Agustín', () => {
    expect(CONTACT_EMAIL).toBe('aguschaud@gmail.com');
  });

  test('enseña el correo, LinkedIn y GitHub, en ese orden', () => {
    expect(contactLines().map((l) => l.label)).toEqual(['Mail', 'LinkedIn', 'GitHub']);
  });

  test('el correo se abre con mailto y los perfiles enlazan con los de los accesos directos', () => {
    const [mail, linkedin, github] = contactLines();
    expect(mail).toMatchObject({ text: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false });
    expect(linkedin).toMatchObject({ href: LINKS.find((l) => l.id === 'linkedin')!.url, external: true });
    expect(github).toMatchObject({ href: `https://github.com/${PERSONA.github}`, external: true });
  });

  test('los perfiles se leen sin el https:// ni el www', () => {
    for (const l of contactLines().slice(1)) expect(l.text, l.label).not.toMatch(/^https?:|^www\./);
  });
});
