"use client";

import { useMemo, useState } from "react";
import * as BasePhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import en from "react-phone-number-input/locale/en.json";
import { GlobeIcon } from "lucide-react";

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

type CountrySelectSize = "sm" | "default" | "lg";

// Default market — République démocratique du Congo.
const DEFAULT_COUNTRY: BasePhoneInput.Country = "CD";

type CountryEntry = { value: BasePhoneInput.Country; label: string };

const ALL_COUNTRIES: CountryEntry[] = BasePhoneInput.getCountries()
  .map((country) => ({
    value: country,
    label: (en as Record<string, string>)[country] ?? country,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

type CountrySelectProps = {
  value?: BasePhoneInput.Country;
  defaultValue?: BasePhoneInput.Country;
  onChange: (country: BasePhoneInput.Country) => void;
  disabled?: boolean;
  variant?: CountrySelectSize;
  placeholder?: string;
  className?: string;
  popupClassName?: string;
  /** Show the dial code next to each option in the list, e.g. "+243". */
  showCallingCode?: boolean;
};

function CountrySelect({
  value,
  defaultValue = DEFAULT_COUNTRY,
  onChange,
  disabled,
  variant = "default",
  placeholder = "Sélectionner un pays",
  className,
  popupClassName,
  showCallingCode = true,
}: CountrySelectProps) {
  const [searchValue, setSearchValue] = useState("");
  const selected = value ?? defaultValue;

  const filteredCountries = useMemo(() => {
    if (!searchValue) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(({ label }) =>
      label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [searchValue]);

  const selectedLabel =
    ALL_COUNTRIES.find((c) => c.value === selected)?.label ?? placeholder;

  return (
    <Combobox
      items={filteredCountries}
      value={selected || ""}
      onValueChange={(country: BasePhoneInput.Country | null) => {
        if (country) onChange(country);
      }}
    >
      <ComboboxTrigger
        render={
          <Button
            variant="outline"
            size={variant}
            className={cn(
              "w-full justify-start gap-2 px-3 font-normal",
              disabled && "opacity-50",
              className,
            )}
            disabled={disabled}
          >
            <FlagComponent country={selected} countryName={selectedLabel} />
            <span className="flex-1 truncate text-left text-sm">
              {selectedLabel}
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
          placeholder="e.g. United States"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          showTrigger={false}
          className="border-input focus-visible:border-border rounded-none border-0 px-0 py-2.5 shadow-none ring-0! outline-none! focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <ComboboxSeparator />
        <ComboboxEmpty className="px-4 py-2.5 text-sm">
          No country found.
        </ComboboxEmpty>
        <ComboboxList>
          <div className="relative flex max-h-full">
            <div className="flex max-h-[min(var(--available-height),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overscroll-contain">
              <ScrollArea className="size-full min-h-0 **:data-[slot=scroll-area-scrollbar]:m-0 [&_[data-slot=scroll-area-viewport]]:h-full [&_[data-slot=scroll-area-viewport]]:overscroll-contain">
                {filteredCountries.map((item) => (
                  <ComboboxItem
                    key={item.value}
                    value={item.value}
                    className="flex items-center gap-2"
                  >
                    <FlagComponent
                      country={item.value}
                      countryName={item.label}
                    />
                    <span className="flex-1 text-sm">{item.label}</span>
                    {showCallingCode && (
                      <span className="text-foreground/50 text-sm">
                        {`+${BasePhoneInput.getCountryCallingCode(item.value)}`}
                      </span>
                    )}
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

function FlagComponent({
  country,
  countryName,
}: {
  country?: BasePhoneInput.Country;
  countryName?: string;
}) {
  const Flag = country ? flags[country] : undefined;

  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center [&_svg:not([class*='size-'])]:size-full! [&_svg:not([class*='size-'])]:rounded-[5px]">
      {Flag ? (
        <Flag title={countryName} />
      ) : (
        <GlobeIcon className="size-4 opacity-60" />
      )}
    </span>
  );
}

export { CountrySelect, DEFAULT_COUNTRY };
