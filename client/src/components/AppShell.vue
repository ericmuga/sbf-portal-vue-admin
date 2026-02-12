<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Top bar -->
    <header class="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-xl bg-amber-700/90"></div>
          <div class="leading-tight">
            <div class="text-sm font-bold text-slate-900">SBF Portal</div>
            <div class="text-[11px] text-slate-500">Self Service</div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-right">
          <div class="text-xs text-slate-500">Logged in as</div>
          <div class="text-sm font-semibold text-slate-900">{{ user?.name }}</div>
        </div>
        <RouterLink v-if="canAdmin" class="btn-outline" to="/admin">Admin</RouterLink>
        <button class="btn-outline" @click="logout">Log out</button>
      </div>
    </header>

    <div class="flex">
      <aside class="w-72 bg-white border-r border-slate-100 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <nav class="space-y-2">
          <RouterLink to="/dashboard" class="navlink" :class="{ 'navlink-active': isActive('/dashboard') }">
            <span class="h-8 w-8 rounded-xl bg-slate-100 grid place-items-center">🏠</span>
            <span>Dashboard</span>
          </RouterLink>

          <RouterLink to="/payments" class="navlink" :class="{ 'navlink-active': isActive('/payments') }">
            <span class="h-8 w-8 rounded-xl bg-slate-100 grid place-items-center">💳</span>
            <span>Make Payment</span>
          </RouterLink>

          <RouterLink to="/claims" class="navlink" :class="{ 'navlink-active': isActive('/claims') }">
            <span class="h-8 w-8 rounded-xl bg-slate-100 grid place-items-center">📎</span>
            <span>Claims</span>
          </RouterLink>

          <RouterLink to="/beneficiaries" class="navlink" :class="{ 'navlink-active': isActive('/beneficiaries') }">
            <span class="h-8 w-8 rounded-xl bg-slate-100 grid place-items-center">👥</span>
            <span>Beneficiaries</span>
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
const canAdmin = computed(() => auth.can("admin.access"));

function isActive(path) {
  return route.path === path;
}

async function logout() {
  await auth.logout();
  router.push("/login");
}
</script>
