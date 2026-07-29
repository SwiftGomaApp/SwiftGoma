import api from "./api";

export default async function loginWithPassword(payload: {
  email: string;
  password: string;
}) {
  return api.post("/auth/login/password", payload);
}


export default async function loginWithGoogle(payload: { token: string }) {
  return api.post("/auth/login/google", payload);
}

export default async function getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
}

export default async function logout() {
    return api.post("/auth/logout");
}