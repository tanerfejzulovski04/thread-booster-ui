import { reactive } from 'vue';

type Toast = { id: number; text: string; type?: 'info' | 'success' | 'warning' | 'danger'; timeout?: number; };

const state = reactive({ items: [] as Toast[], nextId: 1 });

export function useToasts() {
  const add = (text: string, type: Toast['type'] = 'info', timeout = 3000) => {
    const id = state.nextId++;
    state.items.push({ id, text, type, timeout });
    setTimeout(() => remove(id), timeout);
  };
  const remove = (id: number) => {
    const idx = state.items.findIndex(t => t.id === id);
    if (idx >= 0) state.items.splice(idx, 1);
  };
  return { state, add, remove };
}
