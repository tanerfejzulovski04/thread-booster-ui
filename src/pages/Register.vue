<template>
  <div class="container" style="max-width:420px; margin-top:10vh;">
    <h2>Register</h2>
    <form @submit.prevent="submit">
      <div class="mb-3">
        <label>Name</label>
        <input v-model="name" type="text" class="form-control" required />
      </div>
      <div class="mb-3">
        <label>Email</label>
        <input v-model="email" type="email" class="form-control" required />
      </div>
      <div class="mb-3">
        <label>Password</label>
        <input v-model="password" type="password" class="form-control" required minlength="8" />
      </div>
      <button class="btn btn-primary w-100" :disabled="auth.loading">Create account</button>
      <p class="mt-3">Have an account? <router-link to="/login">Login</router-link></p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/stores/auth';

const name = ref('');
const email = ref('');
const password = ref('');
const auth = useAuth();

const submit = async () => {
  await auth.register(name.value, email.value, password.value);
  if (auth.user) location.href = '/dashboard';
};
</script>
