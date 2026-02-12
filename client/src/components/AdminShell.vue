<template>
  <div class="min-h-screen bg-slate-50">
    <header class="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6">
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-items-center">A</div>
        <div>
          <div class="text-sm font-bold text-slate-900">Admin Portal</div>
          <div class="text-[11px] text-slate-500">{{ roleName }}</div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-right">
          <div class="text-xs text-slate-500">Signed in</div>
          <div class="text-sm font-semibold text-slate-900">{{ user?.name }}</div>
        </div>
        <RouterLink class="btn-outline" to="/dashboard">Member Portal</RouterLink>
        <button class="btn-outline" @click="logout">Log out</button>
      </div>
    </header>

    <div class="flex">
      <aside class="w-72 bg-white border-r border-slate-100 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div class="text-xs font-semibold text-slate-500 px-2 mb-2">ADMIN MENU</div>
        <nav class="space-y-2">
          <RouterLink to="/admin" class="navlink" :class="{ 'navlink-active': isActive('/admin') }">
            <span class="h-8 w-8 rounded-xl bg-slate-100 grid place-items-center">📊</span>
            <span>Overview</span>
          </RouterLink>

          <RouterLink v-if="can('users.view')" to="/admin/users" class="navlink" :class="{ 'navlink-active': isActive('/admin/users') }">
            <span class="h-8 w-8 rounded-xl bg-slate-100 grid place-items-center">👤</span>
            <span>Users</span>
          </RouterLink>

          <RouterLink v-if="can('roles.view')" to="/admin/roles" class="navlink" :class="{ 'navlink-active': isActive('/admin/roles') }">
            <span class="h-8 w-8 rounded-xl bg-slate-100 grid place-items-center">🔐</span>
            <span>Roles & Permissions</span>
          </RouterLink>

          <RouterLink v-if="can('payments.view')" to="/admin/payments" class="navlink" :class="{ 'navlink-active': isActive('/admin/payments') }">
            <span class="h-8 w-8 rounded-xl bg-slate-100 grid place-items-center">💰</span>
            <span>Payments</span>
          </RouterLink>

          <RouterLink v-if="can('pos.view')" to="/admin/pos" class="navlink" :class="{ 'navlink-active': isActive('/admin/pos') }">
            <span class="h-8 w-8 rounded-xl bg-slate-100 grid place-items-center">🧾</span>
            <span>Purchase Orders</span>
          </RouterLink>

          <RouterLink v-if="can('projects.view')" to="/admin/projects" class="navlink" :class="{ 'navlink-active': isActive('/admin/projects') }">
            <span class="h-8 w-8 rounded-xl bg-slate-100 grid place-items-center">📌</span>
            <span>Projects</span>
          </RouterLink>
        </nav>
      </aside>

      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const user = computed(() => auth.user);
const roleName = computed(() => auth.roleName);

function can(p) { return auth.can(p); }
function isActive(path) { return route.path === path; }

async function logout() {
  await auth.logout();
  router.push("/login");
}
</script>
