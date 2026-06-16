<template>
  <div class="app-layout">
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

const { state } = usePlayer()
useTheme()

function applyAccent(color) {
  document.documentElement.style.setProperty('--accent', color)
}

// Applique la couleur d'accent au démarrage et à chaque changement
onMounted(() => applyAccent(settingsState.accentColor))
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
</style>
