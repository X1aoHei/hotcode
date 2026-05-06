import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'list',
    component: () => import('@/views/ProblemList.vue'),
    meta: { title: '题目列表' }
  },
  {
    path: '/problem/:id',
    name: 'detail',
    component: () => import('@/views/ProblemDetail.vue'),
    props: true,
    meta: { title: '题目详情' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
