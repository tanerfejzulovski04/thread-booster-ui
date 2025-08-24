import { defineStore } from 'pinia';
import api from '@/api/http';

export const useX = defineStore('x', {
  state: () => ({
    connected: false,
    syncing: false,
    tweets: [] as Array<{ x_tweet_id: string; posted_at: string; text: string; public_metrics: any }>,
    bestToday: [] as Array<{ hour: number; score: number }>,
    topAcross: [] as Array<{ weekday: number; hour: number; score: number }>,
  }),
  actions: {
    async checkConnected() {
      const { data } = await api.get('/api/auth/x/connected');
      this.connected = !!data.connected;
    },
    async connect() {
      const { data } = await api.get('/api/auth/x/redirect');
      if (data.url) window.location.href = data.url;
    },
    async disconnect() {
      await api.post('/api/auth/x/disconnect');
      this.connected = false;
    },
    async syncTweets() {
      this.syncing = true;
      try {
        await api.post('/api/tweets/sync');
      } finally {
        this.syncing = false;
      }
    },
    async loadRecent() {
      const { data } = await api.get('/api/tweets/recent');
      this.tweets = data.tweets || [];
    },
    async loadBestTimes() {
      const { data } = await api.get('/api/analytics/best-times');
      this.bestToday = data.today || [];
      this.topAcross = data.top_across_week || [];
    },
  },
});
