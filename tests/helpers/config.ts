import { Page } from 'puppeteer';
import { TargetDomain, HeaderModification, Variable, VariableWithRefresh } from './types.js';

/**
 * Configure a modification rule in the extension
 */
export async function configureExtensionRule(
  page: Page,
  ruleName: string,
  targetDomains: TargetDomain[],
  headers: HeaderModification[]
): Promise<void> {
  console.log(`Configuring rule: ${ruleName}`);

  // Wait for page to load
  await page.waitForSelector('[data-testid="create-rule-button"]', { timeout: 5000 });

  // Click "Create Rule" button
  await page.click('[data-testid="create-rule-button"]');

  // Wait for modal to appear (check for the save button in the modal)
  await page.waitForSelector('[data-testid="save-rule-button"]', { timeout: 5000 });

  // Fill in rule name (first input with placeholder "e.g. API Headers")
  await page.waitForSelector('input[placeholder*="API Headers"]', { timeout: 3000 });
  await page.type('input[placeholder*="API Headers"]', ruleName);

  // Add target domains
  for (let i = 0; i < targetDomains.length; i++) {
    const domain = targetDomains[i];

    // Click "Add Target Domain" button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addDomainBtn = buttons.find(btn => btn.textContent?.includes('Add Target Domain'));
      addDomainBtn?.click();
    });

    // Wait a bit for the new input fields to appear
    await new Promise(resolve => setTimeout(resolve, 200));

    // Fill domain URL and select match type (find all domain inputs)
    const domainInputs = await page.$$('[data-testid="target-domain-input"]');
    const domainSelects = await page.$$('select');

    if (domainInputs[i] && domainSelects[i]) {
      await domainInputs[i].type(domain.url);
      await domainSelects[i].select(domain.matchType);
    }
  }

  // Add headers
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];

    // Click "Add Header" button
    await page.click('[data-testid="add-header-button"]');

    // Wait a bit for the new input fields to appear
    await new Promise(resolve => setTimeout(resolve, 200));

    // Fill header name and value (find all header inputs)
    const headerNameInputs = await page.$$('[data-testid="header-name-input"]');
    const headerValueInputs = await page.$$('[data-testid="header-value-input"]');

    if (headerNameInputs[i] && headerValueInputs[i]) {
      await headerNameInputs[i].type(header.name);
      await headerValueInputs[i].type(header.value);
    }
  }

  // Click Create/Save button
  await page.click('[data-testid="save-rule-button"]');

  // Wait for modal to close (check that save button is gone)
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="save-rule-button"]'),
    { timeout: 5000 }
  );

  console.log(`Rule "${ruleName}" configured successfully`);
}

/**
 * Configure simple variables (name-value pairs)
 */
export async function configureVariables(
  page: Page,
  variables: Variable[]
): Promise<void> {
  console.log(`Configuring ${variables.length} variable(s)`);

  for (const variable of variables) {
    // Click "Add Variable" button
    await page.click('[data-testid="add-variable-button"]');

    // Wait for input fields to appear
    await new Promise(resolve => setTimeout(resolve, 200));

    // Find the input fields by placeholder text
    const nameInput = await page.$('input[placeholder*="Variable name"]');
    const valueInput = await page.$('input[placeholder*="Variable value"]');

    if (!nameInput || !valueInput) {
      throw new Error('Variable input fields not found');
    }

    // Fill in variable name and value
    await nameInput.type(variable.name);
    await valueInput.type(variable.value);

    // Click Save button
    await page.click('[data-testid="save-variable-button"]');

    // Wait for edit form to close
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="save-variable-button"]'),
      { timeout: 3000 }
    );

    console.log(`  Variable "${variable.name}" = "${variable.value}" configured`);
  }

  console.log('Variables configured successfully');
}

/**
 * Configure a variable with auto-refresh configuration
 */
export async function configureVariableWithRefresh(
  page: Page,
  variable: VariableWithRefresh
): Promise<void> {
  console.log(`Configuring variable with refresh: ${variable.name}`);

  // Click "Add Variable" button
  await page.click('[data-testid="add-variable-button"]');

  // Wait for input fields to appear
  await new Promise(resolve => setTimeout(resolve, 200));

  // Fill in variable name and value
  const nameInput = await page.$('input[placeholder*="Variable name"]');
  const valueInput = await page.$('input[placeholder*="Variable value"]');

  if (!nameInput || !valueInput) {
    throw new Error('Variable input fields not found');
  }

  await nameInput.type(variable.name);
  await valueInput.type(variable.value);

  // Fill refresh URL
  const refreshUrlInput = await page.$('[data-testid="refresh-url-input"]');
  if (!refreshUrlInput) {
    throw new Error('Refresh URL input not found');
  }
  await refreshUrlInput.type(variable.refreshConfig.url);

  // Wait for conditional fields to appear
  await new Promise(resolve => setTimeout(resolve, 200));

  // Set HTTP method if specified
  if (variable.refreshConfig.method && variable.refreshConfig.method !== 'POST') {
    const methodSelect = await page.$('[data-testid="refresh-method-select"]');
    if (methodSelect) {
      await methodSelect.select(variable.refreshConfig.method);
    }
  }

  // Add headers if specified
  if (variable.refreshConfig.headers && variable.refreshConfig.headers.length > 0) {
    for (const header of variable.refreshConfig.headers) {
      // Click "Add Header" button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addHeaderBtn = buttons.find(btn => btn.textContent?.includes('+ Add Header'));
        addHeaderBtn?.click();
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Find the last pair of header inputs
      const headerKeyInputs = await page.$$('input[placeholder*="Header name"]');
      const headerValueInputs = await page.$$('input[placeholder*="Header value"]');

      const lastKeyInput = headerKeyInputs[headerKeyInputs.length - 1];
      const lastValueInput = headerValueInputs[headerValueInputs.length - 1];

      if (lastKeyInput && lastValueInput) {
        await lastKeyInput.type(header.key);
        await lastValueInput.type(header.value);
      }
    }
  }

  // Fill request body if specified
  if (variable.refreshConfig.body) {
    const bodyTextarea = await page.$('[data-testid="refresh-body-textarea"]');
    if (bodyTextarea) {
      await bodyTextarea.type(variable.refreshConfig.body);
    }
  }

  // Fill transform response if specified
  if (variable.refreshConfig.transformResponse) {
    const transformInput = await page.$('[data-testid="transform-response-input"]');
    if (transformInput) {
      await transformInput.type(variable.refreshConfig.transformResponse);
    }
  }

  // Click Save button
  await page.click('[data-testid="save-variable-button"]');

  // Wait for edit form to close
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="save-variable-button"]'),
    { timeout: 3000 }
  );

  console.log(`  Variable "${variable.name}" with refresh config configured`);
}
