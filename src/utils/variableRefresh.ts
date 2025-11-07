import type { Variable } from '../types';

/**
 * Substitutes variables in a string
 */
function substituteVariables(value: string, variables: Variable[]): string {
  let result = value;
  variables.forEach((variable) => {
    const placeholder = `\${${variable.name}}`;
    result = result.split(placeholder).join(variable.value);
  });
  return result;
}

/**
 * Substitutes variables in an object (recursively)
 */
function substituteVariablesInObject(
  obj: Record<string, unknown>,
  variables: Variable[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = substituteVariables(value, variables);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = substituteVariablesInObject(value as Record<string, unknown>, variables);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Extracts value from response object using dot notation path
 */
function extractByPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Transforms response using template string syntax
 * Examples:
 * - "access_token" -> response.access_token
 * - "data.token" -> response.data.token
 * - "{token_type} {access_token}" -> "Bearer xxx"
 * - "${token_type} ${access_token}" -> "Bearer xxx"
 * If transform is not provided, converts entire response to string
 */
function transformResponse(response: unknown, transform?: string): string {
  if (!transform) {
    // No transform specified - convert entire response to string
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'number') {
      return String(response);
    }
    if (typeof response === 'object' && response !== null) {
      return JSON.stringify(response);
    }
    throw new Error(`Cannot convert response of type ${typeof response} to string`);
  }

  // Check if it's a template string with placeholders like {field} or ${field}
  const hasPlaceholders = /\{[^}]+\}/.test(transform) || /\$\{[^}]+\}/.test(transform);

  if (hasPlaceholders) {
    // Process template string with placeholders
    let result = transform;

    // Replace ${field} and {field} patterns
    result = result.replace(/\$?\{([^}]+)\}/g, (_match, path) => {
      const value = extractByPath(response, path.trim());

      if (value === null || value === undefined) {
        return '';
      }

      return String(value);
    });

    return result;
  }

  // Otherwise treat as dot notation path
  const value = extractByPath(response, transform);

  if (value === null || value === undefined) {
    throw new Error(`Cannot find value at path "${transform}"`);
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`Value at path "${transform}" is not a string or number: ${typeof value}`);
  }

  return String(value);
}

/**
 * Refreshes a variable value by executing HTTP request
 */
export async function refreshVariable(
  variable: Variable,
  allVariables: Variable[]
): Promise<string> {
  if (!variable.refreshConfig) {
    throw new Error('Variable does not have refresh configuration');
  }

  const config = variable.refreshConfig;

  // Substitute variables in URL
  const url = substituteVariables(config.url, allVariables);

  // Substitute variables in headers
  const headers: Record<string, string> = {};
  if (config.headers) {
    for (const [key, value] of Object.entries(config.headers)) {
      headers[key] = substituteVariables(value, allVariables);
    }
  }

  // Prepare body
  let body: string | undefined;
  if (config.body) {
    if (typeof config.body === 'string') {
      body = substituteVariables(config.body, allVariables);
    } else {
      const substitutedBody = substituteVariablesInObject(config.body, allVariables);

      // Determine content type
      const contentType = headers['Content-Type'] || headers['content-type'] || 'application/json';

      if (contentType.includes('application/x-www-form-urlencoded')) {
        // Convert to URL-encoded format
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(substitutedBody)) {
          params.append(key, String(value));
        }
        body = params.toString();
      } else {
        // Default to JSON
        body = JSON.stringify(substitutedBody);
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
    }
  }

  // Execute request
  const response = await fetch(url, {
    method: config.method,
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Parse response
  const responseData = await response.json();

  // Transform response using expression or path
  const transformedValue = transformResponse(responseData, config.transformResponse);

  return transformedValue;
}
