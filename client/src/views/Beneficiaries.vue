<template>
  <AppShell>
    <div class="space-y-6">
      <div class="card p-6">
        <div class="text-xl font-bold text-slate-900">Select Policy</div>
        <div class="text-sm text-slate-500">Please select the policy you wish to view beneficiaries</div>

        <div class="mt-4 flex flex-col md:flex-row gap-3 md:items-center">
          <select class="input md:max-w-sm" v-model="policyNo">
            <option value="" disabled>Select policy</option>
            <option v-for="p in policies" :key="p.policyNo" :value="p.policyNo">
              {{ p.policyNo }}
            </option>
          </select>
          <button class="btn-gold md:w-auto" :disabled="!policyNo || loading" @click="loadBeneficiaries">
            {{ loading ? "Loading..." : "Show Beneficiaries" }}
          </button>
        </div>
      </div>

      <div class="card p-6">
        <div class="text-lg font-bold text-amber-800">Beneficiaries</div>
        <div v-if="selectedProduct" class="mt-2 text-sm text-slate-600">
          <span class="font-semibold text-amber-800">{{ selectedProduct }}</span>
          <span class="text-slate-500"> — Policy Number: </span>
          <span class="font-medium text-slate-900">{{ policyNo }}</span>
        </div>

        <div class="mt-6 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="text-left py-3 px-3">Beneficiary Name</th>
                <th class="text-left py-3 px-3">Relationship</th>
                <th class="text-left py-3 px-3">ID Number</th>
                <th class="text-left py-3 px-3">KRA PIN</th>
                <th class="text-left py-3 px-3">Percentage Share</th>
                <th class="text-left py-3 px-3">Postal Address</th>
                <th class="text-left py-3 px-3">Physical Address</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="rows.length === 0" class="border-t">
                <td class="py-6 px-3 text-slate-500" colspan="7">No beneficiaries found for this policy.</td>
              </tr>
              <tr v-for="b in rows" :key="b.name" class="border-t">
                <td class="py-4 px-3 font-medium text-slate-900">{{ b.name }}</td>
                <td class="py-4 px-3">{{ b.relationship }}</td>
                <td class="py-4 px-3">{{ b.idNumber }}</td>
                <td class="py-4 px-3">{{ b.kraPin }}</td>
                <td class="py-4 px-3">{{ b.share.toFixed(2) }} %</td>
                <td class="py-4 px-3">{{ b.postal }}</td>
                <td class="py-4 px-3">{{ b.physical }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { api } from "../api.js";
import AppShell from "../components/AppShell.vue";

const policies = ref([]);
const policyNo = ref("");
const rows = ref([]);
const loading = ref(false);

const selectedProduct = computed(() => policies.value.find(p => p.policyNo === policyNo.value)?.product || "");

async function loadPolicies() {
  const { data } = await api.get("/policies");
  policies.value = data.policies;
  policyNo.value = data.policies?.[0]?.policyNo || "";
}

async function loadBeneficiaries() {
  if (!policyNo.value) return;
  loading.value = true;
  try {
    const { data } = await api.get("/beneficiaries", { params: { policyNo: policyNo.value } });
    rows.value = data.beneficiaries;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadPolicies();
  await loadBeneficiaries();
});
</script>
