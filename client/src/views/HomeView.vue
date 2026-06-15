<template>
  <SearchSection @download="onDownload" @download-all="onDownloadAll" />
</template>

<script setup>
import SearchSection from '@/components/sections/SearchSection.vue'
import useDownloadQueue from '@/composables/useDownloadQueue'

const { addToQueue } = useDownloadQueue()

async function onDownload(track) {
  try {
    await addToQueue(track, 'high')
  } catch (err) {
    console.error('Failed to add to queue:', err)
  }
}

async function onDownloadAll(tracks) {
  // Ajoute tous les titres de la playlist/album en parallèle
  await Promise.all(
    tracks.map(track =>
      addToQueue(track, 'high').catch(err =>
        console.error(`Failed to add "${track.title}":`, err)
      )
    )
  )
}
</script>
