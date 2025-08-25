<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-2xl font-bold">Alerts</h3>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="refreshing" @click="refresh">
          <span v-if="refreshing" class="mr-2 h-4 w-4 animate-spin" />
          {{ refreshing ? 'Refreshing…' : 'Refresh' }}
        </Button>
        <Button as-child variant="link">
          <router-link to="/dashboard">← Back</router-link>
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="mt-6 text-muted-foreground">Loading…</div>

    <!-- Error Alert -->
    <Alert v-else-if="error" variant="destructive" class="mt-6">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Alerts List -->
    <div v-else class="space-y-4 mt-6">
      <Card v-for="a in alerts" :key="a.id">
        <CardContent class="pt-6">
          <div class="flex justify-between gap-4">
            <div class="flex-1">
              <div class="flex gap-2 mb-2">
                <Badge variant="default" textColor="white">{{ a.title }}</Badge>
                <Badge variant="outline">{{ a.type || 'alert' }}</Badge>
                <span class="text-sm text-muted-foreground">{{ formatTime(a.created_at || a.createdAt) }}</span>
              </div>
              <div class="text-sm" style="white-space: pre-line;">
                {{ a.text || a.message || '(no text)' }}
              </div>
              <div v-if="a.public_metrics" class="mt-2 text-xs text-muted-foreground">
                👍 {{ a.public_metrics.like_count ?? 0 }}
                · 💬 {{ a.public_metrics.reply_count ?? 0 }}
                · 🔁 {{ a.public_metrics.retweet_count ?? 0 }}
                · 🔖 {{ a.public_metrics.bookmark_count ?? 0 }}
              </div>
            </div>
            <div class="text-right min-w-[160px]">
              <Button
                v-if="tweetHref(a.author_handle, a.x_tweet_id)"
                variant="outline"
                size="sm"
                as="a"
                :href="tweetHref(a.author_handle, a.x_tweet_id)"
                target="_blank"
                rel="noopener"
              >
                View on X ↗
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- No Alerts -->
      <Card v-if="!alerts.length">
        <CardContent class="pt-6 text-center text-muted-foreground">
          No alerts yet.
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/http';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type AlertItem = {
  id: number | string;
  type?: string;
  title?: string;
  created_at?: string;
  createdAt?: string;
  text?: string | null;
  message?: string | null;
  public_metrics?: any;
  x_tweet_id?: string | number | null;
  author_handle?: string | null;
};

const alerts = ref<AlertItem[]>([]);
const loading = ref(true);
const refreshing = ref(false);
const error = ref('');

const load = async () => {
  error.value = '';
  try {
    const { data } = await api.get('/api/alerts');
    alerts.value = data.alerts ?? data ?? [];
  } catch (e: any) {
    error.value = e?.message || 'Failed to load alerts';
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  refreshing.value = true;
  try {
    // If you also have a force-refresh endpoint, you can call it here first:
    // await api.post('/api/alerts/refresh');
    await load();
  } catch (e: any) {
    error.value = e?.message || 'Failed to refresh alerts';
  } finally {
    refreshing.value = false;
  }
};

const formatTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '');

const tweetHref = (handle?: string | null, id?: string | number | null) => {
  if (!id && id !== 0) return '';
  const tweetId = String(id);
  const h = (handle || '').replace(/^@/, '');
  return h ? `https://x.com/${h}/status/${tweetId}` : `https://x.com/i/web/status/${tweetId}`;
};

onMounted(load);
</script>

<style scoped>
/* Minimal scoped styles; shadcn-vue and Tailwind handle most styling */
</style>
