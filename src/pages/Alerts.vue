<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center">
      <h3>Alerts</h3>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" :disabled="refreshing" @click="refresh">
          <span v-if="refreshing" class="spinner-border spinner-border-sm me-2"></span>
          {{ refreshing ? 'Refreshing…' : 'Refresh' }}
        </button>
        <router-link to="/dashboard" class="btn btn-link">← Back</router-link>
      </div>
    </div>

    <div v-if="loading" class="mt-3 text-muted">Loading…</div>
    <div v-else-if="error" class="alert alert-danger mt-3">{{ error }}</div>

    <div v-else class="list-group mt-3">
      <div v-for="a in alerts" :key="a.id" class="list-group-item">
        <div class="d-flex justify-content-between">
          <div class="me-3">
            <div class="small text-muted">
              <span class="badge text-bg-success text-uppercase me-2">{{ a.title }}</span>
              <span class="badge text-bg-warning text-lowercase me-2">{{ a.type || 'alert' }}</span>
              {{ formatTime(a.created_at || a.createdAt) }}
            </div>
            <div class="mt-1" style="white-space: pre-line;">
              {{ a.text || a.message || '(no text)' }}
            </div>
            <div class="small text-muted mt-1" v-if="a.public_metrics">
              👍 {{ a.public_metrics.like_count ?? 0 }}
              · 💬 {{ a.public_metrics.reply_count ?? 0 }}
              · 🔁 {{ a.public_metrics.retweet_count ?? 0 }}
              · 🔖 {{ a.public_metrics.bookmark_count ?? 0 }}
            </div>
          </div>
          <div class="text-end" style="min-width: 160px;">
            <a
              v-if="tweetHref(a.author_handle, a.x_tweet_id)"
              :href="tweetHref(a.author_handle, a.x_tweet_id)"
              target="_blank"
              rel="noopener"
              class="btn btn-sm btn-outline-secondary"
            >
              View on X ↗
            </a>
          </div>
        </div>
      </div>

      <div v-if="!alerts.length" class="list-group-item text-center text-muted">
        No alerts yet.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/api/http'

type AlertItem = {
  id: number|string
  type?: string,
  title?: string
  created_at?: string
  createdAt?: string
  text?: string|null
  message?: string|null
  public_metrics?: any
  x_tweet_id?: string|number|null
  author_handle?: string|null
}

const alerts = ref<AlertItem[]>([])
const loading = ref(true)
const refreshing = ref(false)
const error = ref('')

const load = async () => {
  error.value = ''
  try {
    const { data } = await api.get('/api/alerts')
    alerts.value = data.alerts ?? data ?? []
  } catch (e:any) {
    error.value = e?.message || 'Failed to load alerts'
  } finally {
    loading.value = false
  }
}

const refresh = async () => {
  refreshing.value = true
  try {
    // If you also have a force-refresh endpoint, you can call it here first:
    // await api.post('/api/alerts/refresh')
    await load()
  } catch (e:any) {
    error.value = e?.message || 'Failed to refresh alerts'
  } finally {
    refreshing.value = false
  }
}

const formatTime = (iso?: string|null) => (iso ? new Date(iso).toLocaleString() : '')

const tweetHref = (handle?: string|null, id?: string|number|null) => {
  if (!id && id !== 0) return ''
  const tweetId = String(id)
  const h = (handle || '').replace(/^@/, '')
  return h ? `https://x.com/${h}/status/${tweetId}` : `https://x.com/i/web/status/${tweetId}`
}

onMounted(load)
</script>
