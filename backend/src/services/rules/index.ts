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
  priority: number; // Lower priority than geo rules

  constructor(private rule: any) {
    this.priority = this.rule.deviceType === "all" ? 40 : 60;
  }

  async execute(context: RuleContext) {
    const hasDeviceMatch = context.matchedRules.some(
      (r) => r.type === "device"
    );

    if (this.rule.deviceType === "all" && hasDeviceMatch) {
      return;
    }

    if (
      this.rule.deviceType === "all" &&
      context.matchedRules.some((r) => r.type === "geo")
    ) {
      return;
    }

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
