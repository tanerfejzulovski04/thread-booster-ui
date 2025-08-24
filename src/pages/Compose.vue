<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center">
      <h3>Compose</h3>
      <router-link to="/dashboard" class="btn btn-link">← Back</router-link>
    </div>

    <!-- Hook Generator -->
    <form class="mt-3" @submit.prevent="generateHooks">
      <label class="form-label">Draft Tweet</label>
      <textarea v-model="draft" class="form-control" rows="4" placeholder="Type your idea..." required></textarea>

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-primary" :disabled="loadingHooks">Get Hook Suggestions</button>

        <!-- Thread controls -->
        <div class="input-group" style="max-width: 380px;">
          <span class="input-group-text">Thread</span>
          <select v-model.number="length" class="form-select" style="max-width:120px;">
            <option v-for="n in [5,6,7,8,9,10,11,12]" :key="n" :value="n">{{ n }} tweets</option>
          </select>
          <select v-model="tone" class="form-select">
            <option value="concise">Concise</option>
            <option value="casual">Casual</option>
            <option value="confident">Confident</option>
            <option value="teaching">Teaching</option>
          </select>
          <button class="btn btn-outline-success" type="button" :disabled="loadingThread" @click="generateThread">
            Expand to Thread
          </button>
        </div>
      </div>
    </form>

    <!-- Hook variants -->
    <div class="row row-cols-1 row-cols-md-3 g-3 mt-3" v-if="variants.length">
      <div class="col" v-for="(v,i) in variants" :key="'h'+i">
        <HookCard :text="v" />
      </div>
    </div>

    <!-- Thread result -->
    <div class="card mt-4" v-if="thread.length">
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <h5 class="card-title">Thread Preview ({{ thread.length }} tweets)</h5>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" @click="copyAll">Copy All</button>
            <button class="btn btn-sm btn-outline-secondary" @click="numbering = !numbering">
              {{ numbering ? 'Hide #' : 'Show #' }}
            </button>
          </div>
        </div>
        <ol v-if="numbering" class="mt-3">
          <li v-for="(t,i) in thread" :key="'t'+i" style="white-space: pre-line;">{{ t }}</li>
        </ol>
        <div v-else class="mt-3">
          <p v-for="(t,i) in thread" :key="'t'+i" class="mb-2" style="white-space: pre-line;">{{ t }}</p>
        </div>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api/http';
import HookCard from '@/components/HookCard.vue';

const draft = ref('');
const variants = ref<string[]>([]);
const loadingHooks = ref(false);

const thread = ref<string[]>([]);
const length = ref(7);
const tone = ref<'concise'|'casual'|'confident'|'teaching'>('concise');
const loadingThread = ref(false);
const numbering = ref(true);

const error = ref('');

const generateHooks = async () => {
  error.value = ''; variants.value = []; loadingHooks.value = true;
  try {
    const { data } = await api.post('/api/generate/hook', { draft: draft.value });
    variants.value = data.variants || [];
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to generate hooks';
  } finally { loadingHooks.value = false; }
};

const generateThread = async () => {
  error.value = ''; thread.value = []; loadingThread.value = true;
  try {
    const { data } = await api.post('/api/generate/thread', { seed: draft.value, length: length.value, tone: tone.value });
    thread.value = data.tweets || [];
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to expand thread';
  } finally { loadingThread.value = false; }
};

const copyAll = async () => {
  const numbered = thread.value.map((t,i)=> `${i+1}/ ${t}`);
  await navigator.clipboard.writeText(numbering.value ? numbered.join('\n\n') : thread.value.join('\n\n'));
  alert('Thread copied to clipboard!');
};
</script>
