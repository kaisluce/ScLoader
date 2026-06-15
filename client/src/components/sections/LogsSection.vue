<template>
  <section class="logs-section">
    <div class="logs-header">
      <h1 class="title">Logs</h1>
      <div class="controls">
        <div class="autoscroll-control">
          <span class="label">Auto-scroll</span>
          <button
            class="switch"
            :class="{ on: autoScroll }"
            @click="autoScroll = !autoScroll"
          >
            <span class="knob" />
          </button>
        </div>
        <button class="clear-btn" @click="clearLogs">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
          Vider les logs
        </button>
      </div>
    </div>

    <div class="logs-body">
      <div ref="logContainer" class="logs-viewer sc-scroll">
        <template v-if="logs.length > 0">
          <div v-for="entry in logs" :key="entry.id" class="log-line">
            <span class="time">{{ formatTime(entry.timestamp) }}</span>
            <span class="level" :class="entry.level.toLowerCase()">{{ entry.level }}</span>
            <span class="message">{{ entry.message }}</span>
          </div>
        </template>
        <div v-else class="empty-logs">
          Aucun log pour l'instant.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import useLogs from '@/composables/useLogs'

const logContainer = ref(null)
const { logs, autoScroll, clearLogs, formatTime } = useLogs(logContainer)
</script>

<style scoped>
.logs-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 30px 40px 36px;
}

.logs-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.title {
  margin: 0;
  font-size: 23px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.01em;
}

.controls {
  display: flex;
  align-items: center;
  gap: 18px;
}

.autoscroll-control {
  display: flex;
  align-items: center;
  gap: 9px;
}

.label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.switch {
  position: relative;
  width: 38px;
  height: 22px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  padding: 0;
  background: var(--color-border);
  transition: background var(--transition-fast);
}

.switch.on {
  background: var(--accent);
}

.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: left var(--transition-fast);
}

.switch.on .knob {
  left: 19px;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 9px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  color: var(--color-text);
  border-color: var(--color-border-hover);
}

.logs-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.logs-viewer {
  flex: 1;
  overflow-y: auto;
  background: #0d0d10;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  font-family: var(--font-family-mono);
  font-size: 13px;
  line-height: 1.9;
}

.log-line {
  display: flex;
  gap: 14px;
  align-items: baseline;
}

.time {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.level {
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
  width: 62px;
}

/* Level colors intentionally hardcoded — no CSS variable for these */
.level.info    { color: var(--color-text); }
.level.success { color: #22c55e; }
.level.warn    { color: #eab308; }
.level.error   { color: #ef4444; }

.message {
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.empty-logs {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: var(--font-size-md);
}
</style>
