<!-- src/App.vue -->
<template>
  <SidebarProvider>
    <AppSidebar />
    <div class="flex flex-1 flex-col">
      <header class="sticky top-0 z-10 bg-background shadow">
        <div class="flex h-12 items-center px-4">
          <SidebarTrigger class="mr-4" />
          <!-- Add other header content if needed, e.g., user profile -->
        </div>
      </header>
      <main class="flex-1 p-4">
        <router-view />
      </main>
    </div>
    <ToastHost />
  </SidebarProvider>
</template>

<script setup lang="ts">
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar.vue';
import ToastHost from '@/components/ToastHost.vue';
</script>

<style>
html, body, #app {
  height: 100%;
}
</style>
