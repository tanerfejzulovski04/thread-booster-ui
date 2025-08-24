import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@/stores/auth';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: () => import('@/pages/Login.vue') },
  { path: '/register', component: () => import('@/pages/Register.vue') },
  { path: '/dashboard', component: () => import('@/pages/Dashboard.vue'), meta: { auth: true } },
  { path: '/compose', component: () => import('@/pages/Compose.vue'), meta: { auth: true } },
  { path: '/my-tweets', component: () => import('@/pages/MyTweets.vue'), meta: { auth: true } },
  { path: '/alerts', component: () => import('@/pages/Alerts.vue'), meta: { auth: true } },
  { path: '/engage', component: () => import('@/pages/Engage.vue'), meta: { auth: true } },
  { path: '/drafts', component: () => import('@/pages/Drafts.vue'), meta: { auth: true } },
  { path: '/billing', component: () => import('@/pages/Billing.vue'), meta: { auth: true } },
  { path: '/:pathMatch(.*)*', component: () => import('@/pages/NotFound.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuth();
  if (to.meta.auth && !auth.token) return '/login';
  if (!auth.user && auth.token && to.meta.auth) {
    try { await auth.fetchMe(); } catch { return '/login'; }
  }
});

export default router;
