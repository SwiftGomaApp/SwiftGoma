import type { Param } from "@/lib/types";

export function ParamTable({ params }: { params: Param[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <tbody>
          {params.map((param, i) => (
            <tr
              key={param.name}
              className={i !== params.length - 1 ? "border-b border-border" : ""}
            >
              <td className="w-1/3 min-w-[140px] align-top px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-[13px] font-medium text-foreground">
                    {param.name}
                  </code>
                  <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {param.type}
                  </span>
                  {param.required && (
                    <span className="rounded bg-delete px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-delete-foreground">
                      required
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{param.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
