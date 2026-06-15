<template>
  <div v-if="type === 'card'" class="skeleton-grid">
    <div v-for="i in count" :key="i" class="skeleton-card" />
  </div>
  <div v-else class="skeleton-list">
    <div v-for="i in count" :key="i" class="skeleton-item" />
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'card',
    validator: (v) => ['card', 'list'].includes(v)
  },
  count: {
    type: Number,
    default: 6
  }
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.75;
  }
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-2xl);
}

.skeleton-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton-card::before {
  content: '';
  display: block;
  aspect-ratio: 1 / 1;
  background: var(--color-border);
}

.skeleton-card::after {
  content: '';
  display: block;
  height: 12px;
  margin: var(--spacing-md);
  background: var(--color-border);
  border-radius: var(--radius-sm);
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton-item:last-child {
  border-bottom: none;
}

.skeleton-item::before {
  content: '';
  display: block;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-border);
  flex-shrink: 0;
}

.skeleton-item::after {
  content: '';
  flex: 1;
  height: 12px;
  background: var(--color-border);
  border-radius: var(--radius-sm);
}
</style>
