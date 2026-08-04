"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/routes/auth";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export function SecurityPassword() {
  const { user, refresh } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const hasPassword = user?.hasPassword ?? false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setIsLoading(true);
    try {
      if (hasPassword) {
        await authApi.updatePassword({ currentPassword, newPassword });
      } else {
        await authApi.createPassword({ password: newPassword });
      }
      toast.success(
        hasPassword ? "Mot de passe mis à jour." : "Mot de passe créé.",
      );
      await refresh();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Mot de passe</h3>
        <p className="text-sm text-muted-foreground">
          {hasPassword
            ? "Changez votre mot de passe actuel."
            : "Vous n'avez pas encore de mot de passe. Vous pouvez continuer à vous connecter par code email."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {hasPassword && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">
            {hasPassword ? "Nouveau mot de passe" : "Mot de passe"}
          </Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirmer</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={isLoading} className="self-start">
          {isLoading
            ? "Enregistrement..."
            : hasPassword
              ? "Mettre à jour"
              : "Créer un mot de passe"}
        </Button>
      </form>
    </div>
  );
}
