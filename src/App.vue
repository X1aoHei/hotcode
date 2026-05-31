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
const wrongRate = computed(() =>
  total.value === 0 ? 0 : Math.round((progress.wrongSet.length / total.value) * 100)
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

      <!-- 桌面端：头部显示进度条 -->
      <div class="header-progress-group desktop-only">
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
        <div class="header-progress header-wrong">
          <div class="progress-meta">
            <span class="progress-nums wrong-nums">{{ progress.wrongSet.length }}<em>错题</em></span>
            <span class="progress-percent wrong-percent">{{ wrongRate }}%</span>
          </div>
          <el-progress
            :percentage="wrongRate"
            :stroke-width="6"
            :show-text="false"
            status="exception"
            class="header-prog-bar"
          />
        </div>
      </div>

      <!-- 桌面端导航按钮 -->
      <div class="desktop-nav desktop-only">
        <button class="groups-nav-btn" @click="router.push('/groups')">组合</button>
        <button class="groups-nav-btn" @click="router.push('/review-rounds')">复习</button>
      </div>
    </header>

    <!-- 移动端：紧凑进度条 -->
    <div class="mobile-progress mobile-only">
      <div class="mobile-progress-item">
        <span class="mobile-progress-label">掌握</span>
        <el-progress :percentage="masteryRate" :stroke-width="4" :show-text="false" status="success" class="mobile-prog-bar" />
        <span class="mobile-progress-val">{{ progress.stats.mastered }}/{{ total }}</span>
      </div>
      <div class="mobile-progress-item">
        <span class="mobile-progress-label wrong-nums">错题</span>
        <el-progress :percentage="wrongRate" :stroke-width="4" :show-text="false" status="exception" class="mobile-prog-bar" />
        <span class="mobile-progress-val wrong-nums">{{ progress.wrongSet.length }}</span>
      </div>
    </div>

    <main class="app-main">
      <router-view />
    </main>

    <!-- 移动端底部导航栏 -->
    <nav class="mobile-nav mobile-only">
      <button class="mobile-nav-btn" :class="{ active: $route.path === '/' }" @click="router.push('/')">
        <span class="nav-icon">📋</span>
        <span class="nav-label">题目</span>
      </button>
      <button class="mobile-nav-btn" :class="{ active: $route.path === '/groups' }" @click="router.push('/groups')">
        <span class="nav-icon">🔗</span>
        <span class="nav-label">组合</span>
      </button>
      <button class="mobile-nav-btn" :class="{ active: $route.path === '/review-rounds' }" @click="router.push('/review-rounds')">
        <span class="nav-icon">📝</span>
        <span class="nav-label">复习</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f6f8fa;
}

/* ── 移动端/桌面端切换 ── */
.mobile-only { display: none; }
.desktop-only { display: flex; }

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
  padding-top: env(safe-area-inset-top);
  flex-shrink: 0;
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

/* ── 桌面端进度区 ── */
.header-progress-group {
  align-items: center;
  gap: 16px;
  margin-left: auto;
  margin-right: 16px;
}
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
.wrong-percent {
  color: #dc2626;
}
.wrong-nums {
  color: #dc2626;
}
.header-wrong {
  margin-left: 16px;
}
.header-prog-bar {
  width: 120px;
}

/* ── 桌面端导航按钮 ── */
.desktop-nav {
  gap: 8px;
  flex-shrink: 0;
}
.groups-nav-btn {
  padding: 5px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
}
.groups-nav-btn:active {
  background: #f3f4f6;
}

/* ── 移动端紧凑进度条 ── */
.mobile-progress {
  display: flex;
  gap: 12px;
  padding: 6px 12px;
  background: #fff;
  border-bottom: 1px solid #f3f4f6;
}
.mobile-progress-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}
.mobile-progress-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
}
.mobile-prog-bar {
  flex: 1;
}
.mobile-progress-val {
  font-size: 11px;
  font-weight: 700;
  color: #16a34a;
  flex-shrink: 0;
  min-width: 32px;
  text-align: right;
}

/* ── 移动端底部导航栏 ── */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-around;
  padding: 4px 0;
  padding-bottom: calc(4px + env(safe-area-inset-bottom));
  z-index: 100;
}
.mobile-nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px;
  border: none;
  background: none;
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.15s;
}
.mobile-nav-btn.active {
  color: #3b82f6;
}
.nav-icon {
  font-size: 18px;
  line-height: 1;
}
.nav-label {
  font-size: 10px;
  font-weight: 600;
}

/* ── Main ── */
.app-main {
  flex: 1;
  padding: 12px;
  /* 移动端底部留出导航栏空间 */
  padding-bottom: calc(60px + env(safe-area-inset-bottom));
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* ── 桌面端 ── */
@media (min-width: 640px) {
  .mobile-only { display: none !important; }
  .desktop-only { display: flex !important; }

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
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
  }
}

/* ── 移动端 ── */
@media (max-width: 639px) {
  .mobile-only { display: flex !important; }
  .desktop-only { display: none !important; }

  .app-header {
    height: 44px;
    padding: 0 12px;
  }
  .brand-logo {
    width: 26px;
    height: 26px;
    font-size: 11px;
  }
  .brand-text {
    font-size: 14px;
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
