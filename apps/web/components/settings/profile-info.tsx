// components/settings/profile-info.tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "@/lib/toast";
import { Camera, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userApi } from "@/lib/api/routes/user";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export function ProfileInfo() {
  const { user, refresh } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingName(true);
    try {
      await userApi.updateProfile({ name });
      toast.success("Nom mis à jour.");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      await userApi.uploadProfilePicture(file);
      toast.success("Photo de profil mise à jour.");
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground">Profil</h3>

      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="gap-1.5"
          >
            <Camera className="h-3.5 w-3.5" />
            {isUploadingAvatar ? "Envoi..." : "Changer la photo"}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPG ou PNG, 5 Mo maximum.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSaveName}
        className="flex flex-col gap-3 border-t border-border pt-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name">Nom complet</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={isSavingName || name === user?.name}
          className="self-start"
        >
          {isSavingName ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}
