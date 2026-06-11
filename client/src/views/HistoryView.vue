<template>
  <div class="view-container">
    <h1>Historique des téléchargements</h1>
    <p>Aucun téléchargement pour le moment</p>
  </div>
</template>

<script setup>
</script>

<style scoped>
.view-container {
  padding: var(--spacing-2xl);
}

h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0 0 var(--spacing-lg) 0;
}

p {
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
