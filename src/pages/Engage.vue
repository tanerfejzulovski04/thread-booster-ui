<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-2xl font-bold">Engage</h3>
      <div class="flex gap-2">
        <Button variant="outline" @click="openPrefs">Niches</Button>
        <Button variant="outline" :disabled="refreshing" @click="refreshTargets">
          <span v-if="refreshing" class="mr-2 h-4 w-4 animate-spin" />
          {{ refreshing ? 'Refreshing…' : 'Refresh Targets' }}
        </Button>
        <Button as-child variant="link">
          <router-link to="/dashboard">← Back</router-link>
        </Button>
      </div>
    </div>

    <!-- Rate Limit Notice -->
    <RateLimitBanner class="mt-6" />

    <!-- Targets (Loading Skeleton) -->
    <div v-if="loading" class="mt-6 space-y-4">
      <Card v-for="n in 4" :key="n">
        <CardContent class="pt-6">
          <div class="space-y-2">
            <div class="flex gap-2">
              <div class="h-4 w-24 bg-muted rounded" />
              <div class="h-4 w-36 bg-muted rounded" />
            </div>
            <div class="space-y-1">
              <div class="h-4 w-3/4 bg-muted rounded" />
              <div class="h-4 w-1/2 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="!targets.length"
      class="mt-6"
      title="No targets yet"
      subtitle="Choose your niches and click Refresh Targets."
    >
      <template #actions>
        <Button variant="secondary" @click="openPrefs">Choose niches</Button>
      </template>
    </EmptyState>

    <!-- Targets List -->
    <div v-else class="mt-6 space-y-4">
      <Card v-for="t in targets" :key="t.id">
        <CardContent class="pt-6">
          <div class="flex justify-between gap-4">
            <div class="flex-1">
              <div class="text-sm text-muted-foreground">
                @{{ t.author_handle }} · {{ formatTime(t.tweet_created_at) }}
              </div>
              <p class="mt-2 text-sm" style="white-space: pre-line;">{{ t.text }}</p>
              <div class="mt-2 text-xs text-muted-foreground">
                👍 {{ t.public_metrics?.like_count ?? 0 }}
                · 💬 {{ t.public_metrics?.reply_count ?? 0 }}
                · 🔁 {{ t.public_metrics?.retweet_count ?? 0 }}
                · 🔖 {{ t.public_metrics?.bookmark_count ?? 0 }}
              </div>
            </div>
            <div class="text-right min-w-[200px]">
              <div class="mb-2">
                <Badge variant="default" textColor="white">Score {{ toFixed(t.score, 2) }}</Badge>
              </div>
              <div class="mb-2">
                <a
                  :href="tweetUrl(t.author_handle, t.x_tweet_id)"
                  target="_blank"
                  rel="noopener"
                  class="text-sm text-primary hover:underline"
                >
                  View on X ↗
                </a>
              </div>
              <Button
                variant="outline"
                size="sm"
                :disabled="loadingId === t.id"
                @click="genReplies(t.id)"
              >
                <span v-if="loadingId === t.id" class="mr-1 h-4 w-4 animate-spin" />
                {{ loadingId === t.id ? 'Generating…' : 'Generate Replies' }}
              </Button>
            </div>
          </div>
          <!-- Replies -->
          <div v-if="drafts[t.id]" class="mt-4">
            <Card>
              <CardHeader>
                <CardTitle class="text-base">Reply drafts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul class="space-y-2">
                  <li v-for="(r, i) in drafts[t.id]" :key="i" class="flex justify-between items-start">
                    <span class="text-sm" style="white-space: pre-line;">{{ r }}</span>
                    <Button variant="outline" size="sm" class="ml-3" @click="copy(r)">Copy</Button>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Niches Dialog -->
    <Dialog v-model:open="showPrefs">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose your niches</DialogTitle>
        </DialogHeader>
        <div class="space-y-2">
          <div v-for="n in allNiches" :key="n" class="flex items-center">
            <Checkbox :id="'n-' + n" :value="n" v-model="niches" />
            <label :for="'n-' + n" class="ml-2 text-sm">{{ n }}</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" @click="showPrefs = false">Close</Button>
          <Button @click="savePrefs">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Hard Error -->
    <Alert v-if="error" variant="destructive" class="mt-6">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type Target = {
  id: number;
  x_tweet_id: string;
  author_handle: string;
  author_name?: string | null;
  tweet_created_at: string;
  text: string;
  public_metrics: any;
  score: number;
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
const allNiches = ['ai', 'startups', 'crypto', 'marketing'];

const loadPrefs = async () => {
  const { data } = await api.get('/api/prefs');
  niches.value = data.niches || [];
};

const savePrefs = async () => {
  try {
    await api.put('/api/prefs', { niches: niches.value });
    showPrefs.value = false;
    add('Niches saved', 'success');
  } catch (e: any) {
    add(e.message || 'Failed to save niches', 'danger');
  }
};

const openPrefs = async () => {
  await loadPrefs();
  showPrefs.value = true;
};

const loadTargets = async () => {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/api/engage/targets');
    targets.value = data.targets || [];
  } catch (e: any) {
    error.value = e.message || 'Failed to load targets';
    add(error.value, 'danger');
  } finally {
    loading.value = false;
  }
};

const refreshTargets = async () => {
  error.value = '';
  refreshing.value = true;
  try {
    const { data } = await api.post('/api/engage/refresh');
    if (data.queued) {
      add('Refresh queued… fetching in background.', 'info', 2500);
      setTimeout(loadTargets, 2000);
      setTimeout(loadTargets, 5000);
    } else {
      await loadTargets();
    }
  } catch (e: any) {
    if (e.status === 400) {
    add('Please connect your X account first (Dashboard → Connect X).', 'warning');
    // Optionally send them there:
    // router.push('/dashboard');
  } else {
    add(e.message, e.status === 429 ? 'warning' : 'danger');
  }
  } finally {
    refreshing.value = false;
  }
};

const genReplies = async (id: number) => {
  loadingId.value = id;
  error.value = '';
  try {
    const { data } = await api.post('/api/engage/replies', { target_id: id });
    drafts.value[id] = data.replies || [];
    add('Drafted 3 replies', 'success');
  } catch (e: any) {
    if (e.status === 429) rateLimitFlag.value = true;
    error.value = e.message || 'Failed to generate replies';
    add(error.value, e.status === 429 ? 'warning' : 'danger');
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

<style scoped>
/* Minimal scoped styles; shadcn-vue and Tailwind handle most styling */
</style>
