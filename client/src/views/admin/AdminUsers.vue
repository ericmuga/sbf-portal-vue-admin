<template>
  <AdminShell>
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-lg font-bold text-slate-900">Users</div>
          <div class="text-sm text-slate-500">Assign roles to users (RBAC)</div>
        </div>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>

      <div class="mt-5 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-slate-500 bg-slate-50">
            <tr>
              <th class="text-left py-3 px-3">Name</th>
              <th class="text-left py-3 px-3">Email</th>
              <th class="text-left py-3 px-3">Role</th>
              <th class="text-left py-3 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-t">
              <td class="py-4 px-3 font-medium text-slate-900">{{ u.name }}</td>
              <td class="py-4 px-3">{{ u.email }}</td>
              <td class="py-4 px-3">
                <select class="input max-w-xs" v-model.number="u._roleId">
                  <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
                </select>
              </td>
              <td class="py-4 px-3">
                <button class="btn-primary" @click="save(u)">Save</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 text-xs text-slate-500">
        Note: This is a demo in-memory API. In production, roles/permissions would be persisted in DB.
      </div>
    </div>
  </AdminShell>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { api } from "../../api.js";
import AdminShell from "../../components/AdminShell.vue";

const users = ref([]);
const roles = ref([]);
const error = ref("");

async function load() {
  const [u, r] = await Promise.all([api.get("/admin/users"), api.get("/admin/roles")]);
  roles.value = r.data.roles;
  users.value = u.data.users.map(x => ({ ...x, _roleId: x.role?.id }));
}

async function save(u) {
  error.value = "";
  try {
    await api.post(`/admin/users/${u.id}/role`, { roleId: u._roleId });
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to update role";
  }
}

onMounted(load);
</script>
