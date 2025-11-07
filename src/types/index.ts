export type MatchType = 'startsWith' | 'endsWith' | 'equals';

export interface HeaderModification {
  id: string;
  name: string;
  value: string;
}

export interface TargetDomain {
  id: string;
  url: string;
  matchType: MatchType;
}

export interface ModificationRule {
  id: string;
  enabled: boolean;
  name: string;
  // Site (tab) where the rules should be applied
  tabUrl?: string;
  tabUrlMatchType: MatchType;
  // Domains for which headers should be modified
  targetDomains: TargetDomain[];
  // Headers to modify
  headers: HeaderModification[];
}

export interface Variable {
  id: string;
  name: string;
  value: string;
}

export interface AppSettings {
  rules: ModificationRule[];
  variables: Variable[];
}
