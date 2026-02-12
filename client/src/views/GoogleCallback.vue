<template>
  <div class="min-h-screen grid place-items-center p-6">
    <div class="card w-full max-w-md p-8 text-center">
      <h1 class="text-xl font-bold text-slate-900">Signing you in with Google...</h1>
      <p class="mt-2 text-sm text-slate-500">Please wait.</p>
      <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const error = ref("");

onMounted(async () => {
  const accessToken = route.query.accessToken;
  if (!accessToken || typeof accessToken !== "string") {
    error.value = "Missing Google access token.";
    setTimeout(() => router.replace("/login"), 1200);
    return;
  }

  try {
    await auth.completeGoogleLogin(accessToken);
    router.replace(auth.can("admin.access") ? "/admin" : "/dashboard");
  } catch (e) {
    error.value = e?.response?.data?.error || "Google login failed";
    setTimeout(() => router.replace("/login"), 1500);
  }
});
</script>
