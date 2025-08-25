<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-2xl font-bold">Drafts</h3>
      <div class="flex gap-2">
        <Button variant="outline" @click="newDraft">+ New Draft</Button>
        <Button as-child variant="link">
          <router-link to="/dashboard">← Back</router-link>
        </Button>
      </div>
    </div>

    <!-- Drafts List -->
    <div class="space-y-4">
      <Card v-for="d in drafts" :key="d.id">
        <CardContent class="pt-6">
          <div class="flex justify-between gap-4">
            <div class="flex-1">
              <strong class="text-sm">{{ d.type }}</strong>
              <div class="text-sm text-muted-foreground">
                Scheduled: {{ d.scheduled_at ? new Date(d.scheduled_at).toLocaleString() : '—' }}
              </div>
              <div
                v-for="(line, i) in d.content"
                :key="i"
                class="text-sm mt-2"
                style="white-space: pre-line;"
              >
                {{ line.text || line }}
              </div>
            </div>
            <div class="text-right min-w-[150px]">
              <Badge v-if="d.posted" variant="default" textColor="white">Posted</Badge>
              <LoadButton
                v-else
                variant="btn btn-sm btn-outline-success"
                :loading="postingId === d.id"
                @click="postNow(d.id)"
              >
                Post Now
              </LoadButton>
              <Button
                variant="destructive"
                size="sm"
                class="ml-2"
                @click="del(d.id)"
              >
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- New Draft Dialog -->
    <Dialog v-model:open="showNew">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Draft</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Type</label>
            <Select v-model="newType" class="mt-1">
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="thread">Thread</SelectItem>
                <SelectItem value="reply">Reply</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Content</label>
            <Textarea
              v-model="newContent"
              placeholder="One line per tweet (for thread)"
              class="mt-1"
              rows="5"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Schedule (optional)</label>
            <Input
              type="datetime-local"
              v-model="newTime"
              class="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" @click="showNew = false">Cancel</Button>
          <Button @click="save">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/http';
import LoadButton from '@/components/LoadButton.vue';
import { useToasts } from '@/stores/toast';
import { rateLimitFlag } from '@/stores/rateLimit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type Draft = {
  id: number;
  type: string;
  content: any[];
  scheduled_at: string | null;
  posted: boolean;
};

const { add } = useToasts();
const drafts = ref<Draft[]>([]);
const showNew = ref(false);
const newType = ref('single');
const newContent = ref('');
const newTime = ref<string | null>(null);
const postingId = ref<number | null>(null);

const load = async () => {
  const { data } = await api.get('/api/drafts');
  drafts.value = data.drafts || [];
};

const newDraft = () => {
  showNew.value = true;
  newContent.value = '';
  newType.value = 'single';
  newTime.value = null;
};

const save = async () => {
  const content = newType.value === 'thread' ? newContent.value.split('\n').filter(l => l) : [newContent.value];
  try {
    await api.post('/api/drafts', { type: newType.value, content, scheduled_at: newTime.value || null });
    showNew.value = false;
    await load();
    add('Draft saved', 'success');
  } catch (e: any) {
    add(e.message || 'Failed to save draft', 'danger');
  }
};

const del = async (id: number) => {
  try {
    await api.delete(`/api/drafts/${id}`);
    await load();
    add('Draft deleted', 'success');
  } catch (e: any) {
    add(e.message || 'Failed to delete draft', 'danger');
  }
};

const postNow = async (id: number) => {
  postingId.value = id;
  try {
    await api.post(`/api/drafts/${id}/post-now`);
    add('Posted successfully', 'success');
    await load();
  } catch (e: any) {
    if (e.status === 429) rateLimitFlag.value = true;
    add(e.message || 'Failed to post draft', e.status === 429 ? 'warning' : 'danger');
  } finally {
    postingId.value = null;
  }
};

onMounted(load);
</script>

<style scoped>
/* Minimal scoped styles; shadcn-vue and Tailwind handle most styling */
</style>
