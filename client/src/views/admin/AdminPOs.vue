<template>
  <AdminShell>
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-lg font-bold text-slate-900">Purchase Orders</div>
          <div class="text-sm text-slate-500">Laravel resource-style CRUD for POs</div>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-1 md:grid-cols-6 gap-3">
        <input v-model="form.poNumber" class="input" placeholder="PO Number" />
        <input v-model="form.vendor" class="input" placeholder="Vendor" />
        <input v-model="form.project" class="input" placeholder="Project" />
        <select v-model="form.status" class="input">
          <option>submitted</option>
          <option>approved</option>
          <option>rejected</option>
          <option>paid</option>
        </select>
        <input v-model.number="form.total" class="input" type="number" placeholder="Total" />
        <button class="btn-primary" @click="createPo">Create PO</button>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>

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
              <th class="text-left py-3 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="po in pos" :key="po.id" class="border-t">
              <td class="py-3 px-3"><input class="input" v-model="po.poNumber" /></td>
              <td class="py-3 px-3"><input class="input" v-model="po.vendor" /></td>
              <td class="py-3 px-3"><input class="input" v-model="po.project" /></td>
              <td class="py-3 px-3">
                <select class="input" v-model="po.status">
                  <option>submitted</option>
                  <option>approved</option>
                  <option>rejected</option>
                  <option>paid</option>
                </select>
              </td>
              <td class="py-3 px-3"><input class="input" type="number" v-model.number="po.total" /></td>
              <td class="py-3 px-3">{{ po.createdAt?.slice(0,10) }}</td>
              <td class="py-3 px-3 flex gap-2">
                <button class="btn-primary" @click="save(po)">Save</button>
                <button class="btn-outline" @click="removePo(po)">Delete</button>
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

const pos = ref([]);
const error = ref("");
const form = ref({ poNumber: "", vendor: "", project: "", status: "submitted", total: 0 });

async function load() {
  const { data } = await api.get("/admin/purchase-orders");
  pos.value = data.purchaseOrders;
}

async function createPo() {
  error.value = "";
  try {
    await api.post("/admin/purchase-orders", form.value);
    form.value = { poNumber: "", vendor: "", project: "", status: "submitted", total: 0 };
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to create PO";
  }
}

async function save(po) {
  error.value = "";
  try {
    await api.put(`/admin/purchase-orders/${po.id}`, po);
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to update PO";
  }
}

async function removePo(po) {
  error.value = "";
  try {
    await api.delete(`/admin/purchase-orders/${po.id}`);
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to delete PO";
  }
}

onMounted(load);
</script>
