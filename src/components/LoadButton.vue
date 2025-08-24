<template>
  <button :class="['btn', variant]" :disabled="loading || disabled" @click="onClick">
    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{ loading?: boolean; disabled?: boolean; variant?: string }>();
const emit = defineEmits<{ (e:'click'): void }>();
const onClick = () => emit('click');
</script>
