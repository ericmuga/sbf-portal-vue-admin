<template>
  <div class="grid h-screen grid-cols-1">
    <!-- Right login card -->
    <div class="flex items-center justify-center p-6 bg-white">
      <div class="w-full max-w-md">
        <div class="card bg-[#0b63c6] text-white p-8">
          <div class="text-center">
            <div class="grid mx-auto text-2xl h-14 w-14 rounded-2xl bg-white/15 place-items-center">🦁</div>
            <div class="mt-4 text-2xl font-extrabold">SOBA Fund</div>
            <div class="-mt-1 text-sm tracking-widest opacity-90"></div>
          </div>

          <div class="mt-6 text-sm text-center text-white/90">
            Welcome to the Self service portal where you can keep up with all your plans
          </div>

          <div class="mt-4 text-sm text-center">
            Are you new here? <a class="font-semibold underline" href="#" @click.prevent="router.push('/login/register')"> Create an Account</a>
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

            <div class="relative py-1">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/30"></div></div>
              <div class="relative flex justify-center text-xs uppercase"><span class="px-2 bg-[#0b63c6] text-white/80">Or</span></div>
            </div>

            <button class="w-full py-3 font-semibold transition bg-white rounded-xl text-slate-900 hover:bg-slate-100" :disabled="loading" @click="googleLogin">
              Continue with Google
            </button>
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
import { ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const router = useRouter();
const auth = useAuthStore();

const email = ref("admin@sbf.test");
const password = ref("Pass123!");
const loading = ref(false);
const error = ref("");

function googleLogin() {
  auth.startGoogleLogin();
}

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
