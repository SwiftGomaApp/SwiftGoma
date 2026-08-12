"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { fr } from "react-day-picker/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/i18n/format";

export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateRange(from: string, to: string): DateRange {
  return {
    from: parseLocalDate(from),
    to: parseLocalDate(to),
  };
}

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(() =>
    toDateRange(from, to),
  );

  const canApply = Boolean(draftRange?.from && draftRange?.to);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraftRange(toDateRange(from, to));
    }
  }

  function handleApply() {
    if (!draftRange?.from || !draftRange?.to) return;

    onChange({
      from: toDateInputValue(draftRange.from),
      to: toDateInputValue(draftRange.to),
    });
    setOpen(false);
  }

  function handleCancel() {
    setDraftRange(toDateRange(from, to));
    setOpen(false);
  }

  const label =
    from && to
      ? `${formatDate(from)} → ${formatDate(to)}`
      : "Sélectionner une période";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "justify-start gap-2 text-left font-normal",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          locale={fr}
          defaultMonth={draftRange?.from ?? parseLocalDate(from)}
          selected={draftRange}
          onSelect={setDraftRange}
          numberOfMonths={2}
        />
        <div className="flex items-center justify-end gap-2 border-t p-3">
          <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
            Annuler
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canApply}
            onClick={handleApply}
          >
            Appliquer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
