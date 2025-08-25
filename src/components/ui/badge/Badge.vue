<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { BadgeVariants } from ".";
import { cn } from "@/lib/utils";
import { badgeVariants } from ".";

const props = defineProps<{
  variant?: BadgeVariants["variant"];
  textColor?: BadgeVariants["textColor"];
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div :class="cn(badgeVariants({ variant, textColor }), props.class)">
    <slot />
  </div>
</template>
