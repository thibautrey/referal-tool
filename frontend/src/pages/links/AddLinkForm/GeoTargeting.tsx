import { AVAILABLE_COUNTRIES, COUNTRY_OPTIONS } from "../Countries";
import { detectRegionFromCountries } from "../utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useAppTranslation } from "@/i18n";
import { useState } from "react";

export interface GeoRule {
  redirectUrl: string;
  region?: string;
  countries: string[];
}

interface GeoTargetingProps {
  rules: GeoRule[];
  onRulesChange: (rules: GeoRule[]) => void;
}

export function GeoTargeting({ rules, onRulesChange }: GeoTargetingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useAppTranslation();

  const handleAddGeoRule = () => {
    onRulesChange([
      ...rules,
      {
        redirectUrl: "",
        region: "",
        countries: [],
      },
    ]);
  };

  const handleRemoveGeoRule = (index: number) => {
    onRulesChange(rules.filter((_, idx) => idx !== index));
  };

  const handleRegionChange = (value: string, rule: GeoRule, index: number) => {
    let countries: string[] = [];
    if (value !== "custom") {
      countries =
        AVAILABLE_COUNTRIES[value as keyof typeof AVAILABLE_COUNTRIES] || [];
    } else if (rule.countries.length > 0) {
      countries = rule.countries;
    }

    const updatedRule = { ...rule, region: value, countries };
    const updatedRules = [...rules];
    updatedRules[index] = updatedRule;
    onRulesChange(updatedRules);
  };

  const handleCountryChange = (
    countries: string[],
    rule: GeoRule,
    index: number
  ) => {
    const updatedRule = {
      ...rule,
      countries,
      region: detectRegionFromCountries(countries),
    };
    const updatedRules = [...rules];
    updatedRules[index] = updatedRule;
    onRulesChange(updatedRules);
  };

  const getFilteredCountryOptions = (selected: string[]) =>
    COUNTRY_OPTIONS.filter(
      (option) =>
        !selected.includes(option.value) &&
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <Button variant="outline" size="sm" onClick={handleAddGeoRule}>
          <Plus className="h-4 w-4 mr-2" />
          {t("links.form.geo.add_rule")}
        </Button>
      </div>

      {rules.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {t("links.form.geo.no_rules")}
        </p>
      )}

      {rules.map((rule, index) => (
        <div key={index} className="space-y-2 p-4 border rounded-lg">
          <div className="flex items-center gap-4 justify-between">
            <Select
              value={rule.region || detectRegionFromCountries(rule.countries)}
              onValueChange={(value) => handleRegionChange(value, rule, index)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("links.form.geo.placeholders.region")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="europe">
                  {t("links.form.geo.regions.europe")}
                </SelectItem>
                <SelectItem value="northAmerica">
                  {t("links.form.geo.regions.northAmerica")}
                </SelectItem>
                <SelectItem value="asia">
                  {t("links.form.geo.regions.asia")}
                </SelectItem>
                <SelectItem value="middleEast">
                  {t("links.form.geo.regions.middleEast")}
                </SelectItem>
                <SelectItem value="africa">
                  {t("links.form.geo.regions.africa")}
                </SelectItem>
                <SelectItem value="southAmerica">
                  {t("links.form.geo.regions.southAmerica")}
                </SelectItem>
                <SelectItem value="oceania">
                  {t("links.form.geo.regions.oceania")}
                </SelectItem>
                <SelectItem value="custom">
                  {t("links.form.geo.regions.custom")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveGeoRule(index)}
            >
              {t("links.form.geo.remove_rule")}
            </Button>
          </div>

          <Input
            placeholder={t("links.form.geo.placeholders.redirect_url")}
            value={rule.redirectUrl}
            onChange={(e) => {
              const updatedRule = { ...rule, redirectUrl: e.target.value };
              const updatedRules = [...rules];
              updatedRules[index] = updatedRule;
              onRulesChange(updatedRules);
            }}
          />

          {(rule.region === "custom" || !rule.region) && (
            <div className="mt-2">
              <Label>{t("links.form.geo.labels.selected")}</Label>
              <div className="flex flex-wrap gap-2 mb-4">
                {rule.countries.map((country) => {
                  const countryOption = COUNTRY_OPTIONS.find(
                    (opt) => opt.value === country
                  );
                  return (
                    <div
                      key={country}
                      className="flex items-center bg-secondary px-2 py-1 rounded"
                    >
                      {countryOption ? countryOption.label : country}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2"
                        onClick={() => {
                          const newCountries = rule.countries.filter(
                            (c) => c !== country
                          );
                          handleCountryChange(newCountries, rule, index);
                        }}
                        aria-label={t("links.form.geo.remove_rule")}
                      >
                        ×
                      </Button>
                    </div>
                  );
                })}
              </div>

              <Label>{t("links.form.geo.labels.add")}</Label>
              <Command className="rounded-md border shadow-sm mt-2">
                <CommandInput
                  placeholder={t("links.form.geo.placeholders.search")}
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  className="px-2 py-1"
                />
                {searchTerm.length > 0 && (
                  <CommandList className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md z-50">
                    <CommandEmpty>{t("links.form.geo.no_results")}</CommandEmpty>
                    <CommandGroup>
                      {getFilteredCountryOptions(rule.countries).map((option) => (
                        <CommandItem
                          key={option.value}
                          onSelect={() => {
                            setSearchTerm("");
                            const newCountries = [...rule.countries, option.value];
                            handleCountryChange(newCountries, rule, index);
                          }}
                        >
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                )}
              </Command>
            </div>
          )}

          {rule.region !== "custom" &&
            rule.region &&
            rule.countries.length > 0 && (
              <div className="text-sm text-muted-foreground mt-2">
                {t("links.form.geo.applies_to", {
                  countries: rule.countries
                    .map(
                      (countryCode) =>
                        COUNTRY_OPTIONS.find((c) => c.value === countryCode)?.label
                    )
                    .filter(Boolean)
                    .join(", "),
                })}
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
