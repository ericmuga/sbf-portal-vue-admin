<template>
  <AppShell>
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <div class="card p-6 flex items-center justify-between">
          <div>
            <div class="text-sm text-slate-500">Hi {{ user?.name }},</div>
            <div class="text-xl font-bold text-slate-900">Welcome to the Self Service Portal</div>
          </div>
          <div class="text-right">
            <div class="text-xs text-slate-500">Time</div>
            <div class="text-lg font-semibold text-slate-900">{{ time }}</div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-lg font-bold text-slate-900">My Portfolio</div>
            <div class="text-sm text-slate-500">Your active products at a glance</div>
          </div>
          <button class="btn-outline" @click="refresh">Refresh</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <PolicyCard v-for="p in policies" :key="p.policyNo" :policy="p" @pay="goPay" />
        </div>
      </div>

      <div class="space-y-4">
        <button class="card p-5 w-full flex items-center justify-between hover:bg-slate-50 transition" @click="goClaims">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center">📎</div>
            <div class="text-left">
              <div class="font-semibold text-slate-900">Make A Claim</div>
              <div class="text-xs text-slate-500">Submit a new claim</div>
            </div>
          </div>
          <div class="text-amber-700 font-bold">›</div>
        </button>

        <button class="card p-5 w-full flex items-center justify-between hover:bg-slate-50 transition" @click="goPayments">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center">💳</div>
            <div class="text-left">
              <div class="font-semibold text-slate-900">Make Payment</div>
              <div class="text-xs text-slate-500">Pay for one or multiple policies</div>
            </div>
          </div>
          <div class="text-amber-700 font-bold">›</div>
        </button>

        <button class="card p-5 w-full flex items-center justify-between hover:bg-slate-50 transition" @click="goBeneficiaries">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-slate-100 grid place-items-center">👥</div>
            <div class="text-left">
              <div class="font-semibold text-slate-900">Beneficiaries</div>
              <div class="text-xs text-slate-500">View beneficiaries per policy</div>
            </div>
          </div>
          <div class="text-amber-700 font-bold">›</div>
        </button>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api.js";
import { useAuthStore } from "../stores/auth.js";
import AppShell from "../components/AppShell.vue";
import PolicyCard from "../components/PolicyCard.vue";

const router = useRouter();
const auth = useAuthStore();
const user = computed(() => auth.user);

const policies = ref([]);
const time = ref("");

function tick() {
  const d = new Date();
  time.value = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

async function load() {
  const { data } = await api.get("/policies");
  policies.value = data.policies.slice(0, 2); // mimic screenshot: show 2 cards
}

async function refresh() {
  await load();
}

function goPay(policy) {
  router.push({ path: "/payments", query: { policyNo: policy.policyNo } });
}
function goClaims() { router.push("/claims"); }
function goPayments() { router.push("/payments"); }
function goBeneficiaries() { router.push("/beneficiaries"); }

onMounted(async () => {
  tick();
  setInterval(tick, 1000);
  await load();
});
</script>
