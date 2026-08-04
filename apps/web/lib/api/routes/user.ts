import { api } from "../client";
import type { User } from "./auth";

function unwrap<T>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const userApi = {
  // ---- Phone: initial verification ----
  requestPhoneVerification(input: { phone: string }) {
    return unwrap<{ sent: boolean }>(api.post("/users/phone/request", input));
  },

  verifyPhone(input: { code: string; locale?: string }) {
    return unwrap<User>(api.post("/users/phone/verify", input));
  },

  // ---- Phone: update to a new number ----
  requestPhoneUpdate(input: { newPhone: string }) {
    return unwrap<{ sent: boolean }>(
      api.post("/users/phone/update/request", input),
    );
  },

  verifyPhoneUpdate(input: { code: string; locale?: string }) {
    return unwrap<User>(api.post("/users/phone/update/verify", input));
  },

  // ---- Secondary email ----
  requestSecondaryEmail(input: { email: string; locale?: string }) {
    return unwrap<{ sent: boolean }>(
      api.post("/users/email/secondary/request", input),
    );
  },

  verifySecondaryEmail(input: { code: string; locale?: string }) {
    return unwrap<User>(api.post("/users/email/secondary/verify", input));
  },

  removeSecondaryEmail() {
    return unwrap<User>(api.delete("/users/email/secondary"));
  },

  // ---- Google account link/unlink ----
  linkGoogleAccount(idToken: string) {
    return unwrap<User>(api.post("/users/google/link", { idToken }));
  },

  unlinkGoogleAccount() {
    return unwrap<User>(api.post("/users/google/unlink"));
  },

  updateProfile(input: { name?: string; avatarUrl?: string }) {
    return unwrap<User>(api.patch("/users/profile", input));
  },

  uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    return unwrap<User>(
      api.post("/users/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
};
