<template>
  <span :class="['badge', policy.toLowerCase()]">
    {{ policy }}
  </span>
</template>

<script setup>
defineProps({
  policy: {
    type: String,
    required: true,
    validator: (v) => ['MONETIZE', 'BLOCK'].includes(v)
  }
})
</script>

<style scoped>
.badge {
  display: inline-block;
  padding: 3px 7px;
  border-radius: 6px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.05em;
}

.monetize {
  background-color: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.35);
}

.block {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--color-error);
  border: 1px solid rgba(239, 68, 68, 0.35);
}
</style>
