import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { DeviceRule } from "../types";
import { Input } from "@/components/ui/input";

interface DeviceTargetingProps {
  rules: DeviceRule[];
  onRulesChange: (rules: DeviceRule[]) => void;
}

const OPERATING_SYSTEMS = ["iOS", "Android", "Windows", "macOS", "Linux"];
const BROWSERS = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];

export function DeviceTargeting({
  rules,
  onRulesChange,
}: DeviceTargetingProps) {
  const handleAddRule = () => {
    onRulesChange([
      ...rules,
      {
        redirectUrl: "",
        deviceType: "all",
        devices: [], // Ensure devices is always an array
      },
    ]);
  };

  const removeRule = (index: number) => {
    onRulesChange(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<DeviceRule>) => {
    onRulesChange(
      rules.map((rule, i) => {
        if (i === index) {
          // Ensure devices remains an array when updating
          return {
            ...rule,
            ...updates,
            devices: Array.isArray(updates.devices)
              ? updates.devices
              : rule.devices,
          };
        }
        return rule;
      })
    );
  };

  return (
    <div className="space-y-4">
      {rules.map((rule, index) => (
        <div key={index} className="space-y-4 border p-4 rounded-lg">
          <div className="flex gap-4 items-start">
            <Select
              value={rule.deviceType}
              onValueChange={(value: "mobile" | "tablet" | "desktop" | "all") =>
                updateRule(index, { deviceType: value })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter redirect URL"
              value={rule.redirectUrl}
              onChange={(e) =>
                updateRule(index, { redirectUrl: e.target.value })
              }
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeRule(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-4">
            <Select
              value={rule.os || "any"}
              onValueChange={(value) => updateRule(index, { os: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Operating System" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any OS</SelectItem>
                {OPERATING_SYSTEMS.map((os) => (
                  <SelectItem key={os} value={os}>
                    {os}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="OS Version (ex: 14.0)"
              value={rule.osVersion || ""}
              onChange={(e) => updateRule(index, { osVersion: e.target.value })}
              className="w-[200px]"
            />
          </div>

          <div className="flex gap-4">
            <Select
              value={rule.browser || "any"}
              onValueChange={(value) => updateRule(index, { browser: value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Browser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Browser</SelectItem>
                {BROWSERS.map((browser) => (
                  <SelectItem key={browser} value={browser}>
                    {browser}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Browser Version (ex: 90)"
              value={rule.browserVersion || ""}
              onChange={(e) =>
                updateRule(index, { browserVersion: e.target.value })
              }
              className="w-[200px]"
            />
          </div>
        </div>
      ))}
      <center>
        <Button variant="outline" onClick={handleAddRule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </center>
    </div>
  );
}
