<!-- src/components/AppSidebar.vue -->
<template>
  <Sidebar>
    <SidebarHeader>
      <div class="p-4 text-xl font-bold">Thread Booster</div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in menuItems" :key="item.title">
              <SidebarMenuButton as-child :isActive="isActive(item.url)">
                <router-link :to="item.url">
                  <component :is="item.icon" class="mr-2 h-4 w-4" />
                  <span>{{ item.title }}</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <div class="p-4 text-sm text-muted-foreground">© 2025 Thread Booster</div>
    </SidebarFooter>
  </Sidebar>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Edit,
  MessageSquare,
  Bell,
  MessageCircle,
  FileText,
  CreditCard,
} from 'lucide-vue-next';

const route = useRoute();

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Compose',
    url: '/compose',
    icon: Edit,
  },
  {
    title: 'Engage',
    url: '/engage',
    icon: MessageCircle,
  },
  {
    title: 'My Tweets',
    url: '/my-tweets',
    icon: MessageSquare,
  },
  {
    title: 'Drafts',
    url: '/drafts',
    icon: FileText,
  },
  {
    title: 'Alerts',
    url: '/alerts',
    icon: Bell,
  },
  {
    title: 'Plan & Usage',
    url: '/billing',
    icon: CreditCard,
  },
];

const isActive = (url: string) => computed(() => route.path === url);
</script>
