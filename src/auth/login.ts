import { Page } from 'playwright';
import { readFileSync } from 'fs';
import { AuthConfig } from '../types.js';

export async function executeLogin(page: Page, config: AuthConfig): Promise<void> {
  if (config.strategy === 'none') return;

  if (config.strategy === 'cookie' && config.cookiePath) {
    const cookies = JSON.parse(readFileSync(config.cookiePath, 'utf-8'));
    await page.context().addCookies(cookies);
    return;
  }

  if (config.strategy === 'credentials' && config.loginUrl && config.credentials) {
    await page.goto(config.loginUrl, { waitUntil: 'networkidle' });

    const { username, password, usernameField, passwordField } = config.credentials;

    if (username) {
      const emailInput = usernameField
        ? page.locator(usernameField)
        : page.getByLabel(/email|username|user/i).first();
      await emailInput.fill(username);
    }

    if (password) {
      const passInput = passwordField
        ? page.locator(passwordField)
        : page.getByLabel(/password/i).first();
      await passInput.fill(password);
    }

    // Click submit button
    const submitButton = page
      .getByRole('button', { name: /sign in|log in|submit|login/i })
      .first();
    await submitButton.click();

    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
  }
}
