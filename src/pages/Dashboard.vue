<template>
  <div class="container py-4">
    <!-- Header + Nav -->
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <h3 class="mb-0">Dashboard</h3>
      <div class="d-flex flex-wrap gap-2">
        <router-link to="/compose" class="btn btn-outline-secondary">Compose</router-link>
        <router-link to="/engage" class="btn btn-outline-secondary">Engage</router-link>
        <router-link to="/my-tweets" class="btn btn-outline-secondary">My Tweets</router-link>
        <router-link to="/drafts" class="btn btn-outline-secondary">Drafts</router-link>
        <router-link to="/alerts" class="btn btn-outline-secondary">Alerts</router-link>
        <router-link to="/billing" class="btn btn-outline-secondary">Plan & Usage</router-link>
        <button
  v-if="!x.connected"
  class="btn btn-outline-secondary"
  :disabled="xLoading"
  @click="connectX"
>
  Connect X
</button>
      </div>
    </div>

    <!-- Tiles (loading) -->
    <div class="row g-3 mt-3" v-if="loading">
      <div class="col-md-3" v-for="n in 4" :key="n"><SkeletonCard /></div>
    </div>
    <!-- Analytics tiles (Week 8) -->
    <div v-else class="row g-3 mt-3">
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <div class="text-muted small">Account Score</div>
            <div class="display-6">{{ tiles.account_score ?? '—' }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <div class="text-muted small">Followers</div>
            <div class="display-6">{{ tiles.followers ?? '—' }}</div>
            <div :class="['small', (tiles.followers_delta ?? 0) >= 0 ? 'text-success' : 'text-danger']">
              {{ (tiles.followers_delta ?? 0) >= 0 ? '+' : '' }}{{ tiles.followers_delta ?? 0 }} today
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <div class="text-muted small">Posts (7d)</div>
            <div class="display-6">{{ tiles.posts_last_7 ?? 0 }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-center">
          <div class="card-body">
            <div class="text-muted small">Best Hours</div>
            <div v-if="tiles.best_time_hours?.length" class="fw-semibold">
              <span v-for="(h,i) in tiles.best_time_hours" :key="i" class="me-2">
                {{ h.hour }}:00 (avg {{ h.avg }})
              </span>
            </div>
            <div v-else class="text-muted small">—</div>
          </div>
        </div>
      </div>
    </div>

    <!-- X Account -->
<div class="card mt-3">
  <div class="card-body d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center">
      <img v-if="x.avatar" :src="x.avatar" alt="avatar" width="36" height="36" class="rounded me-2" />
      <div>
        <div class="fw-semibold">X Account</div>
        <div class="small text-muted" v-if="x.connected">
          Connected <span v-if="x.handle">as <strong>@{{ x.handle }}</strong></span>
        </div>
        <div class="small text-muted" v-else>Not connected</div>
      </div>
    </div>

    <div class="d-flex gap-2">
      <button v-if="!x.connected" class="btn btn-primary" :disabled="xLoading" @click="connectX">
        <span v-if="xLoading" class="spinner-border spinner-border-sm me-2"></span>
        Connect X
      </button>
      <button v-else class="btn btn-outline-primary" :disabled="xLoading" @click="connectX">
        <span v-if="xLoading" class="spinner-border spinner-border-sm me-2"></span>
        Reconnect
      </button>
      <button v-if="x.connected" class="btn btn-outline-danger" :disabled="xLoading" @click="disconnectX">
        Disconnect
      </button>
    </div>
  </div>
</div>

    <!-- Quick actions (kept from earlier weeks) -->
    <div class="card mt-4">
      <div class="card-body d-flex flex-wrap gap-2 align-items-center">
        <button class="btn btn-primary" :disabled="syncing" @click="syncTweets">
          {{ syncing ? 'Syncing…' : 'Sync Recent Tweets' }}
        </button>
        <router-link to="/compose" class="btn btn-outline-secondary">Open Composer</router-link>
        <router-link to="/engage" class="btn btn-outline-secondary">Find Reply Targets</router-link>
        <router-link to="/drafts" class="btn btn-outline-secondary">Schedule a Post</router-link>
        <span v-if="syncMsg" class="ms-2 small text-muted">{{ syncMsg }}</span>
        <span v-if="error" class="ms-2 text-danger small">{{ error }}</span>
      </div>
    </div>

    <!-- Optional: Your previous custom widgets can live here -->
    <!-- Example: last sync time, best-time (v1) widget, etc. -->
    <!-- <YourExistingWidget /> -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import api from '@/api/http';
import SkeletonCard from '@/components/SkeletonCard.vue';
import { useToasts } from '@/stores/toast';

const loading = ref(true);
const tiles = ref<any>({});
const syncing = ref(false);
const syncMsg = ref('');
const error = ref('');
const { add } = useToasts();
const x = ref<{ connected: boolean; handle: string|null; avatar: string|null }>({
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
  } catch (e:any) {
    // Don’t block dashboard if analytics fails
    console.warn('analytics/dashboard failed', e?.response?.data || e);
  } finally {
    loading.value = false;
  }
};

const syncTweets = async () => {
  syncing.value = true; syncMsg.value=''; error.value='';
  try {
    const { data } = await api.post('/api/tweets/sync'); // from Week 2 controller
    syncMsg.value = `Synced ${data.synced ?? 0} tweets.`;
    // After sync, refresh tiles (account score/best hours may change)
    await loadTiles();
  } catch (e:any) {
    error.value = e?.response?.data?.message || 'Failed to sync tweets';
  } finally {
    syncing.value = false;
  }
};

const loadX = async () => {
  try {
    // 1) connection state
    const { data: c } = await api.get('/api/auth/x/connected');
    // 2) user profile (for handle/avatar)
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
    // go to X oauth
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

// When returning from OAuth, backend redirects to FRONTEND_URL + "/?x=connected"
const checkOAuthReturn = async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('x') === 'connected') {
    await loadX();
    // optional: clean the query string
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
/* optional tiny polish */
.display-6 { font-weight: 600; }
</style>
