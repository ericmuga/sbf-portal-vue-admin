<template>
  <AdminShell>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card p-5" v-for="s in statCards" :key="s.label">
        <div class="text-xs text-slate-500">{{ s.label }}</div>
        <div class="mt-2 text-2xl font-extrabold text-slate-900">{{ s.value }}</div>
      </div>
    </div>

    <div class="mt-6 card p-6">
      <div class="text-lg font-bold text-slate-900">Role-based access</div>
      <div class="text-sm text-slate-500 mt-1">
        Menu items and actions are shown based on your role permissions (Admin / Finance / Project Manager).
      </div>

      <div class="mt-4 text-sm">
        <div class="font-semibold">Your permissions:</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <span v-for="p in permissions" :key="p" class="pill">{{ p }}</span>
        </div>
      </div>
    </div>
  </AdminShell>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { api } from "../../api.js";
import { useAuthStore } from "../../stores/auth.js";
import AdminShell from "../../components/AdminShell.vue";

const auth = useAuthStore();
const permissions = computed(() => auth.permissions);

const stats = ref({ users: 0, payments: 0, pos: 0, projects: 0 });

const statCards = computed(() => ([
  { label: "Users", value: stats.value.users },
  { label: "Payments", value: stats.value.payments },
  { label: "Purchase Orders", value: stats.value.pos },
  { label: "Projects", value: stats.value.projects }
]));

onMounted(async () => {
  const { data } = await api.get("/admin/summary");
  stats.value = data.stats;
});
</script>
