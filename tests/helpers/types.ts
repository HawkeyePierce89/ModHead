/**
 * Test result type from the test page
 */
export interface TestResult {
  success?: boolean;
  headers?: Record<string, string | string[] | undefined>;
  customHeaders: {
    'x-custom-header': string | null;
    'x-test-header': string | null;
    'x-modified-header': string | null;
    'x-auth': string | null;
    'x-combined': string | null;
    'x-undefined': string | null;
    'x-empty': string | null;
  };
  error?: string;
}

/**
 * Global window type declaration for test result
 */
declare global {
  interface Window {
    testResult: TestResult | null;
  }
}

/**
 * Variable configuration for refresh tests
 */
export interface VariableRefreshConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: { key: string; value: string }[];
  body?: string;
  transformResponse?: string;
}

/**
 * Variable with refresh configuration
 */
export interface VariableWithRefresh {
  name: string;
  value: string;
  refreshConfig: VariableRefreshConfig;
}

/**
 * Simple variable configuration
 */
export interface Variable {
  name: string;
  value: string;
}

/**
 * Target domain configuration for rules
 */
export interface TargetDomain {
  url: string;
  matchType: 'startsWith' | 'endsWith' | 'equals';
}

/**
 * Header modification configuration
 */
export interface HeaderModification {
  name: string;
  value: string;
}
