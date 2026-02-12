<template>
  <AppShell>
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-lg font-bold text-slate-900">Claims</div>
          <div class="text-sm text-slate-500">Submit and track your claims</div>
        </div>
        <button class="btn-gold" @click="open = true">Make A Claim</button>
      </div>

      <div class="mt-6">
        <div class="text-sm font-semibold text-slate-900">Previous claims</div>

        <div v-if="claims.length === 0" class="mt-6 grid place-items-center py-16 text-center">
          <div class="text-5xl">📋</div>
          <div class="mt-3 text-xl font-bold text-slate-900">No Claims Found</div>
          <div class="mt-1 text-sm text-slate-500">You haven’t submitted any claims yet.</div>
        </div>

        <div v-else class="mt-4 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="text-slate-500">
              <tr class="border-b">
                <th class="text-left py-3">Date</th>
                <th class="text-left py-3">Policy</th>
                <th class="text-left py-3">Type</th>
                <th class="text-left py-3">Amount</th>
                <th class="text-left py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in claims" :key="c.id" class="border-b last:border-b-0">
                <td class="py-4">{{ c.createdAt.slice(0,10) }}</td>
                <td class="py-4 font-medium text-slate-900">{{ c.policyNo }}</td>
                <td class="py-4">{{ c.type }}</td>
                <td class="py-4">KES {{ fmt(c.amount) }}</td>
                <td class="py-4"><span class="pill">{{ c.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Claim Modal -->
    <div v-if="open" class="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div class="card w-full max-w-xl p-6">
        <div class="flex items-center justify-between">
          <div class="text-lg font-bold text-slate-900">Make A Claim</div>
          <button class="text-slate-400 hover:text-slate-900" @click="open = false">✕</button>
        </div>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-slate-500">Policy</label>
            <select class="input mt-1" v-model="form.policyNo">
              <option value="" disabled>Select policy</option>
              <option v-for="p in policies" :key="p.policyNo" :value="p.policyNo">
                {{ p.policyNo }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-xs text-slate-500">Claim Type</label>
            <select class="input mt-1" v-model="form.type">
              <option value="" disabled>Select type</option>
              <option>Death</option>
              <option>Hospitalisation</option>
              <option>Maturity</option>
              <option>Other</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="text-xs text-slate-500">Description</label>
            <textarea class="input mt-1" rows="3" v-model="form.description" placeholder="Explain your claim..."></textarea>
          </div>
          <div>
            <label class="text-xs text-slate-500">Amount (KES)</label>
            <input class="input mt-1" type="number" min="0" v-model.number="form.amount" />
          </div>
        </div>

        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-700">{{ success }}</p>

        <div class="mt-6 flex justify-end gap-3">
          <button class="btn-outline" @click="open = false">Cancel</button>
          <button class="btn-primary" :disabled="saving" @click="submit">
            {{ saving ? "Submitting..." : "Submit Claim" }}
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { api } from "../api.js";
import AppShell from "../components/AppShell.vue";

const open = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");

const policies = ref([]);
const claims = ref([]);

const form = ref({
  policyNo: "",
  type: "",
  description: "",
  amount: 0
});

function fmt(n) {
  return new Intl.NumberFormat().format(Number(n || 0));
}

async function load() {
  const [p, c] = await Promise.all([api.get("/policies"), api.get("/claims")]);
  policies.value = p.data.policies;
  claims.value = c.data.claims;
}

async function submit() {
  error.value = "";
  success.value = "";
  if (!form.value.policyNo || !form.value.type) {
    error.value = "Policy and Claim Type are required.";
    return;
  }

  saving.value = true;
  try {
    await api.post("/claims", form.value);
    success.value = "Claim submitted successfully.";
    open.value = false;
    form.value = { policyNo: "", type: "", description: "", amount: 0 };
    await load();
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to submit claim";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
