<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">SC↓</div>
    </div>

    <nav class="sidebar-nav">
      <router-link
        :to="{ name: 'home' }"
        class="nav-item"
        :class="{ active: $route.name === 'home' }"
        title="Recherche"
      >
        <Search :size="24" />
      </router-link>

      <router-link
        :to="{ name: 'history' }"
        class="nav-item"
        :class="{ active: $route.name === 'history' }"
        title="Historique"
      >
        <Download :size="24" />
      </router-link>

      <router-link
        :to="{ name: 'logs' }"
        class="nav-item"
        :class="{ active: $route.name === 'logs' }"
        title="Logs"
      >
        <ScrollText :size="24" />
      </router-link>

      <router-link
        :to="{ name: 'settings' }"
        class="nav-item"
        :class="{ active: $route.name === 'settings' }"
        title="Paramètres"
      >
        <Settings :size="24" />
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { Search, Download, ScrollText, Settings } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

useRoute()
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 60px;
  height: 100vh;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md) 0;
  gap: var(--spacing-lg);
  z-index: var(--z-sticky);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.logo {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent);
  letter-spacing: -1px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  width: 100%;
  padding: 0 var(--spacing-sm);
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-left: auto;
  margin-right: auto;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: all var(--transition-default);
  position: relative;
}

.nav-item:hover {
  color: var(--color-accent);
  background-color: var(--color-surface-light);
}

.nav-item.active {
  color: var(--color-accent);
  background-color: var(--color-surface-light);
  box-shadow: inset 0 0 0 2px var(--color-accent);
}

.nav-item svg {
  transition: transform var(--transition-default);
}

.nav-item:hover svg,
.nav-item.active svg {
  transform: scale(1.1);
}
</style>
