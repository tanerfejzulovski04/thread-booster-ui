<template>
  <div v-if="rateLimitFlag" class="alert alert-warning d-flex justify-content-between align-items-center">
    <div>We’re cooling down due to rate limits. This may take a moment.</div>
    <button class="btn btn-sm btn-outline-secondary" @click="rateLimitFlag = false">Dismiss</button>
  </div>
</template>

<script setup lang="ts">
import { rateLimitFlag } from '@/stores/rateLimit';
</script>
