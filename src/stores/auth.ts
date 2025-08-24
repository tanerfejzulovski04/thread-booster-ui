import { defineStore } from 'pinia';
import api from '@/api/http';

type User = {
  id: number;
  name: string;
  email: string;
  trial_ends_at?: string | null;
  time_zone?: string;
};

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('tb_token') || '',
    loading: false,
  }),
  actions: {
    async register(name: string, email: string, password: string) {
      this.loading = true;
      try {
        const { data } = await api.post('/api/auth/register', { name, email, password });
        this.token = data.token;
        localStorage.setItem('tb_token', this.token);
        this.user = data.user;
      } finally {
        this.loading = false;
      }
    },
    async login(email: string, password: string) {
      this.loading = true;
      try {
        const { data } = await api.post('/api/auth/login', { email, password });
        this.token = data.token;
        localStorage.setItem('tb_token', this.token);
        this.user = data.user;
      } finally {
        this.loading = false;
      }
    },
    async fetchMe() {
      if (!this.token) return;
      const { data } = await api.get('/api/me');
      this.user = data;
    },
    async logout() {
      try { await api.post('/api/auth/logout'); } catch {}
      localStorage.removeItem('tb_token');
      this.token = '';
      this.user = null;
      location.href = '/login';
    },
  },
});
