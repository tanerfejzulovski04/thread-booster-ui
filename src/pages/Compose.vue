<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-2xl font-bold">Compose</h3>
      <Button as-child variant="link">
        <router-link to="/dashboard">← Back</router-link>
      </Button>
    </div>

    <!-- Hook Generator -->
    <form @submit.prevent="generateHooks" class="space-y-4">
      <div>
        <label class="text-sm font-medium text-muted-foreground">Draft Tweet</label>
        <Textarea
          v-model="draft"
          placeholder="Type your idea..."
          class="mt-1"
          rows="4"
          required
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <Button type="submit" :disabled="loadingHooks">
          {{ loadingHooks ? 'Generating...' : 'Get Hook Suggestions' }}
        </Button>
        <!-- Thread controls -->
        <div class="flex gap-2 max-w-md">
          <div class="flex items-center bg-muted px-3 rounded-md text-sm text-muted-foreground">
            Thread
          </div>
          <Select v-model="length">
            <SelectTrigger class="w-28">
              <SelectValue placeholder="Select length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="n in [5, 6, 7, 8, 9, 10, 11, 12]" :key="n" :value="n">
                {{ n }} tweets
              </SelectItem>
            </SelectContent>
          </Select>
          <Select v-model="tone">
            <SelectTrigger class="w-32">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concise">Concise</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="confident">Confident</SelectItem>
              <SelectItem value="teaching">Teaching</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            :disabled="loadingThread"
            @click="generateThread"
          >
            {{ loadingThread ? 'Expanding...' : 'Expand to Thread' }}
          </Button>
        </div>
      </div>
    </form>

    <!-- Hook Variants -->
    <div v-if="variants.length" class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <Card v-for="(v, i) in variants" :key="'h' + i">
        <CardContent class="pt-6">
          <p class="text-sm">{{ v }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- Thread Result -->
    <Card v-if="thread.length" class="mt-6">
      <CardHeader>
        <div class="flex justify-between items-center">
          <CardTitle>Thread Preview ({{ thread.length }} tweets)</CardTitle>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" @click="copyAll">Copy All</Button>
            <Button
              variant="outline"
              size="sm"
              @click="numbering = !numbering"
            >
              {{ numbering ? 'Hide #' : 'Show #' }}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ol v-if="numbering" class="space-y-2">
          <li v-for="(t, i) in thread" :key="'t' + i" class="text-sm" style="white-space: pre-line;">
            {{ t }}
          </li>
        </ol>
        <div v-else class="space-y-2">
          <p v-for="(t, i) in thread" :key="'t' + i" class="text-sm" style="white-space: pre-line;">
            {{ t }}
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Error Alert -->
    <Alert v-if="error" variant="destructive" class="mt-6">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api/http';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const draft = ref('');
const variants = ref<string[]>([]);
const loadingHooks = ref(false);

const thread = ref<string[]>([]);
const length = ref(7);
const tone = ref<'concise' | 'casual' | 'confident' | 'teaching'>('concise');
const loadingThread = ref(false);
const numbering = ref(true);

const error = ref('');

const generateHooks = async () => {
  error.value = '';
  variants.value = [];
  loadingHooks.value = true;
  try {
    const { data } = await api.post('/api/generate/hook', { draft: draft.value });
    variants.value = data.variants || [];
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to generate hooks';
  } finally {
    loadingHooks.value = false;
  }
};

const generateThread = async () => {
  error.value = '';
  thread.value = [];
  loadingThread.value = true;
  try {
    const { data } = await api.post('/api/generate/thread', {
      seed: draft.value,
      length: length.value,
      tone: tone.value,
    });
    thread.value = data.tweets || [];
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to expand thread';
  } finally {
    loadingThread.value = false;
  }
};

const copyAll = async () => {
  const numbered = thread.value.map((t, i) => `${i + 1}/ ${t}`);
  await navigator.clipboard.writeText(numbering.value ? numbered.join('\n\n') : thread.value.join('\n\n'));
  alert('Thread copied to clipboard!');
};
</script>

<style scoped>
/* Minimal scoped styles; shadcn-vue and Tailwind handle most styling */
</style>
