"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { generatePassword, estimatePasswordStrength } from "@/lib/generate-password";
import type { GeneratePasswordOptions } from "@securevault/shared-types";

const STRENGTH_COLORS: Record<string, string> = {
  weak: "bg-danger",
  fair: "bg-yellow-500",
  strong: "bg-green-500",
  excellent: "bg-accent",
};

export function PasswordGeneratorPanel({
  onGenerate,
}: {
  onGenerate: (password: string) => void;
}) {
  const [options, setOptions] = useState<GeneratePasswordOptions>({
    length: 20,
    useSymbols: true,
    useNumbers: true,
    useUppercase: true,
    useLowercase: true,
  });
  const [preview, setPreview] = useState(() => generatePassword(options));

  const regenerate = (next: GeneratePasswordOptions = options) => {
    const generated = generatePassword(next);
    setPreview(generated);
    onGenerate(generated);
  };

  const updateOption = <K extends keyof GeneratePasswordOptions>(
    key: K,
    value: GeneratePasswordOptions[K]
  ) => {
    const next = { ...options, [key]: value };
    setOptions(next);
    regenerate(next);
  };

  const strength = estimatePasswordStrength(preview);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm font-mono truncate">{preview}</code>
        <button
          type="button"
          onClick={() => regenerate()}
          className="text-muted hover:text-accent shrink-0"
          title="Regenerate"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="h-1 rounded-full bg-surface-hover overflow-hidden">
        <div
          className={`h-full transition-all ${STRENGTH_COLORS[strength]}`}
          style={{
            width:
              strength === "weak"
                ? "25%"
                : strength === "fair"
                  ? "50%"
                  : strength === "strong"
                    ? "75%"
                    : "100%",
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Length: {options.length}</span>
          <input
            type="range"
            min={8}
            max={64}
            value={options.length}
            onChange={(e) => updateOption("length", Number(e.target.value))}
            className="w-2/3"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(
            [
              ["useUppercase", "A-Z"],
              ["useLowercase", "a-z"],
              ["useNumbers", "0-9"],
              ["useSymbols", "!@#$"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 text-muted">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(e) => updateOption(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
