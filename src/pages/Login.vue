<template>
  <div class="container" style="max-width:420px; margin-top:10vh;">
    <h2>Login</h2>
    <form @submit.prevent="submit">
      <div class="mb-3">
        <label>Email</label>
        <input v-model="email" type="email" class="form-control" required />
      </div>
      <div class="mb-3">
        <label>Password</label>
        <input v-model="password" type="password" class="form-control" required />
      </div>
      <button class="btn btn-primary w-100" :disabled="auth.loading">Login</button>
      <p class="mt-3">No account? <router-link to="/register">Register</router-link></p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/stores/auth';

const email = ref('');
const password = ref('');
const auth = useAuth();

const submit = async () => {
  await auth.login(email.value, password.value);
  if (auth.user) location.href = '/dashboard';
};
</script>
