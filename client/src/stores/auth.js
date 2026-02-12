import { defineStore } from "pinia";
import { api, setAccessToken } from "../api.js";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
    permissions: (s) => s.user?.permissions || [],
    roleName: (s) => s.user?.role?.name || "",
    can: (s) => (perm) => (s.user?.permissions || []).includes(perm)
  },
  actions: {
    async hydrate() {
      try {
        const { data } = await api.get("/me");
        this.user = data.user;
      } catch {
        this.user = null;
      }
    },
    async register(name, email, password) {
      const { data } = await api.post("/auth/register", { name, email, password });
      return data;
    },
    async login(email, password) {
      const { data } = await api.post("/auth/login", { email, password });
      return data;
    },
    startGoogleLogin() {
      window.location.href = "http://localhost:3000/api/auth/google/start";
    },
    async completeGoogleLogin(accessToken) {
      setAccessToken(accessToken);
      const { data } = await api.get("/me");
      this.user = data.user;
    },
    async requestOtp() {
      await api.post("/auth/request-otp", {});
    },
    async verifyOtp(otp) {
      const { data } = await api.post("/auth/verify-otp", { otp });
      if (data?.accessToken) setAccessToken(data.accessToken);
      this.user = data.user;
    },
    async refreshToken() {
      const { data } = await api.post("/auth/refresh", {});
      if (data?.accessToken) setAccessToken(data.accessToken);
      this.user = data.user;
      return data;
    },
    async logout() {
      await api.post("/auth/logout", {});
      setAccessToken("");
      this.user = null;
    }
  }
});
