<template>
  <AdminShell>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card p-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-bold text-slate-900">Projects</div>
            <div class="text-sm text-slate-500">Projects and milestone task tracking</div>
          </div>
        </div>

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
                <td class="py-4 px-3 font-medium text-slate-900">{{ p.title }}</td>
                <td class="py-4 px-3"><span class="pill">{{ p.status }}</span></td>
                <td class="py-4 px-3">KES {{ fmt(p.budget) }}</td>
                <td class="py-4 px-3">{{ p.startDate }}</td>
                <td class="py-4 px-3">{{ p.endDate }}</td>
                <td class="py-4 px-3">
                  <button class="btn-outline" @click="select(p)">View Tasks</button>
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
          <div class="text-xs text-slate-500">Progress is inferred from task completion</div>

          <div class="mt-4 space-y-3">
            <div v-for="t in tasks" :key="t.id" class="border border-slate-100 rounded-2xl p-4">
              <div class="flex items-start justify-between">
                <div class="font-medium text-slate-900">{{ t.description }}</div>
                <span class="pill">{{ t.isComplete ? "done" : "open" }}</span>
              </div>
              <div class="mt-2 text-xs text-slate-500">
                Weight: {{ t.percentageWeight }}% • {{ t.startDate }} → {{ t.endDate }}
              </div>
              <div class="mt-1 text-xs text-slate-600">Assigned to: {{ t.assignedTo }}</div>
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

function fmt(n) { return new Intl.NumberFormat().format(Number(n || 0)); }

async function load() {
  const { data } = await api.get("/admin/projects");
  projects.value = data.projects;
}

async function select(p) {
  selected.value = p;
  const { data } = await api.get(`/admin/projects/${p.id}/tasks`);
  tasks.value = data.tasks;
}

onMounted(load);
</script>
