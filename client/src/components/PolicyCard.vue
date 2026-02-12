<template>
  <div class="card overflow-hidden">
    <div class="p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-[11px] uppercase tracking-wide text-slate-500">Policy</div>
          <div class="text-sm font-semibold text-slate-900">{{ policy.policyNo }}</div>
        </div>
        <span class="pill">{{ policy.status }}</span>
      </div>

      <div class="mt-3 text-sm font-semibold text-amber-800">{{ policy.product }}</div>

      <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="text-xs text-slate-500">Sum Assured</div>
          <div class="font-semibold text-slate-900">KES {{ fmt(policy.sumAssured) }}</div>
        </div>
        <div>
          <div class="text-xs text-slate-500">Premium</div>
          <div class="font-semibold text-slate-900">KES {{ fmt(policy.premium) }}</div>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
        <div>
          <div class="text-slate-500">Period From</div>
          <div class="font-medium">{{ policy.periodFrom }}</div>
        </div>
        <div class="text-right">
          <div class="text-slate-500">Period To</div>
          <div class="font-medium">{{ policy.periodTo }}</div>
        </div>
      </div>

      <div class="mt-5">
        <button class="btn-gold w-full" @click="$emit('pay', policy)">Make Payment</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ policy: { type: Object, required: true } });

function fmt(n) {
  return new Intl.NumberFormat().format(Number(n || 0));
}
</script>
