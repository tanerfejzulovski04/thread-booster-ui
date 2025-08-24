<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center">
      <h3>Engage</h3>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="openPrefs">Niches</button>
        <button class="btn btn-outline-primary" :disabled="refreshing" @click="refreshTargets">
          <span v-if="refreshing" class="spinner-border spinner-border-sm me-2"></span>
          {{ refreshing ? 'Refreshing…' : 'Refresh Targets' }}
        </button>
        <router-link to="/dashboard" class="btn btn-link">← Back</router-link>
      </div>
    </div>

    <!-- Rate limit notice -->
    <RateLimitBanner class="mt-3" />

    <!-- Targets (loading skeleton) -->
    <div v-if="loading" class="mt-3">
      <div class="list-group">
        <div v-for="n in 4" :key="n" class="list-group-item">
          <div class="placeholder-glow">
            <span class="placeholder col-2 me-2"></span>
            <span class="placeholder col-3 me-2"></span>
            <div class="mt-2">
              <span class="placeholder col-8"></span>
              <span class="placeholder col-6"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="!targets.length"
      class="mt-3"
      title="No targets yet"
      subtitle="Choose your niches and click Refresh Targets."
    >
      <template #actions>
        <button class="btn btn-primary" @click="openPrefs">Choose niches</button>
      </template>
    </EmptyState>

    <!-- Targets list -->
    <div v-else class="list-group mt-3">
      <div v-for="t in targets" :key="t.id" class="list-group-item">
        <div class="d-flex justify-content-between">
          <div class="me-3">
            <div class="small text-muted">@{{ t.author_handle }} · {{ formatTime(t.tweet_created_at) }}</div>
            <p class="mb-2" style="white-space: pre-line;">{{ t.text }}</p>
            <small class="text-muted">
              👍 {{ t.public_metrics?.like_count ?? 0 }}
              · 💬 {{ t.public_metrics?.reply_count ?? 0 }}
              · 🔁 {{ t.public_metrics?.retweet_count ?? 0 }}
              · 🔖 {{ t.public_metrics?.bookmark_count ?? 0 }}
            </small>
          </div>
          <div class="text-end" style="min-width: 200px;">
            <div class="mb-2">
              <span class="badge text-bg-info">score {{ toFixed(t.score, 2) }}</span>
            </div>
            <div class="mb-2">
              <a
                :href="tweetUrl(t.author_handle, t.x_tweet_id)"
                target="_blank"
                rel="noopener"
                class="small"
              >
                View on X ↗
              </a>
            </div>
            <button
              class="btn btn-sm btn-outline-success"
              @click="genReplies(t.id)"
              :disabled="loadingId===t.id"
            >
              <span v-if="loadingId===t.id" class="spinner-border spinner-border-sm me-1"></span>
              {{ loadingId===t.id ? 'Generating…' : 'Generate Replies' }}
            </button>
          </div>
        </div>

        <!-- Replies -->
        <div v-if="drafts[t.id]" class="mt-3">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title">Reply drafts</h6>
              <ul class="mb-0">
                <li v-for="(r,i) in drafts[t.id]" :key="i" class="mb-2 d-flex justify-content-between align-items-start">
                  <span style="white-space: pre-line;">{{ r }}</span>
                  <button class="btn btn-sm btn-outline-secondary ms-3" @click="copy(r)">Copy</button>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Niches modal -->
    <div v-if="showPrefs" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.4);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Choose your niches</h5>
            <button type="button" class="btn-close" @click="showPrefs=false"></button>
          </div>
          <div class="modal-body">
            <div class="form-check" v-for="n in allNiches" :key="n">
              <input class="form-check-input" type="checkbox" :id="'n-'+n" :value="n" v-model="niches" />
              <label class="form-check-label" :for="'n-'+n">{{ n }}</label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showPrefs=false">Close</button>
            <button class="btn btn-primary" @click="savePrefs">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hard error (rare) -->
    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/http';
import { useToasts } from '@/stores/toast';
import RateLimitBanner from '@/components/RateLimitBanner.vue';
import EmptyState from '@/components/EmptyState.vue';
import { rateLimitFlag } from '@/stores/rateLimit';
import { tweetUrl } from '@/utils/xLinks';

type Target = {
  id:number; x_tweet_id:string; author_handle:string; author_name?:string|null;
  tweet_created_at:string; text:string; public_metrics:any; score:number;
};

const { add } = useToasts();

const targets = ref<Target[]>([]);
const drafts = ref<Record<number, string[]>>({});
const loading = ref(false);
const refreshing = ref(false);
const error = ref('');
const loadingId = ref<number | null>(null);

const showPrefs = ref(false);
const niches = ref<string[]>([]);
const allNiches = ['ai','startups','crypto','marketing']; // keep in sync with config/niches.php

const loadPrefs = async () => {
  const { data } = await api.get('/api/prefs');
  niches.value = data.niches || [];
};

const savePrefs = async () => {
  try {
    await api.put('/api/prefs', { niches: niches.value });
    showPrefs.value = false;
    add('Niches saved', 'success');
  } catch (e:any) {
    add(e.message || 'Failed to save niches', 'danger');
  }
};

const openPrefs = async () => { await loadPrefs(); showPrefs.value = true; };

const loadTargets = async () => {
  loading.value = true; error.value = '';
  try {
    const { data } = await api.get('/api/engage/targets');
    targets.value = data.targets || [];
  } catch (e:any) {
    error.value = e.message || 'Failed to load targets';
    add(error.value, 'danger');
  } finally {
    loading.value = false;
  }
};

const refreshTargets = async () => {
  error.value = ''; refreshing.value = true;
  try {
    const { data } = await api.post('/api/engage/refresh');
    if (data.queued) {
      add('Refresh queued… fetching in background.', 'info', 2500);
      // poll a couple times to catch updates
      setTimeout(loadTargets, 2000);
      setTimeout(loadTargets, 5000);
    } else {
      // non-queued implementations may return refreshed count
      await loadTargets();
    }
  } catch (e:any) {
    if (e.status === 429) rateLimitFlag.value = true;
    const msg = e.message || 'Failed to refresh targets';
    error.value = msg;
    add(msg, e.status === 429 ? 'warning' : 'danger');
  } finally { refreshing.value = false; }
};

const genReplies = async (id:number) => {
  loadingId.value = id; error.value = '';
  try {
    const { data } = await api.post('/api/engage/replies', { target_id: id });
    drafts.value[id] = data.replies || [];
    add('Drafted 3 replies', 'success');
  } catch (e:any) {
    if (e.status === 429) rateLimitFlag.value = true;
    const msg = e.message || 'Failed to generate replies';
    error.value = msg;
    add(msg, e.status === 429 ? 'warning' : 'danger');
  } finally {
    loadingId.value = null;
  }
};

const copy = async (txt: string) => {
  try {
    await navigator.clipboard.writeText(txt);
    add('Copied to clipboard', 'success');
  } catch {
    add('Copy failed', 'danger');
  }
};

const formatTime = (iso: string) => new Date(iso).toLocaleString();
const toFixed = (n: any, d = 2) => {
  const x = typeof n === 'number' ? n : Number(n);
  return isNaN(x) ? '—' : x.toFixed(d);
};

onMounted(async () => {
  await loadPrefs();
  await loadTargets();
});
</script>
