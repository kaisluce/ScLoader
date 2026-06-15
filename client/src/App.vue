<template>
  <div class="app-layout">
    <AppSidebar />
    <main class="main-content" :class="{ 'with-player': state.currentTrack }">
      <RouterView />
    </main>
    <MiniPlayer />
    <DownloadStatusIcon />
  </div>
</template>

<script setup>
import AppSidebar from './components/AppSidebar.vue'
import MiniPlayer from './components/MiniPlayer.vue'
import DownloadStatusIcon from './components/DownloadStatusIcon.vue'
import usePlayer from './composables/usePlayer'
import useTheme from './composables/useTheme'

const { state } = usePlayer()
useTheme() // applique le thème mémorisé dès le démarrage
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

/* Réduit la zone de contenu de la hauteur du MiniPlayer (box-sizing: border-box global) */
.main-content.with-player {
  padding-bottom: 72px;
}
</style>
