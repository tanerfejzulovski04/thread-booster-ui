<template>
  <div class="card h-100">
    <div class="card-body">
      <p class="card-text" style="white-space: pre-line;">{{ text }}</p>
      <button class="btn btn-sm btn-outline-secondary" @click="copy">Copy</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ text: string }>();
const copy = async () => {
  await navigator.clipboard.writeText(props.text);
  alert('Copied!');
};
</script>
