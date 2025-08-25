<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-2xl font-bold">Plan & Usage</h3>
      <Button as-child variant="link">
        <router-link to="/dashboard">← Back</router-link>
      </Button>
    </div>

    <!-- Current Plan -->
    <Card class="mt-6">
      <CardHeader>
        <CardTitle>
          Current Plan: <Badge variant="secondary" textColor="white">{{ plan }}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <strong class="text-sm">Generations today:</strong> {{ today.generations }} / {{ limits.generations_per_day ?? '∞' }}
          </div>
          <div>
            <strong class="text-sm">Refreshes today:</strong> {{ today.refreshes }} / {{ limits.refreshes_per_day ?? '∞' }}
          </div>
          <div>
            <strong class="text-sm">Posts today:</strong> {{ today.posts }} / {{ limits.posts_per_day ?? '∞' }}
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Upgrade Section -->
    <Card class="mt-6">
      <CardHeader>
        <CardTitle>Upgrade</CardTitle>
        <CardDescription>Want higher limits? Pick a plan and we’ll reach out.</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-wrap gap-2">
          <Select v-model="target" class="w-[220px]">
            <SelectTrigger>
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" :disabled="loading" @click="request">
            {{ loading ? 'Sending…' : 'Request upgrade' }}
          </Button>
        </div>
        <Alert v-if="msg" variant="default" class="mt-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{{ msg }}</AlertDescription>
        </Alert>
        <Alert v-if="err" variant="destructive" class="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{{ err }}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import api from '@/api/http';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const plan = ref('free');
const limits = ref<Record<string, number>>({});
const today = ref({ generations: 0, refreshes: 0, posts: 0 });
const target = ref('basic');
const loading = ref(false);
const msg = ref('');
const err = ref('');

const load = async () => {
  const { data } = await api.get('/api/billing/me');
  plan.value = data.plan;
  limits.value = data.limits || {};
  today.value = data.today || today.value;
};

const request = async () => {
  loading.value = true;
  msg.value = '';
  err.value = '';
  try {
    await api.post('/api/billing/request-upgrade', { target_plan: target.value });
    msg.value = 'Thanks! We’ll get back to you shortly.';
  } catch (e: any) {
    err.value = e?.response?.data?.message || 'Failed to send request';
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
/* Minimal scoped styles; shadcn-vue and Tailwind handle most styling */
</style>
