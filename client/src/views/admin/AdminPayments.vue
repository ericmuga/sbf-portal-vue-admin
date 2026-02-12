<template>
  <AdminShell>
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-lg font-bold text-slate-900">Payments</div>
          <div class="text-sm text-slate-500">Customer & Vendor payment records (demo)</div>
        </div>
      </div>

      <div class="mt-5 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="text-left py-3 px-3">Reference</th>
              <th class="text-left py-3 px-3">Type</th>
              <th class="text-left py-3 px-3">Method</th>
              <th class="text-left py-3 px-3">Amount</th>
              <th class="text-left py-3 px-3">Status</th>
              <th class="text-left py-3 px-3">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p.id" class="border-t">
              <td class="py-4 px-3 font-medium text-slate-900">{{ p.reference }}</td>
              <td class="py-4 px-3">{{ p.type }}</td>
              <td class="py-4 px-3">{{ p.method }}</td>
              <td class="py-4 px-3">KES {{ fmt(p.amount) }}</td>
              <td class="py-4 px-3"><span class="pill">{{ p.status }}</span></td>
              <td class="py-4 px-3">{{ p.createdAt.slice(0,10) }}</td>
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

const payments = ref([]);

function fmt(n) { return new Intl.NumberFormat().format(Number(n || 0)); }

onMounted(async () => {
  const { data } = await api.get("/admin/payments");
  payments.value = data.payments;
});
</script>
