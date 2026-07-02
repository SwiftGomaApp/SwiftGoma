"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Upload, X, FileText, ImageIcon } from "lucide-react";
import { sellerApi } from "@/lib/api/seller-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;

export function KycForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => sellerApi.submitKyc(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller", "kyc"] });
      router.push("/");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setError(null);

    if (files.length + selected.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} documents autorisés.`);
      return;
    }

    const oversize = selected.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversize) {
      setError(`Chaque document ne doit pas dépasser ${MAX_SIZE_MB} Mo.`);
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (files.length === 0) {
      setError("Veuillez ajouter au moins un document.");
      return;
    }

    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="size-6 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">
            Vérification d&apos;identité
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            Téléversez une pièce d&apos;identité valide (carte nationale,
            passeport ou permis de conduire) pour vérifier votre compte
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= MAX_FILES}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            "hover:border-primary/50 hover:bg-muted/50",
            files.length >= MAX_FILES && "pointer-events-none opacity-50",
          )}
        >
          <Upload className="size-6 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Cliquez pour ajouter des documents
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou PDF — max {MAX_SIZE_MB} Mo par fichier, {MAX_FILES}{" "}
              documents max
            </p>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        {files.length > 0 && (
          <div className="flex flex-col gap-2">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {file.type === "application/pdf" ? (
                  <FileText className="size-5 shrink-0 text-muted-foreground" />
                ) : (
                  <ImageIcon className="size-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} Mo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={mutation.isPending || files.length === 0}>
        {mutation.isPending ? "Envoi en cours..." : "Soumettre les documents"}
      </Button>
    </form>
  );
}
