<template>
  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1100;">
    <div v-for="t in state.items" :key="t.id" class="toast show align-items-center text-bg-dark border-0 mb-2">
      <div class="d-flex">
        <div class="toast-body">
          <span :class="badgeClass(t.type)" class="me-2">{{ t.type?.toUpperCase() || 'INFO' }}</span>
          {{ t.text }}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="remove(t.id)"></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToasts } from '@/stores/toast';
const { state, remove } = useToasts();

const badgeClass = (type?: string) => {
  switch (type) {
    case 'success': return 'badge text-bg-success';
    case 'warning': return 'badge text-bg-warning';
    case 'danger':  return 'badge text-bg-danger';
    default:        return 'badge text-bg-info';
  }
};
</script>
