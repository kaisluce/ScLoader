<template>
  <div class="app-layout" :class="{ electron: isElectron }">
    <div v-if="isElectron" class="electron-titlebar">
      <div class="window-controls">
        <button class="wc-btn wc-close" title="Fermer" @click="winClose">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" shape-rendering="geometricPrecision">
            <line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/>
          </svg>
        </button>
        <button class="wc-btn wc-minimize" title="Réduire" @click="winMinimize">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" shape-rendering="geometricPrecision">
            <line x1="2" y1="5" x2="8" y2="5"/>
          </svg>
        </button>
        <button class="wc-btn wc-maximize" title="Plein écran" @click="winMaximize">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" shape-rendering="geometricPrecision">
            <polyline points="6,2 8,2 8,4"/>
            <polyline points="4,8 2,8 2,6"/>
            <line x1="8" y1="2" x2="2" y2="8"/>
          </svg>
        </button>
      </div>
    </div>
    <AppSidebar />
    <main
      class="main-content"
      :class="{ 'with-player': state.currentTrack }"
    >
      <RouterView />
    </main>
    <MiniPlayer />
    <DownloadStatusIcon />
  </div>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import MiniPlayer from './components/MiniPlayer.vue'
import DownloadStatusIcon from './components/DownloadStatusIcon.vue'
import usePlayer from './composables/usePlayer'
import useTheme from './composables/useTheme'
import { settingsState } from './stores/settingsStore'

const isElectron = !!window.electronAPI?.isElectron

const winClose    = () => window.electronAPI?.window.close()
const winMinimize = () => window.electronAPI?.window.minimize()
const winMaximize = () => window.electronAPI?.window.maximize()

const { state } = usePlayer()
useTheme()

function applyAccent(color) {
  document.documentElement.style.setProperty('--accent', color)
}

// Applique la couleur d'accent au démarrage et à chaque changement
onMounted(() => {
  applyAccent(settingsState.accentColor)
  if (isElectron) document.body.classList.add('electron')
})
watch(() => settingsState.accentColor, applyAccent)
</script>

<style scoped>
.app-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: var(--color-bg);
  color: var(--color-text);
}

.main-content {
  flex: 1;
  min-width: 0;
  margin-left: 64px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content.with-player {
  padding-bottom: 72px;
}

.electron-titlebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 34px;
  background-color: var(--color-surface-alt);
  -webkit-app-region: drag;
  border-bottom: 1px solid var(--color-border);
  z-index: 1000;
  display: flex;
  align-items: center;
  padding-left: 12px;
}

.window-controls {
  display: flex;
  gap: 6px;
  -webkit-app-region: no-drag;
}

.wc-btn {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.window-controls:hover .wc-btn {
  color: var(--color-text-secondary);
}

.wc-close:hover  { background: #ff5f57; border-color: #e0443e; color: #7a0000; }
.wc-minimize:hover { background: #febc2e; border-color: #d4a017; color: #7a4800; }
.wc-maximize:hover { background: #28c840; border-color: #14a829; color: #004d00; }

.app-layout.electron .main-content {
  padding-top: 34px;
}
</style>
