export type MatchType = 'startsWith' | 'endsWith' | 'equals';

export interface HeaderModification {
  id: string;
  name: string;
  value: string;
}

export interface ModificationRule {
  id: string;
  enabled: boolean;
  name: string;
  // Site (tab) where the rules should be applied
  tabUrl?: string;
  tabUrlMatchType: MatchType;
  // Domains for which headers should be modified
  targetDomain: string;
  targetDomainMatchType: MatchType;
  // Headers to modify
  headers: HeaderModification[];
}

export interface AppSettings {
  rules: ModificationRule[];
}
