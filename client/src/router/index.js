import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/history',
    name: 'history',
    component: () => import(/* webpackChunkName: "history" */ '../views/HistoryView.vue')
  },
  {
    path: '/logs',
    name: 'logs',
    component: () => import(/* webpackChunkName: "logs" */ '../views/LogsView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import(/* webpackChunkName: "settings" */ '../views/SettingsView.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
