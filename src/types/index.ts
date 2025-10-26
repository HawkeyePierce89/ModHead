export type MatchType = 'startsWith' | 'endsWith' | 'equals';

export type HeaderAction = 'set' | 'append' | 'remove';

export interface HeaderModification {
  id: string;
  name: string;
  value: string;
  action: HeaderAction;
}

export interface ModificationRule {
  id: string;
  enabled: boolean;
  name: string;
  // Сайт (таб), на котором должны действовать правила
  tabUrl?: string;
  tabUrlMatchType: MatchType;
  // Домены, на которые должны подменяться заголовки
  targetDomain: string;
  targetDomainMatchType: MatchType;
  // Заголовки для модификации
  headers: HeaderModification[];
}

export interface AppSettings {
  rules: ModificationRule[];
}
