<template>
  <AdminShell>
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-lg font-bold text-slate-900">Users</div>
          <div class="text-sm text-slate-500">Laravel-style user CRUD + role assignment</div>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input v-model="form.name" class="input" placeholder="Name" />
        <input v-model="form.email" class="input" placeholder="Email" />
        <input v-model="form.password" class="input" type="password" placeholder="Password" />
        <select v-model.number="form.roleId" class="input">
          <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
        <button class="btn-primary" @click="createUser">Create User</button>
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
              <td class="py-4 px-3"><input class="input" v-model="u.name" /></td>
              <td class="py-4 px-3"><input class="input" v-model="u.email" /></td>
              <td class="py-4 px-3">
                <select class="input max-w-xs" v-model.number="u._roleId">
                  <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
                </select>
              </td>
              <td class="py-4 px-3 flex gap-2">
                <button class="btn-primary" @click="save(u)">Save</button>
                <button class="btn-outline" @click="removeUser(u)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
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

const form = ref({ name: "", email: "", password: "", roleId: 4 });

async function load() {
  const [u, r] = await Promise.all([api.get("/admin/users"), api.get("/admin/roles")]);
  roles.value = r.data.roles;
  users.value = u.data.users.map(x => ({ ...x, _roleId: x.role?.id }));
}

async function createUser() {
  error.value = "";
  try {
    await api.post("/admin/users", form.value);
    form.value = { name: "", email: "", password: "", roleId: 4 };
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to create user";
  }
}

async function save(u) {
  error.value = "";
  try {
    await api.put(`/admin/users/${u.id}`, { name: u.name, email: u.email, roleId: u._roleId });
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to update user";
  }
}

async function removeUser(u) {
  error.value = "";
  try {
    await api.delete(`/admin/users/${u.id}`);
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to delete user";
  }
}

onMounted(load);
</script>
