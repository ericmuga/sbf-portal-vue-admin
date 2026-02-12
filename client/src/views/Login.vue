<template>
  <div class="grid min-h-screen grid-cols-1 lg:grid-cols-2">
    <!-- Left promo panel (ICEA-style) -->
    <div class="hidden lg:block bg-[#0aa5a0] relative overflow-hidden">
      <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]"></div>

      <div class="absolute top-8 left-8">
        <div class="grid w-10 h-10 font-black text-white rounded-2xl bg-white/20 place-items-center">🦁</div>
        <div class="mt-2 font-semibold tracking-wide text-white">ICEA LION GROUP</div>
      </div>

      <div class="absolute left-10 top-40 right-10">
        <div class="text-4xl font-extrabold leading-tight text-white">
          DOWNLOAD THE <span class="text-amber-300">SOBA Fund </span><br />
          <span class="text-amber-300">CLIENT APP</span> AND ACCESS<br />
          OUR SERVICES WITH EASE!
        </div>

        <div class="grid max-w-md grid-cols-2 gap-6 mt-8">
          <div class="p-4 bg-white rounded-2xl shadow-soft">
            <div class="grid h-32 bg-slate-100 rounded-xl place-items-center text-slate-400">QR</div>
            <div class="mt-3 text-sm font-semibold text-center text-slate-900">Android</div>
          </div>
          <div class="p-4 bg-white rounded-2xl shadow-soft">
            <div class="grid h-32 bg-slate-100 rounded-xl place-items-center text-slate-400">QR</div>
            <div class="mt-3 text-sm font-semibold text-center text-slate-900">iOS</div>
          </div>
        </div>
      </div>

      <div class="absolute font-semibold bottom-6 left-10 text-white/90">#ConvenienceMkononi</div>
    </div>

    <!-- Right login card -->
    <div class="flex items-center justify-center p-6 bg-white">
      <div class="w-full max-w-md">
        <div class="card bg-[#0b63c6] text-white p-8">
          <div class="text-center">
            <div class="grid mx-auto text-2xl h-14 w-14 rounded-2xl bg-white/15 place-items-center">🦁</div>
            <div class="mt-4 text-2xl font-extrabold">SOBA Fund</div>
            <div class="-mt-1 text-sm tracking-widest opacity-90">GROUP</div>
          </div>

          <div class="mt-6 text-sm text-center text-white/90">
            Welcome to the Self service portal where you can keep up with all your plans
          </div>

          <div class="mt-4 text-sm text-center">
            Are you new here? <a class="font-semibold underline" href="#" @click.prevent> Create an Account</a>
          </div>

          <div class="mt-6 space-y-4">
            <div>
              <label class="text-sm font-semibold">Email Address</label>
              <input v-model="email" class="mt-2 input text-slate-900" placeholder="email@domain.com" />
            </div>
            <div>
              <label class="text-sm font-semibold">Password</label>
              <input v-model="password" type="password" class="mt-2 input text-slate-900" placeholder="Enter your password" />
            </div>

            <div class="flex items-center justify-between text-sm">
              <a class="underline" href="#" @click.prevent>Forgot password?</a>
              <span class="text-xs opacity-90">Demo: admin@sbf.test / Pass123!</span>
            </div>

            <button class="w-full py-3 font-semibold transition rounded-xl bg-black/90 hover:bg-black" :disabled="loading" @click="submit">
              {{ loading ? "Please wait..." : "Login" }}
            </button>

            <p v-if="error" class="text-sm text-amber-200">{{ error }}</p>
          </div>
        </div>

        <div class="mt-6 text-center">
          <div class="font-semibold text-slate-900">Contact Us</div>
          <div class="mt-2 text-sm text-slate-600">+254 (0) 20 2750 999 | +254 719 071 999 | +254 730 151 999</div>
          <div class="mt-2 text-xs text-slate-500">
            Demo roles: admin@sbf.test, finance@sbf.test, pm@sbf.test, member@sbf.test (Pass123!)
          </div>
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

const email = ref("admin@sbf.test");
const password = ref("Pass123!");
const loading = ref(false);
const error = ref("");

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    const res = await auth.login(email.value, password.value);
    // credentials ok -> go to OTP page
    if (res.otpRequired) {
      router.push("/login/otp");
    } else {
      router.push("/dashboard");
    }
  } catch (e) {
    error.value = e?.response?.data?.error || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>
