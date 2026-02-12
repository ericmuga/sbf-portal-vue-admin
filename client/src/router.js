import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/auth.js";

import Login from "./views/Login.vue";
import Otp from "./views/Otp.vue";
import GoogleCallback from "./views/GoogleCallback.vue";

import Dashboard from "./views/Dashboard.vue";
import Payments from "./views/Payments.vue";
import Claims from "./views/Claims.vue";
import Beneficiaries from "./views/Beneficiaries.vue";

import AdminHome from "./views/admin/AdminHome.vue";
import AdminUsers from "./views/admin/AdminUsers.vue";
import AdminRoles from "./views/admin/AdminRoles.vue";
import AdminPayments from "./views/admin/AdminPayments.vue";
import AdminPOs from "./views/admin/AdminPOs.vue";
import AdminProjects from "./views/admin/AdminProjects.vue";

const routes = [
  { path: "/", redirect: "/login" },

  { path: "/login", component: Login, meta: { public: true } },
  { path: "/login/otp", component: Otp, meta: { public: true } },
  { path: "/login/google/callback", component: GoogleCallback, meta: { public: true } },

  // Member Portal
  { path: "/dashboard", component: Dashboard, meta: { permission: null } },
  { path: "/payments", component: Payments, meta: { permission: null } },
  { path: "/claims", component: Claims, meta: { permission: null } },
  { path: "/beneficiaries", component: Beneficiaries, meta: { permission: null } },

  // Admin Portal
  { path: "/admin", component: AdminHome, meta: { permission: "admin.access" } },
  { path: "/admin/users", component: AdminUsers, meta: { permission: "users.view" } },
  { path: "/admin/roles", component: AdminRoles, meta: { permission: "roles.view" } },
  { path: "/admin/payments", component: AdminPayments, meta: { permission: "payments.view" } },
  { path: "/admin/pos", component: AdminPOs, meta: { permission: "pos.view" } },
  { path: "/admin/projects", component: AdminProjects, meta: { permission: "projects.view" } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.user) await auth.hydrate();

  if (to.meta.public) return true;

  if (!auth.user) return "/login";

  const required = to.meta.permission;
  if (required && !auth.can(required)) return "/dashboard";

  return true;
});

export default router;
