<template>
  <AdminShell>
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-lg font-bold text-slate-900">Purchase Orders</div>
          <div class="text-sm text-slate-500">PO tracking and approvals (demo)</div>
        </div>
      </div>

      <div class="mt-5 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="text-left py-3 px-3">PO No</th>
              <th class="text-left py-3 px-3">Vendor</th>
              <th class="text-left py-3 px-3">Project</th>
              <th class="text-left py-3 px-3">Status</th>
              <th class="text-left py-3 px-3">Total</th>
              <th class="text-left py-3 px-3">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="po in pos" :key="po.id" class="border-t">
              <td class="py-4 px-3 font-medium text-slate-900">{{ po.poNumber }}</td>
              <td class="py-4 px-3">{{ po.vendor }}</td>
              <td class="py-4 px-3">{{ po.project }}</td>
              <td class="py-4 px-3"><span class="pill">{{ po.status }}</span></td>
              <td class="py-4 px-3">KES {{ fmt(po.total) }}</td>
              <td class="py-4 px-3">{{ po.createdAt.slice(0,10) }}</td>
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

const pos = ref([]);
function fmt(n) { return new Intl.NumberFormat().format(Number(n || 0)); }

onMounted(async () => {
  const { data } = await api.get("/admin/pos");
  pos.value = data.purchaseOrders;
});
</script>
