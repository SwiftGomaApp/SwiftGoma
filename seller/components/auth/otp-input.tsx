"use client";

import {
  useRef,
  useState,
  useEffect,
  KeyboardEvent,
  ClipboardEvent,
} from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const digits = value
    .split("")
    .concat(Array(length).fill(""))
    .slice(0, length);

  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  const updateValue = (next: string[]) => {
    const joined = next.join("");
    onChange(joined);
    if (joined.length === length && !joined.includes("")) {
      onComplete?.(joined);
    }
  };

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    updateValue(next);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (next[index]) {
        next[index] = "";
        updateValue(next);
      } else if (index > 0) {
        next[index - 1] = "";
        updateValue(next);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    const next = pasted
      .split("")
      .concat(Array(length).fill(""))
      .slice(0, length);
    updateValue(next);
    const lastIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[lastIndex]?.focus();
    setFocusedIndex(lastIndex);
  };

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(i)}
          className={cn(
            "h-12 w-10 rounded-md border bg-background text-center text-lg font-semibold",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            focusedIndex === i ? "border-ring" : "border-input",
          )}
        />
      ))}
    </div>
  );
}
