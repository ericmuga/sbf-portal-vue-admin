<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <div class="hidden lg:block bg-gradient-to-br from-green-400 to-green-700 relative">
      <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_45%)]"></div>
      <div class="absolute bottom-10 left-10 text-white">
        <div class="text-4xl font-bold">Make yourself at home!</div>
        <div class="mt-2 text-white/80">Enter the OTP to continue</div>
      </div>
    </div>

    <div class="flex items-center justify-center p-6">
      <div class="card w-full max-w-md p-8">
        <div class="text-center">
          <div class="mx-auto h-12 w-12 rounded-2xl bg-amber-700/90"></div>
          <h1 class="mt-4 text-xl font-bold text-slate-900">Self-Service Portal</h1>
          <p class="mt-1 text-sm text-slate-500">Enter the One Time Password (OTP)</p>
        </div>

        <div class="mt-6">
          <div class="text-xs text-slate-500 mb-2">OTP</div>
          <input v-model="otp" class="input" placeholder="Enter OTP" maxlength="6" />
          <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
        </div>

        <div class="mt-6 space-y-3">
          <button class="btn-primary w-full" @click="verify">Verify OTP</button>
          <button class="btn-outline w-full" @click="resend">Resend OTP</button>
          <button class="btn-outline w-full" @click="back">Back</button>
        </div>

        <div class="mt-6 border-t border-slate-100 pt-5 text-center">
          <div class="text-xs text-slate-500">Contact Us</div>
          <div class="mt-1 text-xs text-slate-600">+254 (0) 20 2750 999 | +254 719 071 999</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const router = useRouter();
const auth = useAuthStore();

const otp = ref("");
const error = ref("");

async function verify() {
  error.value = "";
  try {
    await auth.verifyOtp(otp.value);
    // If user can access admin, take them to admin home; otherwise dashboard
    router.push(auth.can("admin.access") ? "/admin" : "/dashboard");
  } catch (e) {
    error.value = e?.response?.data?.error || "Failed to verify OTP";
  }
}

async function resend() {
  await auth.requestOtp();
}

function back() {
  router.push("/login");
}
</script>
