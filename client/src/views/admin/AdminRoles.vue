<template>
  <AdminShell>
    <div class="card p-6">
      <div>
        <div class="text-lg font-bold text-slate-900">Roles & Permissions</div>
        <div class="text-sm text-slate-500">View the permission blueprint per role</div>
      </div>

      <div class="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div v-for="r in roles" :key="r.id" class="border border-slate-100 rounded-2xl p-5">
          <div class="flex items-center justify-between">
            <div class="font-semibold text-slate-900">{{ r.name }}</div>
            <span class="pill">{{ r.permissions.length }} perms</span>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <span v-for="p in r.permissions" :key="p" class="pill">{{ p }}</span>
          </div>
        </div>
      </div>

      <div class="mt-6 border-t border-slate-100 pt-5">
        <div class="text-sm font-semibold text-slate-900">All permissions</div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span v-for="p in permissions" :key="p.key" class="pill">{{ p.key }}</span>
        </div>
      </div>
    </div>
  </AdminShell>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { api } from "../../api.js";
import AdminShell from "../../components/AdminShell.vue";

const roles = ref([]);
const permissions = ref([]);

onMounted(async () => {
  const [r, p] = await Promise.all([api.get("/admin/roles"), api.get("/admin/permissions")]);
  roles.value = r.data.roles;
  permissions.value = p.data.permissions;
});
</script>
