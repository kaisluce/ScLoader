<template>
  <div class="app-layout">
    <AppSidebar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import AppSidebar from './components/AppSidebar.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: var(--color-bg);
}

.main-content {
  flex: 1;
  margin-left: 60px;
  overflow-y: auto;
  background-color: var(--color-bg);
}
</style>
