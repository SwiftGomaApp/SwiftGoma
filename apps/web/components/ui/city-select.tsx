"use client";

import { useMemo, useState } from "react";
import { City } from "country-state-city";
import { Building2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { ScrollArea } from "@/components/ui/scroll-area";

type CitySelectSize = "sm" | "default" | "lg";

// Some countries have tens of thousands of cities — always cap what we
// render, and lean on the search box rather than dumping the full list.
const MAX_RESULTS = 50;

type CitySelectProps = {
  /** ISO-2 country code, e.g. "CD". Field is disabled until this is set. */
  countryCode?: string;
  /** Selected state's isoCode. Optional — falls back to a country-wide list. */
  stateCode?: string;
  /** Selected city name. */
  value?: string;
  onChange: (cityName: string | null) => void;
  disabled?: boolean;
  variant?: CitySelectSize;
  placeholder?: string;
  className?: string;
  popupClassName?: string;
};

function CitySelect({
  countryCode,
  stateCode,
  value,
  onChange,
  disabled,
  variant = "default",
  placeholder = "Sélectionner une ville",
  className,
  popupClassName,
}: CitySelectProps) {
  const [searchValue, setSearchValue] = useState("");

  const cities: string[] = useMemo(() => {
    if (!countryCode) return [];
    const raw = stateCode
      ? City.getCitiesOfState(countryCode, stateCode)
      : (City.getCitiesOfCountry(countryCode) ?? []);
    const seen = new Set<string>();
    const names: string[] = [];
    for (const c of raw) {
      if (!seen.has(c.name)) {
        seen.add(c.name);
        names.push(c.name);
      }
    }
    return names.sort((a, b) => a.localeCompare(b));
  }, [countryCode, stateCode]);

  const filteredCities = useMemo(() => {
    const pool = searchValue
      ? cities.filter((name) =>
          name.toLowerCase().includes(searchValue.toLowerCase()),
        )
      : cities;
    return pool.slice(0, MAX_RESULTS);
  }, [cities, searchValue]);

  const isDisabled = disabled || !countryCode || cities.length === 0;
  const triggerText = !countryCode
    ? "Sélectionnez d'abord un pays"
    : cities.length === 0
      ? "Aucune ville trouvée"
      : (value ?? placeholder);

  return (
    <Combobox
      items={filteredCities}
      value={value || ""}
      onValueChange={(city: string | null) => onChange(city)}
    >
      <ComboboxTrigger
        render={
          <Button
            variant="outline"
            size={variant}
            className={cn(
              "w-full justify-start gap-2 px-3 font-normal",
              isDisabled && "opacity-50",
              className,
            )}
            disabled={isDisabled}
          >
            <Building2Icon className="size-4 shrink-0 opacity-60" />
            <span className="flex-1 truncate text-left text-sm">
              {triggerText}
            </span>
            <span className="sr-only">
              <ComboboxValue />
            </span>
          </Button>
        }
      />
      <ComboboxContent
        className={cn(
          "w-(--anchor-width) min-w-64 *:data-[slot=input-group]:bg-transparent",
          popupClassName,
        )}
      >
        <ComboboxInput
          placeholder="Rechercher une ville…"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          showTrigger={false}
          className="border-input focus-visible:border-border rounded-none border-0 px-0 py-2.5 shadow-none ring-0! outline-none! focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <ComboboxSeparator />
        <ComboboxEmpty className="px-4 py-2.5 text-sm">
          Aucune ville trouvée.
        </ComboboxEmpty>
        <ComboboxList>
          <div className="relative flex max-h-full">
            <div className="flex max-h-[min(var(--available-height),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overscroll-contain">
              <ScrollArea className="size-full min-h-0 **:data-[slot=scroll-area-scrollbar]:m-0 [&_[data-slot=scroll-area-viewport]]:h-full [&_[data-slot=scroll-area-viewport]]:overscroll-contain">
                {filteredCities.map((name) => (
                  <ComboboxItem
                    key={name}
                    value={name}
                    className="flex items-center gap-2"
                  >
                    <span className="flex-1 text-sm">{name}</span>
                  </ComboboxItem>
                ))}
              </ScrollArea>
            </div>
          </div>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export { CitySelect };
