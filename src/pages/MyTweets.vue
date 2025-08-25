<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-2xl font-bold">My Tweets</h3>
      <Button as-child variant="link">
        <router-link to="/dashboard">← Back</router-link>
      </Button>
    </div>

    <!-- Actions and Score -->
    <div class="flex flex-wrap gap-2 mb-6">
      <Button variant="outline" @click="load">Refresh</Button>
      <Button variant="outline" @click="loadScore">Account Score</Button>
      <Badge v-if="score !== null" variant="default" class="self-center">
        Score: {{ score }}
      </Badge>
      <Badge
        v-if="trend !== null"
        :variant="trend >= 0 ? 'default' : 'destructive'"
        class="self-center"
      >
        Trend: {{ trend >= 0 ? '+' + trend : trend }}
      </Badge>
    </div>

    <!-- Tweets List -->
    <div class="space-y-4">
      <Card v-for="t in tweets" :key="t.x_tweet_id">
        <CardContent class="pt-6">
          <div class="flex justify-between gap-4">
            <div class="flex-1">
              <p class="text-sm mb-2" style="white-space: pre-line;">{{ t.text }}</p>
              <div class="text-xs text-muted-foreground">
                👍 {{ t.public_metrics?.like_count || 0 }}
                · 💬 {{ t.public_metrics?.reply_count || 0 }}
                · 🔁 {{ t.public_metrics?.retweet_count || 0 }}
                · 🔖 {{ t.public_metrics?.bookmark_count || 0 }}
              </div>
            </div>
            <div class="text-right min-w-[200px]">
              <div class="text-sm text-muted-foreground">
                {{ new Date(t.posted_at).toLocaleString() }}
              </div>
              <div class="mt-2">
                <a
                  :href="tweetUrl(null, t.x_tweet_id)"
                  target="_blank"
                  rel="noopener"
                  class="text-sm text-primary hover:underline"
                >
                  Open on X ↗
                </a>
              </div>
              <Badge :variant="badgeVariant(t.engagement_score)" textColor="white" class="mt-2">
                {{ t.engagement_score ?? '/' }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-if="!tweets.length" class="text-muted-foreground mt-6 text-sm">
      No tweets loaded yet. Go to Dashboard and “Sync Recent Tweets”.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api/http';
import { tweetUrl } from '@/utils/xLinks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type Tweet = {
  x_tweet_id: string;
  posted_at: string;
  text: string;
  public_metrics: any;
  engagement_score: number | null;
};

const tweets = ref<Tweet[]>([]);
const score = ref<number | null>(null);
const trend = ref<number | null>(null);

const load = async () => {
  const { data } = await api.get('/api/tweets/recent');
  tweets.value = data.tweets || [];
};

const loadScore = async () => {
  const { data } = await api.get('/api/analytics/score');
  score.value = data.account_score ?? null;
  trend.value = data.trend ?? null;
};

const badgeVariant = (s: number | null) => {
  if (s === null || s === undefined) return 'default';
  if (s >= 80) return 'default';
  if (s >= 60) return 'secondary';
  if (s >= 40) return 'warning';
  return 'destructive';
};

load();
loadScore();
</script>

<style scoped>
/* Minimal scoped styles; shadcn-vue and Tailwind handle most styling */
</style>
