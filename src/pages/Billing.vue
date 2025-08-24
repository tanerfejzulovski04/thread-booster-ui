<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center">
      <h3>Plan & Usage</h3>
      <router-link to="/dashboard" class="btn btn-link">← Back</router-link>
    </div>

    <div class="card mt-3">
      <div class="card-body">
        <h5 class="card-title">Current Plan: <span class="badge text-bg-primary">{{ plan }}</span></h5>
        <div class="row mt-3">
          <div class="col-md-4"><strong>Generations today:</strong> {{ today.generations }} / {{ limits.generations_per_day ?? '∞' }}</div>
          <div class="col-md-4"><strong>Refreshes today:</strong> {{ today.refreshes }} / {{ limits.refreshes_per_day ?? '∞' }}</div>
          <div class="col-md-4"><strong>Posts today:</strong> {{ today.posts }} / {{ limits.posts_per_day ?? '∞' }}</div>
        </div>
      </div>
    </div>

    <div class="card mt-3">
      <div class="card-body">
        <h5 class="card-title">Upgrade</h5>
        <p class="text-muted">Want higher limits? Pick a plan and we’ll reach out.</p>
        <div class="d-flex gap-2">
          <select v-model="target" class="form-select" style="max-width: 220px;">
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
          <button class="btn btn-outline-primary" @click="request" :disabled="loading">{{ loading ? 'Sending…' : 'Request upgrade' }}</button>
        </div>
        <div v-if="msg" class="alert alert-success mt-3">{{ msg }}</div>
        <div v-if="err" class="alert alert-danger mt-3">{{ err }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import api from '@/api/http';

const plan = ref('free');
const limits = ref<Record<string, number>>({});
const today = ref({ generations: 0, refreshes: 0, posts: 0 });
const target = ref('basic');
const loading = ref(false);
const msg = ref('');
const err = ref('');

const load = async () => {
  const { data } = await api.get('/api/billing/me');
  plan.value = data.plan;
  limits.value = data.limits || {};
  today.value = data.today || today.value;
};

const request = async () => {
  loading.value = true; msg.value=''; err.value='';
  try {
    await api.post('/api/billing/request-upgrade', { target_plan: target.value });
    msg.value = 'Thanks! We’ll get back to you shortly.';
  } catch (e:any) {
    err.value = e?.response?.data?.message || 'Failed to send request';
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>
