<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import { useProblemsStore } from '@/stores/problems'

const router = useRouter()
const progress = useProgressStore()
const problemsStore = useProblemsStore()

const total = computed(() => problemsStore.allProblems.length)
const masteryRate = computed(() =>
  total.value === 0 ? 0 : Math.round((progress.stats.mastered / total.value) * 100)
)

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="app-root">
    <header class="app-header">
      <div class="brand" @click="goHome">
        <span class="brand-logo">LC</span>
        <span class="brand-text">Hot 100</span>
      </div>

      <button class="groups-nav-btn" @click="router.push('/groups')">组合</button>

      <div class="header-progress">
        <div class="progress-meta">
          <span class="progress-nums">{{ progress.stats.mastered }}<em>/{{ total }}</em></span>
          <span class="progress-percent">{{ masteryRate }}%</span>
        </div>
        <el-progress
          :percentage="masteryRate"
          :stroke-width="6"
          :show-text="false"
          status="success"
          class="header-prog-bar"
        />
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f6f8fa;
}

/* ── Header ── */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 16px;
  height: 52px;
  position: sticky;
  top: 0;
  z-index: 100;
  /* 刘海屏顶部安全区 */
  padding-top: env(safe-area-inset-top);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}
.brand-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: #ffa116;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
}
.brand-text {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

/* ── 组合导航按钮 ── */
.groups-nav-btn {
  padding: 5px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  margin-left: auto;
  margin-right: 12px;
}
.groups-nav-btn:active {
  background: #f3f4f6;
}

/* ── 进度区（右侧） ── */
.header-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  min-width: 120px;
}
.progress-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.progress-nums {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}
.progress-nums em {
  font-style: normal;
  font-weight: 400;
  color: #9ca3af;
  font-size: 12px;
}
.progress-percent {
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
}
.header-prog-bar {
  width: 120px;
}

/* ── Main ── */
.app-main {
  flex: 1;
  padding: 12px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* ── 桌面端加大 padding ── */
@media (min-width: 640px) {
  .app-header {
    padding: 0 24px;
    height: 60px;
  }
  .brand-text {
    font-size: 18px;
  }
  .brand-text::after {
    content: ' · 记忆题库';
    font-weight: 400;
    color: #6b7280;
    font-size: 15px;
  }
  .header-prog-bar {
    width: 180px;
  }
  .app-main {
    padding: 20px 24px;
  }
}

/* ── 路由过渡 ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
