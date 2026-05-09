/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono'
import {
  getUserProblems,
  upsertProblem,
  deleteProblem,
  resetProblem,
  getProgress,
  updateProgress,
  resetProgress,
  getContent,
  updateContent,
  deleteContent,
  exportAll,
  importAll,
} from './db'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// ── 用户题目数据 ──

app.get('/api/problems/user', async (c) => {
  const data = await getUserProblems(c.env.DB)
  return c.json(data)
})

app.post('/api/problems/user', async (c) => {
  const body = await c.req.json()
  await upsertProblem(c.env.DB, body, true)
  return c.json({ ok: true })
})

app.put('/api/problems/user/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const isCustom = body._isCustom ?? false
  delete body._isCustom
  await upsertProblem(c.env.DB, { ...body, id }, isCustom)
  return c.json({ ok: true })
})

app.delete('/api/problems/user/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await deleteProblem(c.env.DB, id)
  return c.json({ ok: true })
})

app.post('/api/problems/user/:id/reset', async (c) => {
  const id = Number(c.req.param('id'))
  await resetProblem(c.env.DB, id)
  return c.json({ ok: true })
})

// ── 进度 ──

app.get('/api/progress', async (c) => {
  const data = await getProgress(c.env.DB)
  return c.json(data)
})

app.put('/api/progress/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  await updateProgress(c.env.DB, id, body)
  return c.json({ ok: true })
})

app.delete('/api/progress', async (c) => {
  await resetProgress(c.env.DB)
  return c.json({ ok: true })
})

// ── 笔记 + 草稿 ──

app.get('/api/content/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const data = await getContent(c.env.DB, id)
  return c.json(data)
})

app.put('/api/content/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  await updateContent(c.env.DB, id, body)
  return c.json({ ok: true })
})

app.delete('/api/content/:id', async (c) => {
  const id = Number(c.req.param('id'))
  await deleteContent(c.env.DB, id)
  return c.json({ ok: true })
})

// ── 导入导出 ──

app.get('/api/export', async (c) => {
  const data = await exportAll(c.env.DB)
  return c.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  })
})

app.post('/api/import', async (c) => {
  const body = await c.req.json()
  const payload = body.data ?? body
  const count = await importAll(c.env.DB, payload)
  return c.json({ ok: true, count })
})

// ── 从 localStorage 格式迁移 ──

app.post('/api/migrate', async (c) => {
  const body = await c.req.json()
  const count = await importAll(c.env.DB, body)
  return c.json({ ok: true, count })
})

// 非 API 路由交给静态资源处理
app.all('*', (c) => c.notFound())

export default app
