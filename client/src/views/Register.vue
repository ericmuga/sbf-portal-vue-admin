<template>
  <div class="min-h-screen grid place-items-center p-6 bg-slate-50">
    <div class="card w-full max-w-md p-8">
      <h1 class="text-2xl font-bold text-slate-900">Create an Account</h1>
      <p class="mt-1 text-sm text-slate-500">Register to access the SOBA Fund self-service portal.</p>

      <div class="mt-6 space-y-4">
        <div>
          <label class="text-sm font-semibold text-slate-700">Full Name</label>
          <input v-model="name" class="mt-2 input" placeholder="Your full name" />
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-700">Email</label>
          <input v-model="email" class="mt-2 input" placeholder="email@domain.com" />
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-700">Password</label>
          <input v-model="password" type="password" class="mt-2 input" placeholder="Enter password" />
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-700">Confirm Password</label>
          <input v-model="confirmPassword" type="password" class="mt-2 input" placeholder="Confirm password" />
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="text-sm text-emerald-600">{{ success }}</p>

        <button class="btn-primary w-full" :disabled="loading" @click="submit">
          {{ loading ? "Creating account..." : "Create Account" }}
        </button>

        <button class="btn-outline w-full" @click="router.push('/login')">Back to Login</button>
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

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");
const success = ref("");

async function submit() {
  error.value = "";
  success.value = "";

  if (!name.value || !email.value || !password.value) {
    error.value = "Name, email, and password are required.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  loading.value = true;
  try {
    await auth.register(name.value, email.value, password.value);
    success.value = "Account created successfully. Please login.";
    setTimeout(() => router.push("/login"), 1000);
  } catch (e) {
    error.value = e?.response?.data?.error || "Registration failed";
  } finally {
    loading.value = false;
  }
}
</script>
