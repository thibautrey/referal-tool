import { Rule, RuleContext } from "../../types/rules";

export class GeoRule implements Rule {
  priority = 100; // Higher priority than device rules

  constructor(private rule: any) {}

  async execute(context: RuleContext) {
    const countries: string[] = JSON.parse(this.rule.countries);
    if (countries.includes(context.userCountry)) {
      context.redirectUrl = this.rule.redirectUrl;
      context.matchedRules.push({
        id: this.rule.id,
        type: "geo",
        priority: this.priority,
      });

      if (this.rule.isExclusive) {
        throw new Error("STOP_CHAIN");
      }
    }
  }
}

export class DeviceRule implements Rule {
  priority = 50; // Lower priority than geo rules

  constructor(private rule: any) {}

  async execute(context: RuleContext) {
    if (
      this.rule.deviceType === "all" ||
      this.rule.deviceType === context.deviceType
    ) {
      context.redirectUrl = this.rule.redirectUrl;
      context.matchedRules.push({
        id: this.rule.id,
        type: "device",
        priority: this.priority,
      });
    }
  }
}
