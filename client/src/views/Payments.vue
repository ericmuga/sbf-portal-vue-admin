<template>
  <AppShell>
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 card p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="text-lg font-bold text-slate-900">Multiple Payment</div>
            <div class="text-sm text-slate-500">Add one or more policies to the cart</div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="text-slate-500">
              <tr class="border-b">
                <th class="text-left py-3">Policy Number</th>
                <th class="text-left py-3">Product Description</th>
                <th class="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in policies" :key="p.policyNo" class="border-b last:border-b-0">
                <td class="py-4 font-medium text-slate-900">{{ p.policyNo }}</td>
                <td class="py-4 text-slate-700">{{ p.product }}</td>
                <td class="py-4">
                  <button class="btn-primary" @click="addToCart(p)">Initiate Payment</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center">🛒</div>
            <div class="text-lg font-bold text-slate-900">Cart</div>
          </div>
          <span class="pill">{{ cart.length }} item(s)</span>
        </div>

        <div v-if="cart.length === 0" class="text-center py-10">
          <div class="text-4xl">🛍️</div>
          <div class="mt-2 font-semibold text-slate-900">Your Cart is empty</div>
          <div class="mt-1 text-sm text-slate-500">
            You can pay for more than one policy using one transaction.
          </div>
        </div>

        <div v-else class="space-y-3">
          <div v-for="item in cart" :key="item.policyNo" class="border border-slate-100 rounded-2xl p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-slate-900">{{ item.policyNo }}</div>
                <div class="text-xs text-slate-500">{{ item.product }}</div>
              </div>
              <button class="text-slate-400 hover:text-red-600" @click="remove(item.policyNo)">✕</button>
            </div>

            <div class="mt-3">
              <label class="text-xs text-slate-500">Amount (KES)</label>
              <input class="input mt-1" type="number" min="0" v-model.number="item.amount" />
            </div>
          </div>

          <div class="border-t border-slate-100 pt-4">
            <div class="flex items-center justify-between text-sm">
              <div class="text-slate-500">Total</div>
              <div class="font-bold text-slate-900">KES {{ fmt(total) }}</div>
            </div>

            <button class="btn-gold w-full mt-4" :disabled="paying" @click="checkout">
              {{ paying ? "Processing..." : "Pay Now" }}
            </button>
            <p v-if="result" class="mt-2 text-sm text-slate-600">{{ result }}</p>
            <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api.js";
import AppShell from "../components/AppShell.vue";

const route = useRoute();

const policies = ref([]);
const cart = ref([]);
const paying = ref(false);
const result = ref("");
const error = ref("");

const total = computed(() => cart.value.reduce((s, i) => s + Number(i.amount || 0), 0));

function fmt(n) {
  return new Intl.NumberFormat().format(Number(n || 0));
}

function addToCart(p) {
  const exists = cart.value.find(x => x.policyNo === p.policyNo);
  if (exists) return;
  cart.value.push({ policyNo: p.policyNo, product: p.product, amount: p.premium || 0 });
}

function remove(policyNo) {
  cart.value = cart.value.filter(x => x.policyNo !== policyNo);
}

async function checkout() {
  error.value = "";
  result.value = "";
  paying.value = true;
  try {
    const { data } = await api.post("/payments/initiate", {
      method: "mpesa",
      items: cart.value.map(i => ({ policyNo: i.policyNo, amount: i.amount }))
    });
    result.value = `Payment initiated. Ref: ${data.reference} (demo)`;
    cart.value = [];
  } catch (e) {
    error.value = e?.response?.data?.error || "Payment failed";
  } finally {
    paying.value = false;
  }
}

onMounted(async () => {
  const { data } = await api.get("/policies");
  policies.value = data.policies;

  const preselect = route.query.policyNo;
  if (preselect) {
    const p = policies.value.find(x => x.policyNo === preselect);
    if (p) addToCart(p);
  }
});
</script>
