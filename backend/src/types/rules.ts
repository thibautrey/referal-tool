export interface RuleContext {
  userCountry: string;
  userCity: string;
  deviceType: string;
  redirectUrl: string;
  matchedRules: Array<{ id: string; type: string; priority: number }>;
}

export interface Rule {
  priority: number;
  execute: (context: RuleContext) => Promise<void>;
}
