<template>
  <aside class="sidebar">
    <div class="logo" title="SC Downloader">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round">
        <line x1="5"   y1="10" x2="5"   y2="14" />
        <line x1="9.5" y1="7"  x2="9.5" y2="17" />
        <line x1="14"  y1="4"  x2="14"  y2="20" />
        <line x1="18.5" y1="9" x2="18.5" y2="15" />
      </svg>
    </div>

    <nav class="nav">
      <router-link :to="{ name: 'home' }"     class="nav-item" :class="{ active: $route.name === 'home' }"     title="Recherche">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </router-link>

      <router-link :to="{ name: 'history' }"  class="nav-item" :class="{ active: $route.name === 'history' }"  title="Historique">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />
        </svg>
      </router-link>

      <router-link :to="{ name: 'logs' }"     class="nav-item" :class="{ active: $route.name === 'logs' }"     title="Logs">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <polyline points="14 3 14 8 19 8" />
          <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      </router-link>
    </nav>

    <router-link :to="{ name: 'settings' }" class="nav-item nav-settings" :class="{ active: $route.name === 'settings' }" title="Paramètres">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" y1="8" x2="20" y2="8" /><circle cx="9" cy="8" r="2.4" fill="var(--color-surface-alt)" />
        <line x1="4" y1="16" x2="20" y2="16" /><circle cx="15" cy="16" r="2.4" fill="var(--color-surface-alt)" />
      </svg>
    </router-link>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
useRoute()
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 64px;
  height: 100vh;
  background-color: var(--color-surface-alt);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  z-index: var(--z-sticky);
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  flex-shrink: 0;
}

.nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.nav-item {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: transparent;
  transition: background var(--transition-fast), color var(--transition-fast);
  text-decoration: none;
}

.nav-item:hover {
  background: #22222a;
  color: var(--color-text);
}

.nav-item.active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 13%, transparent);
  box-shadow: inset 2px 0 0 var(--accent);
}

.nav-settings {
  margin-top: auto;
}
</style>
