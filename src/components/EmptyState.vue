<template>
  <div class="text-center text-muted p-4 border rounded">
    <div class="display-6">🪄</div>
    <div class="mt-2">{{ title }}</div>
    <div class="small">{{ subtitle }}</div>
    <div class="mt-3" v-if="$slots.actions"><slot name="actions" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>
