<template>
  <AdminShell>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card p-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-bold text-slate-900">Projects</div>
            <div class="text-sm text-slate-500">Laravel resource-style CRUD for projects</div>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input v-model="form.title" class="input" placeholder="Title" />
          <select v-model="form.status" class="input">
            <option>planned</option>
            <option>active</option>
            <option>completed</option>
          </select>
          <input v-model.number="form.budget" class="input" type="number" placeholder="Budget" />
          <input v-model="form.startDate" class="input" type="date" />
          <input v-model="form.endDate" class="input" type="date" />
        </div>
        <div class="mt-3">
          <button class="btn-primary" @click="createProject">Create Project</button>
        </div>

        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>

        <div class="mt-5 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="text-left py-3 px-3">Title</th>
                <th class="text-left py-3 px-3">Status</th>
                <th class="text-left py-3 px-3">Budget</th>
                <th class="text-left py-3 px-3">Start</th>
                <th class="text-left py-3 px-3">End</th>
                <th class="text-left py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in projects" :key="p.id" class="border-t">
                <td class="py-3 px-3"><input class="input" v-model="p.title" /></td>
                <td class="py-3 px-3">
                  <select class="input" v-model="p.status">
                    <option>planned</option>
                    <option>active</option>
                    <option>completed</option>
                  </select>
                </td>
                <td class="py-3 px-3"><input class="input" type="number" v-model.number="p.budget" /></td>
                <td class="py-3 px-3"><input class="input" type="date" v-model="p.startDate" /></td>
                <td class="py-3 px-3"><input class="input" type="date" v-model="p.endDate" /></td>
                <td class="py-3 px-3 flex gap-2">
                  <button class="btn-primary" @click="save(p)">Save</button>
                  <button class="btn-outline" @click="removeProject(p)">Delete</button>
                  <button class="btn-outline" @click="select(p)">Tasks</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card p-6">
        <div class="text-lg font-bold text-slate-900">Project Tasks</div>
        <div v-if="!selected" class="mt-3 text-sm text-slate-500">Select a project to view tasks.</div>

        <div v-else class="mt-4">
          <div class="text-sm font-semibold text-slate-900">{{ selected.title }}</div>
          <div class="mt-4 space-y-3">
            <div v-for="t in tasks" :key="t.id" class="border border-slate-100 rounded-2xl p-4">
              <div class="flex items-start justify-between">
                <div class="font-medium text-slate-900">{{ t.description }}</div>
                <span class="pill">{{ t.is_complete ? "done" : "open" }}</span>
              </div>
              <div class="mt-2 text-xs text-slate-500">
                Weight: {{ t.percentage_weight }}% • {{ t.start_date }} → {{ t.end_date }}
              </div>
            </div>

            <div v-if="tasks.length === 0" class="text-sm text-slate-500">No tasks found.</div>
          </div>
        </div>
      </div>
    </div>
  </AdminShell>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { api } from "../../api.js";
import AdminShell from "../../components/AdminShell.vue";

const projects = ref([]);
const selected = ref(null);
const tasks = ref([]);
const error = ref("");
const form = ref({ title: "", status: "planned", budget: 0, startDate: "", endDate: "" });

async function load() {
  const { data } = await api.get("/admin/projects");
  projects.value = data.projects;
}

async function createProject() {
  error.value = "";
  try {
    await api.post("/admin/projects", form.value);
    form.value = { title: "", status: "planned", budget: 0, startDate: "", endDate: "" };
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to create project";
  }
}

async function save(p) {
  error.value = "";
  try {
    await api.put(`/admin/projects/${p.id}`, p);
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to update project";
  }
}

async function removeProject(p) {
  error.value = "";
  try {
    await api.delete(`/admin/projects/${p.id}`);
    if (selected.value?.id === p.id) { selected.value = null; tasks.value = []; }
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to delete project";
  }
}

async function select(p) {
  selected.value = p;
  const { data } = await api.get(`/admin/projects/${p.id}/tasks`);
  tasks.value = data.tasks;
}

onMounted(load);
</script>
