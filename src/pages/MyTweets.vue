<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center">
      <h3>My Tweets</h3>
      <router-link to="/dashboard" class="btn btn-link">← Back</router-link>
    </div>

    <div class="d-flex gap-2 mb-3">
      <button class="btn btn-outline-primary" @click="load">Refresh</button>
      <button class="btn btn-outline-secondary" @click="loadScore">Account Score</button>
      <span v-if="score !== null" class="badge text-bg-success align-self-center">Score: {{ score }}</span>
      <span v-if="trend !== null" :class="['badge', trend >= 0 ? 'text-bg-success' : 'text-bg-danger']" class="align-self-center">
        Trend: {{ trend >= 0 ? '+'+trend : trend }}
      </span>
    </div>

    <div class="list-group">
      <div v-for="t in tweets" :key="t.x_tweet_id" class="list-group-item">
        <div class="d-flex justify-content-between">
          <div>
            <p class="mb-1" style="white-space: pre-line;">{{ t.text }}</p>
            <small class="text-muted">
              👍 {{ t.public_metrics?.like_count || 0 }}
              · 💬 {{ t.public_metrics?.reply_count || 0 }}
              · 🔁 {{ t.public_metrics?.retweet_count || 0 }}
              · 🔖 {{ t.public_metrics?.bookmark_count || 0 }}
            </small>
          </div>
          <div class="text-end">
            <small class="d-block">{{ new Date(t.posted_at).toLocaleString() }}</small>
            <div class="small">
  <a
    :href="tweetUrl(null, t.x_tweet_id)"
    target="_blank"
    rel="noopener"
  >Open on X ↗</a>
</div>
            <span class="badge" :class="badgeClass(t.engagement_score)">{{ t.engagement_score ?? '—' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!tweets.length" class="text-muted mt-3">No tweets loaded yet. Go to Dashboard and “Sync Recent Tweets”.</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api/http';
import { tweetUrl } from '@/utils/xLinks';

type Tweet = {
  x_tweet_id: string;
  posted_at: string;
  text: string;
  public_metrics: any;
  engagement_score: number | null;
};

const tweets = ref<Tweet[]>([]);
const score = ref<number|null>(null);
const trend = ref<number|null>(null);

const load = async () => {
  const { data } = await api.get('/api/tweets/recent');
  tweets.value = data.tweets || [];
};

const loadScore = async () => {
  const { data } = await api.get('/api/analytics/score');
  score.value = data.account_score ?? null;
  trend.value = data.trend ?? null;
};

const badgeClass = (s: number|null) => {
  if (s === null || s === undefined) return 'text-bg-secondary';
  if (s >= 80) return 'text-bg-success';
  if (s >= 60) return 'text-bg-info';
  if (s >= 40) return 'text-bg-warning';
  return 'text-bg-danger';
};

load();
loadScore();
</script>
