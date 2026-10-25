import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { animationsDone, enter, openMail } from './helpers';
import { PERSONA } from '../../src/content/persona';
import { CONTACT_EMAIL, contactLines } from '../../src/lib/contact-card';

test.describe('M-08 Correo (tarjeta de contacto)', () => {
  test.beforeEach(async ({ page }) => {
    await enter(page);
  });

  test('enseña el nombre, el correo, LinkedIn y GitHub', async ({ page }, testInfo) => {
    const mail = await openMail(page, testInfo.project.name);
    await expect(mail.getByTestId('mail-name')).toHaveText(PERSONA.name);
    for (const line of contactLines()) {
      const row = mail.getByTestId(`mail-contact-${line.label.toLowerCase()}`);
      await expect(row).toContainText(line.label);
      await expect(row.getByRole('link')).toHaveAttribute('href', line.href);
    }
  });

  test('el correo abre el programa de correo y los perfiles, una pestaña nueva', async ({ page }, testInfo) => {
    const mail = await openMail(page, testInfo.project.name);
    const email = mail.getByTestId('mail-contact-mail').getByRole('link');
    await expect(email).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
    await expect(email).not.toHaveAttribute('target', '_blank');
    for (const id of ['linkedin', 'github']) {
      const link = mail.getByTestId(`mail-contact-${id}`).getByRole('link');
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('ya no hay formulario: ni campos ni botón de enviar, y no se pide nada a /api/contact', async ({ page }, testInfo) => {
    const requests: string[] = [];
    page.on('request', (r) => r.url().includes('/api/contact') && requests.push(r.url()));
    const mail = await openMail(page, testInfo.project.name);
    await expect(mail.locator('input, textarea, button[type="submit"], form')).toHaveCount(0);
    expect(requests).toHaveLength(0);
  });

  test('no tiene errores de accesibilidad', async ({ page }, testInfo) => {
    await openMail(page, testInfo.project.name);
    await animationsDone(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
