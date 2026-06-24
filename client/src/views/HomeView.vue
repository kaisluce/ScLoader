<template>
  <SearchSection
    @download="onDownload"
    @download-all="onDownloadAll"
  />
</template>

<script setup>
import SearchSection from '@/components/sections/SearchSection.vue'
import useDirectDownload from '@/composables/useDirectDownload'

const { download } = useDirectDownload()

async function onDownload(track) {
  try {
    await download(track, 'high')
  } catch (err) {
    console.error('Download failed:', err)
  }
}

async function onDownloadAll(tracks) {
  // Téléchargements séquentiels : un Blob/save-dialog à la fois pour ne pas
  // saturer le serveur (résolution + conversion ffmpeg) ni le navigateur.
  for (const track of tracks) {
    try {
      await download(track, 'high')
    } catch (err) {
      console.error(`Download failed for "${track.title}":`, err)
    }
  }
}
</script>
