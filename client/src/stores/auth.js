import { defineStore } from "pinia";
import { api } from "../api.js";

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
    async login(email, password) {
      const { data } = await api.post("/auth/login", { email, password });
      return data; // {otpRequired:true}
    },
    async requestOtp() {
      await api.post("/auth/request-otp", {});
    },
    async verifyOtp(otp) {
      const { data } = await api.post("/auth/verify-otp", { otp });
      this.user = data.user;
    },
    async logout() {
      await api.post("/auth/logout", {});
      this.user = null;
    }
  }
});
