<template>
  <section class="settings-section">
    <div class="settings-header">
      <h1 class="title">Paramètres</h1>
    </div>

    <div class="settings-body sc-scroll">
      <div class="settings-stack">

        <!-- Téléchargement -->
        <div class="settings-card">
          <h2 class="card-title">Téléchargement</h2>

          <div class="setting-row">
            <div class="setting-label">
              <div class="label-text">Qualité audio</div>
              <div class="label-desc">Définit le débit visé pour les nouveaux téléchargements.</div>
            </div>
            <div class="quality-buttons">
              <button
                v-for="q in qualities"
                :key="q.value"
                class="quality-btn"
                :class="{ active: quality === q.value }"
                @click="quality = q.value"
              >{{ q.label }}</button>
            </div>
          </div>

          <div class="setting-row last">
            <div class="setting-label">
              <div class="label-text">Dossier de sortie</div>
              <div class="label-desc">Emplacement des fichiers téléchargés.</div>
            </div>
            <div class="folder-selector">
              <input type="text" readonly :value="outputFolder" class="folder-input" />
              <button class="folder-btn">Parcourir</button>
            </div>
          </div>
        </div>

        <!-- Apparence -->
        <div class="settings-card">
          <h2 class="card-title">Apparence</h2>

          <div class="setting-row">
            <div class="setting-label">
              <div class="label-text">Thème clair</div>
              <div class="label-desc">Bascule entre l'apparence sombre et claire.</div>
            </div>
            <button class="switch" :class="{ on: theme === 'light' }" @click="toggleTheme">
              <span class="knob" />
            </button>
          </div>

          <div class="setting-row last">
            <div class="setting-label">
              <div class="label-text">Couleur d'accentuation</div>
              <div class="label-desc">S'applique instantanément à toute l'application.</div>
            </div>
            <div class="swatches">
              <button
                v-for="sw in swatches"
                :key="sw.color"
                class="swatch"
                :title="sw.name"
                :style="{ background: sw.color, boxShadow: accentColor === sw.color ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${sw.color}` : '0 0 0 1px rgba(0,0,0,0.25)' }"
                @click="setAccent(sw.color)"
              />
            </div>
          </div>
        </div>

        <!-- À propos -->
        <div class="settings-card">
          <h2 class="card-title">À propos</h2>
          <div class="about">
            <div class="about-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round">
                <line x1="5"    y1="10" x2="5"    y2="14" />
                <line x1="9.5"  y1="7"  x2="9.5"  y2="17" />
                <line x1="14"   y1="4"  x2="14"   y2="20" />
                <line x1="18.5" y1="9"  x2="18.5" y2="15" />
              </svg>
            </div>
            <div class="about-text">
              <div class="app-name">SC Downloader</div>
              <div class="app-version">Version 1.4.0</div>
            </div>
            <a href="#" class="github-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.6 2 12.3c0 4.5 2.9 8.4 6.8 9.7.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 3.9-1.3 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import useTheme from '@/composables/useTheme'

const { theme, toggleTheme } = useTheme()

const quality = ref('high')
const outputFolder = ref('~/Music/SC Downloader')
const accentColor = ref('#ff5500')

const qualities = [
  { value: 'low',  label: 'Basse' },
  { value: 'med',  label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
]

const swatches = [
  { name: 'SoundCloud', color: '#ff5500' },
  { name: 'Bleu',       color: '#2f7cf6' },
  { name: 'Vert',       color: '#22a06b' },
  { name: 'Violet',     color: '#8b5cf6' },
  { name: 'Rose',       color: '#e0457b' },
  { name: 'Cyan',       color: '#0fb5ae' },
]

function setAccent(color) {
  accentColor.value = color
  document.documentElement.style.setProperty('--accent', color)
}
</script>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.settings-header {
  flex-shrink: 0;
  padding: 30px 40px 20px;
  border-bottom: 1px solid var(--color-border);
}

.title {
  margin: 0;
  font-size: 23px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.01em;
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 26px 40px 48px;
}

.settings-stack {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 26px 28px;
}

.card-title {
  margin: 0 0 22px;
  font-size: 12.5px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 22px;
}

.setting-row.last {
  padding-bottom: 0;
  border-bottom: none;
  margin-bottom: 0;
}

.setting-label { flex: 1; }

.label-text {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.label-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: 3px;
}

.quality-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.quality-btn {
  padding: 9px 18px;
  border-radius: 9px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-dark);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quality-btn:hover:not(.active) {
  border-color: var(--color-border-hover);
  color: var(--color-text);
}

.quality-btn.active {
  background-color: var(--accent);
  border-color: transparent;
  color: #fff;
}

.folder-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.folder-input {
  width: 240px;
  height: 40px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-dark);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  font-size: 12.5px;
  outline: none;
}

.folder-btn {
  height: 40px;
  padding: 0 18px;
  border-radius: 9px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-dark);
  color: var(--color-text);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.folder-btn:hover {
  background-color: var(--color-hover);
  border-color: var(--color-border-hover);
}

.switch {
  position: relative;
  width: 38px;
  height: 22px;
  flex-shrink: 0;
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

.swatches {
  display: flex;
  gap: 14px;
  flex-shrink: 0;
}

.swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.swatch:hover {
  transform: scale(1.08);
}

.about {
  display: flex;
  align-items: center;
  gap: 14px;
}

.about-icon {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  background-color: var(--color-surface-dark);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.about-text { flex: 1; }

.app-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.app-version {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.github-link:hover { color: var(--color-text); }
</style>
