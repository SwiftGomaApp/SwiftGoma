import type { ReactNode } from "react";

export interface Step {
  title: string;
  body: ReactNode;
}

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="mb-6 space-y-5">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-4">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="mb-1 text-sm font-semibold">{step.title}</p>
            <div className="text-sm leading-relaxed text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-foreground">
              {step.body}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
