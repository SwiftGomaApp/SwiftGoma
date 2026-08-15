"use client";

import { useMemo, useState } from "react";
import { State } from "country-state-city";
import { MapPinIcon } from "lucide-react";

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

type StateSelectSize = "sm" | "default" | "lg";

type StateEntry = { isoCode: string; name: string };

type StateSelectProps = {
  /** ISO-2 country code, e.g. "CD". Field is disabled until this is set. */
  countryCode?: string;
  /** Selected state's isoCode. */
  value?: string;
  onChange: (state: StateEntry | null) => void;
  disabled?: boolean;
  variant?: StateSelectSize;
  placeholder?: string;
  className?: string;
  popupClassName?: string;
};

function StateSelect({
  countryCode,
  value,
  onChange,
  disabled,
  variant = "default",
  placeholder = "Sélectionner une province",
  className,
  popupClassName,
}: StateSelectProps) {
  const [searchValue, setSearchValue] = useState("");

  const states: StateEntry[] = useMemo(() => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map((s) => ({
      isoCode: s.isoCode,
      name: s.name,
    }));
  }, [countryCode]);

  const filteredStates = useMemo(() => {
    if (!searchValue) return states;
    return states.filter((s) =>
      s.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [states, searchValue]);

  const isDisabled = disabled || !countryCode || states.length === 0;
  const selectedLabel = states.find((s) => s.isoCode === value)?.name;

  const triggerText = !countryCode
    ? "Sélectionnez d'abord un pays"
    : states.length === 0
      ? "Aucune province pour ce pays"
      : (selectedLabel ?? placeholder);

  return (
    <Combobox
      items={filteredStates}
      value={value || ""}
      onValueChange={(isoCode: string | null) => {
        const found = states.find((s) => s.isoCode === isoCode) ?? null;
        onChange(found);
      }}
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
            <MapPinIcon className="size-4 shrink-0 opacity-60" />
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
          placeholder="Rechercher une province…"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          showTrigger={false}
          className="border-input focus-visible:border-border rounded-none border-0 px-0 py-2.5 shadow-none ring-0! outline-none! focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <ComboboxSeparator />
        <ComboboxEmpty className="px-4 py-2.5 text-sm">
          Aucune province trouvée.
        </ComboboxEmpty>
        <ComboboxList>
          <div className="relative flex max-h-full">
            <div className="flex max-h-[min(var(--available-height),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overscroll-contain">
              <ScrollArea className="size-full min-h-0 **:data-[slot=scroll-area-scrollbar]:m-0 [&_[data-slot=scroll-area-viewport]]:h-full [&_[data-slot=scroll-area-viewport]]:overscroll-contain">
                {filteredStates.map((s) => (
                  <ComboboxItem
                    key={s.isoCode}
                    value={s.isoCode}
                    className="flex items-center gap-2"
                  >
                    <span className="flex-1 text-sm">{s.name}</span>
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

export { StateSelect };
export type { StateEntry };
