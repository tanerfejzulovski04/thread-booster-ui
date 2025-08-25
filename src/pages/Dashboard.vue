<!-- src/pages/Dashboard.vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center flex-wrap gap-4 mb-6">
      <h3 class="text-2xl font-bold">Dashboard</h3>
      <div class="flex flex-wrap gap-2">
      </div>
    </div>

    <!-- Analytics Tiles -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Skeleton class="h-32" v-for="n in 4" :key="n" />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="text-center">
        <CardHeader>
          <CardTitle class="text-sm text-muted-foreground">Account Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-4xl font-semibold">{{ tiles.account_score ?? '—' }}</div>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardHeader>
          <CardTitle class="text-sm text-muted-foreground">Followers</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-4xl font-semibold">{{ tiles.followers ?? '—' }}</div>
          <div :class="['text-sm', (tiles.followers_delta ?? 0) >= 0 ? 'text-green-600' : 'text-red-600']">
            {{ (tiles.followers_delta ?? 0) >= 0 ? '+' : '' }}{{ tiles.followers_delta ?? 0 }} today
          </div>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardHeader>
          <CardTitle class="text-sm text-muted-foreground">Posts (7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-4xl font-semibold">{{ tiles.posts_last_7 ?? 0 }}</div>
        </CardContent>
      </Card>
      <Card class="text-center">
        <CardHeader>
          <CardTitle class="text-sm text-muted-foreground">Best Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="tiles.best_time_hours?.length" class="font-semibold">
            <span v-for="(h, i) in tiles.best_time_hours" :key="i" class="mr-2">
              {{ h.hour }}:00 (avg {{ h.avg }})
            </span>
          </div>
          <div v-else class="text-sm text-muted-foreground">—</div>
        </CardContent>
      </Card>
    </div>

    <!-- X Account -->
    <Card class="mb-6">
      <CardContent class="flex justify-between items-center pt-6">
        <div class="flex items-center">
          <Avatar v-if="x.avatar" class="mr-2">
            <AvatarImage :src="x.avatar" alt="avatar" />
            <AvatarFallback>{{ x.handle?.charAt(0) || 'X' }}</AvatarFallback>
          </Avatar>
          <div>
            <div class="font-semibold">X Account</div>
            <div class="text-sm text-muted-foreground">
              <span v-if="x.connected">
                Connected <span v-if="x.handle">as <strong>@{{ x.handle }}</strong></span>
              </span>
              <span v-else>Not connected</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <Button
            :variant="x.connected ? 'outline' : 'default'"
            :disabled="xLoading"
            @click="connectX"
          >
            <span v-if="xLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ x.connected ? 'Reconnect' : 'Connect X' }}
          </Button>
          <Button
            v-if="x.connected"
            variant="destructive"
            :disabled="xLoading"
            @click="disconnectX"
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Quick Actions -->
    <Card>
      <CardContent class="flex flex-wrap gap-2 items-center pt-6">
        <Button :disabled="syncing" @click="syncTweets">
          {{ syncing ? 'Syncing…' : 'Sync Recent Tweets' }}
        </Button>
        <Button as-child variant="outline">
          <router-link to="/compose">Open Composer</router-link>
        </Button>
        <Button as-child variant="outline">
          <router-link to="/engage">Find Reply Targets</router-link>
        </Button>
        <Button as-child variant="outline">
          <router-link to="/drafts">Schedule a Post</router-link>
        </Button>
        <span v-if="syncMsg" class="ml-2 text-sm text-muted-foreground">{{ syncMsg }}</span>
        <span v-if="error" class="ml-2 text-sm text-red-600">{{ error }}</span>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import api from '@/api/http';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToasts } from '@/stores/toast';

const loading = ref(true);
const tiles = ref<any>({});
const syncing = ref(false);
const syncMsg = ref('');
const error = ref('');
const { add } = useToasts();
const x = ref<{ connected: boolean; handle: string | null; avatar: string | null }>({
  connected: false,
  handle: null,
  avatar: null,
});
const xLoading = ref(false);

const loadTiles = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/api/analytics/dashboard');
    tiles.value = data || {};
  } catch (e: any) {
    console.warn('analytics/dashboard failed', e?.response?.data || e);
  } finally {
    loading.value = false;
  }
};

const syncTweets = async () => {
  syncing.value = true;
  syncMsg.value = '';
  error.value = '';
  try {
    const { data } = await api.post('/api/tweets/sync');
    syncMsg.value = `Synced ${data.synced ?? 0} tweets.`;
    await loadTiles();
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to sync tweets';
  } finally {
    syncing.value = false;
  }
};

const loadX = async () => {
  try {
    const { data: c } = await api.get('/api/auth/x/connected');
    const { data: me } = await api.get('/api/me');
    x.value = {
      connected: !!c.connected,
      handle: me?.user?.x_handle ?? null,
      avatar: me?.user?.x_avatar ?? null,
    };
  } catch {
    x.value = { connected: false, handle: null, avatar: null };
  }
};

const connectX = async () => {
  xLoading.value = true;
  try {
    const { data } = await api.get('/api/auth/x/redirect');
    window.location.href = data.url;
  } finally {
    xLoading.value = false;
  }
};

const disconnectX = async () => {
  xLoading.value = true;
  try {
    await api.post('/api/auth/x/disconnect');
    await loadX();
  } finally {
    xLoading.value = false;
  }
};

const checkOAuthReturn = async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('x') === 'connected') {
    await loadX();
    params.delete('x');
    const clean = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}${window.location.hash}`;
    window.history.replaceState({}, '', clean);
  }
};

onMounted(async () => {
  loadTiles();
  await loadX();
  await checkOAuthReturn();
});
</script>

<style scoped>
/* Minimal scoped styles; shadcn-vue and Tailwind handle most styling */
</style>
