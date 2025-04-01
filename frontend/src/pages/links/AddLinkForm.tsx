import { AVAILABLE_COUNTRIES, COUNTRY_OPTIONS } from "./Countries";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Import Command components for searchable select
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
import { toast } from "sonner";
import { useState } from "react";

export interface GeoRule {
  redirectUrl: string; // Renommé de url à redirectUrl
  region: string;
  countries: string[];
}

interface LinkFormData {
  name: string; // Ajout du champ name
  baseUrl: string; // Renommé de mainUrl à baseUrl
  geoRules: GeoRule[];
}

interface AddLinkFormProps {
  onSubmit: (data: LinkFormData) => Promise<void>;
}

export function AddLinkForm({ onSubmit }: AddLinkFormProps) {
  const [linkName, setLinkName] = useState(""); // Nouveau state pour le nom
  const [baseUrl, setBaseUrl] = useState(""); // Renommé de newLinkUrl
  const [geoRules, setGeoRules] = useState<GeoRule[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // for filtering countries in the Command dropdown

  const handleAddGeoRule = (rule: GeoRule) => {
    const ruleIndex = geoRules.findIndex(
      (r) =>
        rule === r ||
        (rule.region === r.region && rule.redirectUrl === r.redirectUrl)
    );

    if (ruleIndex !== -1) {
      const updatedRules = [...geoRules];
      updatedRules[ruleIndex] = rule;
      setGeoRules(updatedRules);
    } else {
      setGeoRules([...geoRules, rule]);
    }
  };

  const handleRemoveGeoRule = (index: number) => {
    setGeoRules(geoRules.filter((_, idx) => idx !== index));
  };

  const handleRegionChange = (value: string, rule: GeoRule, index: number) => {
    let countries: string[] = [];
    if (value !== "custom") {
      countries =
        AVAILABLE_COUNTRIES[value as keyof typeof AVAILABLE_COUNTRIES] || [];
    }
    const updatedRule = { ...rule, region: value, countries };
    const updatedRules = [...geoRules];
    updatedRules[index] = updatedRule;
    setGeoRules(updatedRules);
  };

  const handleCountryChange = (
    countries: string[],
    rule: GeoRule,
    index: number
  ) => {
    const updatedRule = { ...rule, countries };
    const updatedRules = [...geoRules];
    updatedRules[index] = updatedRule;
    setGeoRules(updatedRules);
  };

  const handleSubmit = () => {
    if (!baseUrl.trim() || !linkName.trim()) {
      toast.error("Base URL and name are required");
      return;
    }

    const validRules = geoRules.filter(
      (rule) => rule.redirectUrl.trim() && rule.countries.length > 0
    );

    onSubmit({
      name: linkName,
      baseUrl: baseUrl,
      geoRules: validRules,
    });
  };

  // Filter country options based on the search term and remove already selected ones
  const getFilteredCountryOptions = (selected: string[]) =>
    COUNTRY_OPTIONS.filter(
      (option) =>
        !selected.includes(option.value) &&
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Link</CardTitle>
        <CardDescription>
          Create a new referral link to share with your community.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="linkName">Link Name</Label>
          <Input
            id="linkName"
            placeholder="My Link"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseUrl">Base URL</Label>
          <Input
            id="baseUrl"
            placeholder="https://example.com/ref?id=your-id"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Geo-based Redirections</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleAddGeoRule({
                  redirectUrl: "",
                  region: "",
                  countries: [],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>

          {geoRules.map((rule, index) => (
            <div key={index} className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Select
                  value={rule.region}
                  onValueChange={(value) =>
                    handleRegionChange(value, rule, index)
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="europe">European Union</SelectItem>
                    <SelectItem value="northAmerica">North America</SelectItem>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="middleEast">Middle East</SelectItem>
                    <SelectItem value="africa">Africa</SelectItem>
                    <SelectItem value="southAmerica">South America</SelectItem>
                    <SelectItem value="oceania">Oceania</SelectItem>
                    <SelectItem value="custom">Custom Countries</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveGeoRule(index)}
                >
                  Remove
                </Button>
              </div>

              <Input
                placeholder="Alternative URL for this region"
                value={rule.redirectUrl}
                onChange={(e) => {
                  const updatedRule = { ...rule, redirectUrl: e.target.value };
                  const updatedRules = [...geoRules];
                  updatedRules[index] = updatedRule;
                  setGeoRules(updatedRules);
                }}
              />

              {rule.region === "custom" && (
                <div className="mt-2">
                  <Label>Selected Countries</Label>
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
                          >
                            ×
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <Label>Add Countries</Label>
                  <Command className="rounded-md border shadow-sm mt-2">
                    <CommandInput
                      placeholder="Search for a country..."
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                      className="px-2 py-1"
                    />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        {getFilteredCountryOptions(rule.countries).map(
                          (option) => (
                            <CommandItem
                              key={option.value}
                              onSelect={() => {
                                setSearchTerm("");
                                const newCountries = [
                                  ...rule.countries,
                                  option.value,
                                ];
                                handleCountryChange(newCountries, rule, index);
                              }}
                            >
                              {option.label}
                            </CommandItem>
                          )
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}

              {rule.region !== "custom" && rule.countries.length > 0 && (
                <div className="text-sm text-muted-foreground mt-2">
                  Applies to:{" "}
                  {rule.countries
                    .map(
                      (countryCode) =>
                        COUNTRY_OPTIONS.find((c) => c.value === countryCode)
                          ?.label
                    )
                    .join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit}>
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </CardFooter>
    </Card>
  );
}
