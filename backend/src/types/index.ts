import { NextFunction, Request, Response } from "express";

// Add interfaces for our data structures
export interface RuleStats {
  ruleId: number;
  count: number;
  rule: {
    id: number;
    redirectUrl: string;
    countries: string[];
  } | null;
}

export interface VisitData {
  country: string;
  createdAt: Date;
}

export interface LinkStat {
  linkId: number;
  visits: number;
}

export interface CountryCount {
  country: string;
  count: number;
}

export const addRuleStats = (ruleStats: RuleStats[]) => {
  return ruleStats.map((r: RuleStats) => ({
    ruleId: r.ruleId,
    count: r.count,
    ruleInfo: r.rule,
  }));
};

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: any;
}

export type ControllerFunction = (
  req: Request,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;
