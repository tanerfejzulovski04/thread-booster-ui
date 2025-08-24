<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center">
      <h3>Drafts</h3>
      <div>
        <button class="btn btn-outline-primary me-2" @click="newDraft">+ New Draft</button>
        <router-link to="/dashboard" class="btn btn-link">← Back</router-link>
      </div>
    </div>

    <div class="list-group mt-3">
      <div v-for="d in drafts" :key="d.id" class="list-group-item">
        <div class="d-flex justify-content-between">
          <div>
            <strong>{{ d.type }}</strong>
            <div class="small text-muted">Scheduled: {{ d.scheduled_at ? new Date(d.scheduled_at).toLocaleString() : '—' }}</div>
            <div v-for="(line,i) in d.content" :key="i" style="white-space: pre-line;">{{ line.text || line }}</div>
          </div>
          <div class="text-end">
            <span v-if="d.posted" class="badge text-bg-success">Posted</span>
            <LoadButton
            v-else
            variant="btn btn-sm btn-outline-success"
            :loading="postingId===d.id"
            @click="postNow(d.id)"
          >
            Post Now
          </LoadButton>
            <button class="btn btn-sm btn-outline-danger ms-2" @click="del(d.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showNew" class="modal d-block" style="background:rgba(0,0,0,0.4);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header"><h5>New Draft</h5></div>
          <div class="modal-body">
            <label class="form-label">Type</label>
            <select v-model="newType" class="form-select mb-2">
              <option value="single">Single</option>
              <option value="thread">Thread</option>
              <option value="reply">Reply</option>
            </select>
            <label class="form-label">Content</label>
            <textarea v-model="newContent" class="form-control" rows="5" placeholder="One line per tweet (for thread)"></textarea>
            <label class="form-label mt-2">Schedule (optional)</label>
            <input type="datetime-local" v-model="newTime" class="form-control"/>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showNew=false">Cancel</button>
            <button class="btn btn-primary" @click="save">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api/http';
import LoadButton from '@/components/LoadButton.vue';
import { useToasts } from '@/stores/toast';
import { rateLimitFlag } from '@/stores/rateLimit';

type Draft = { id:number; type:string; content:any[]; scheduled_at:string|null; posted:boolean; };

const { add } = useToasts()
const drafts = ref<Draft[]>([]);
const showNew = ref(false);
const newType = ref('single');
const newContent = ref('');
const newTime = ref<string|null>(null);
const postingId = ref<number|null>(null)

const load = async () => {
  const { data } = await api.get('/api/drafts');
  drafts.value = data.drafts || [];
};

const newDraft = () => { showNew.value=true; newContent.value=''; newType.value='single'; newTime.value=null; };

const save = async () => {
  const content = newType.value==='thread' ? newContent.value.split('\n').filter(l=>l) : [newContent.value];
  await api.post('/api/drafts',{ type:newType.value, content, scheduled_at:newTime.value||null });
  showNew.value=false; await load();
};

const del = async (id:number) => { await api.delete(`/api/drafts/${id}`); await load(); };

const postNow = async (id:number) => {
  postingId.value = id
  try {
    await api.post(`/api/drafts/${id}/post-now`)
    add('Posted successfully', 'success')
    await load()
  } catch (e:any) {
    if (e.status === 429) rateLimitFlag.value = true
    add(e.message, e.status === 403 ? 'warning' : 'danger')
  } finally {
    postingId.value = null
  }
}

onMounted(load);
</script>
