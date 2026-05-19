import type { Env } from './types'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 })
    }

    try {
      return await handleApi(url, request, env)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error'
      return Response.json({ error: message }, { status: 500 })
    }
  },
}

async function handleApi(url: URL, request: Request, env: Env): Promise<Response> {
  const { pathname } = url
  const method = request.method
  const db = env.DB

  // ── User Problems ──
  if (pathname === '/api/user-problems' && method === 'GET') {
    const added = await db.prepare('SELECT data FROM user_problems').all()
    const modified = await db.prepare('SELECT problem_id, data FROM modified_problems').all()
    const deleted = await db.prepare('SELECT problem_id FROM deleted_problems').all()
    return Response.json({
      added: added.results.map((r: any) => JSON.parse(r.data)),
      modified: Object.fromEntries(modified.results.map((r: any) => [r.problem_id, JSON.parse(r.data)])),
      deleted: deleted.results.map((r: any) => r.problem_id),
    })
  }

  if (pathname === '/api/user-problems' && method === 'POST') {
    const body = await request.json() as { added: any[]; modified: Record<number, any>; deleted: number[] }
    const now = Date.now()

    await db.batch([
      db.prepare('DELETE FROM user_problems'),
      db.prepare('DELETE FROM modified_problems'),
      db.prepare('DELETE FROM deleted_problems'),
      ...body.added.map((p) =>
        db.prepare('INSERT INTO user_problems (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)')
          .bind(p.id, JSON.stringify(p), now, now)
      ),
      ...Object.entries(body.modified).map(([id, p]) =>
        db.prepare('INSERT OR REPLACE INTO modified_problems (problem_id, data, updated_at) VALUES (?, ?, ?)')
          .bind(Number(id), JSON.stringify(p), now)
      ),
      ...body.deleted.map((id) =>
        db.prepare('INSERT OR IGNORE INTO deleted_problems (problem_id, deleted_at) VALUES (?, ?)')
          .bind(id, now)
      ),
    ])

    return Response.json({ ok: true })
  }

  // ── Progress ──
  if (pathname === '/api/progress' && method === 'GET') {
    const rows = await db.prepare('SELECT problem_id, status, last_viewed, is_wrong FROM progress').all()
    const status: Record<number, string> = {}
    const lastViewed: Record<number, number> = {}
    const wrongSet: number[] = []
    for (const r of rows.results as any[]) {
      status[r.problem_id] = r.status
      if (r.last_viewed) lastViewed[r.problem_id] = r.last_viewed
      if (r.is_wrong) wrongSet.push(r.problem_id)
    }
    return Response.json({ status, lastViewed, wrongSet })
  }

  if (pathname === '/api/progress' && method === 'POST') {
    const body = await request.json() as {
      status: Record<number, string>
      lastViewed: Record<number, number>
      wrongSet: number[]
    }
    const now = Date.now()
    const wrongSetSet = new Set(body.wrongSet)
    const allIds = new Set([
      ...Object.keys(body.status).map(Number),
      ...Object.keys(body.lastViewed).map(Number),
      ...body.wrongSet,
    ])

    const stmts = [db.prepare('DELETE FROM progress')]
    for (const id of allIds) {
      stmts.push(
        db.prepare('INSERT INTO progress (problem_id, status, last_viewed, is_wrong) VALUES (?, ?, ?, ?)')
          .bind(id, body.status[id] ?? 'unseen', body.lastViewed[id] ?? null, wrongSetSet.has(id) ? 1 : 0)
      )
    }
    await db.batch(stmts)
    return Response.json({ ok: true })
  }

  // ── Groups ──
  if (pathname === '/api/groups' && method === 'GET') {
    const rows = await db.prepare('SELECT * FROM groups ORDER BY updated_at DESC').all()
    const groups = (rows.results as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      note: r.note,
      problemIds: JSON.parse(r.problem_ids),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
    return Response.json(groups)
  }

  if (pathname === '/api/groups' && method === 'POST') {
    const groups = await request.json() as any[]
    const stmts = [db.prepare('DELETE FROM groups')]
    for (const g of groups) {
      stmts.push(
        db.prepare('INSERT INTO groups (id, name, note, problem_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(g.id, g.name, g.note ?? '', JSON.stringify(g.problemIds), g.createdAt, g.updatedAt)
      )
    }
    await db.batch(stmts)
    return Response.json({ ok: true })
  }

  // ── Notes ──
  const noteMatch = pathname.match(/^\/api\/notes\/(\d+)$/)
  if (noteMatch) {
    const problemId = Number(noteMatch[1])
    if (method === 'GET') {
      const row = await db.prepare('SELECT content FROM notes WHERE problem_id = ?').bind(problemId).first()
      return Response.json({ content: row ? (row as any).content : '' })
    }
    if (method === 'PUT') {
      const { content } = await request.json() as { content: string }
      await db.prepare('INSERT OR REPLACE INTO notes (problem_id, content, updated_at) VALUES (?, ?, ?)')
        .bind(problemId, content, Date.now())
      return Response.json({ ok: true })
    }
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM notes WHERE problem_id = ?').bind(problemId)
      return Response.json({ ok: true })
    }
  }

  // ── Drafts ──
  const draftMatch = pathname.match(/^\/api\/drafts\/(\d+)$/)
  if (draftMatch) {
    const problemId = Number(draftMatch[1])
    if (method === 'GET') {
      const row = await db.prepare('SELECT content FROM drafts WHERE problem_id = ?').bind(problemId).first()
      return Response.json({ content: row ? (row as any).content : '' })
    }
    if (method === 'PUT') {
      const { content } = await request.json() as { content: string }
      await db.prepare('INSERT OR REPLACE INTO drafts (problem_id, content, updated_at) VALUES (?, ?, ?)')
        .bind(problemId, content, Date.now())
      return Response.json({ ok: true })
    }
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM drafts WHERE problem_id = ?').bind(problemId)
      return Response.json({ ok: true })
    }
  }

  // ── Export ──
  if (pathname === '/api/export' && method === 'GET') {
    const [userProblems, modifiedProblems, deletedProblems, progressRows, groupsRows, notesRows, draftsRows] =
      await Promise.all([
        db.prepare('SELECT * FROM user_problems').all(),
        db.prepare('SELECT * FROM modified_problems').all(),
        db.prepare('SELECT * FROM deleted_problems').all(),
        db.prepare('SELECT * FROM progress').all(),
        db.prepare('SELECT * FROM groups').all(),
        db.prepare('SELECT * FROM notes').all(),
        db.prepare('SELECT * FROM drafts').all(),
      ])

    return Response.json({
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        userProblems: userProblems.results,
        modifiedProblems: modifiedProblems.results,
        deletedProblems: deletedProblems.results,
        progress: progressRows.results,
        groups: groupsRows.results,
        notes: notesRows.results,
        drafts: draftsRows.results,
      },
    })
  }

  // ── Import ──
  if (pathname === '/api/import' && method === 'POST') {
    const body = await request.json() as any
    const now = Date.now()

    const stmts = [
      db.prepare('DELETE FROM user_problems'),
      db.prepare('DELETE FROM modified_problems'),
      db.prepare('DELETE FROM deleted_problems'),
      db.prepare('DELETE FROM progress'),
      db.prepare('DELETE FROM groups'),
      db.prepare('DELETE FROM notes'),
      db.prepare('DELETE FROM drafts'),
    ]

    // 判断格式：新格式有 data.userProblems，旧格式有 data['hot100-user-problems-v1']
    const isLegacy = body.data && !body.data.userProblems

    if (isLegacy) {
      // ── 旧格式（localStorage key-value）──
      const data = body.data as Record<string, any>

      // 题目
      const problemsData = data['hot100-user-problems-v1']
      if (problemsData) {
        const parsed = typeof problemsData === 'string' ? JSON.parse(problemsData) : problemsData
        if (parsed.added) {
          for (const p of parsed.added) {
            stmts.push(
              db.prepare('INSERT INTO user_problems (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)')
                .bind(p.id, JSON.stringify(p), now, now)
            )
          }
        }
        if (parsed.modified) {
          for (const [id, p] of Object.entries(parsed.modified)) {
            stmts.push(
              db.prepare('INSERT INTO modified_problems (problem_id, data, updated_at) VALUES (?, ?, ?)')
                .bind(Number(id), JSON.stringify(p), now)
            )
          }
        }
        if (parsed.deleted) {
          for (const id of parsed.deleted) {
            stmts.push(
              db.prepare('INSERT INTO deleted_problems (problem_id, deleted_at) VALUES (?, ?)')
                .bind(id, now)
            )
          }
        }
      }

      // 进度
      const progressData = data['hot100-progress-v1']
      if (progressData) {
        const parsed = typeof progressData === 'string' ? JSON.parse(progressData) : progressData
        const wrongSetSet = new Set(parsed.wrongSet ?? [])
        const allIds = new Set([
          ...Object.keys(parsed.status ?? {}).map(Number),
          ...Object.keys(parsed.lastViewed ?? {}).map(Number),
          ...(parsed.wrongSet ?? []),
        ])
        for (const id of allIds) {
          stmts.push(
            db.prepare('INSERT INTO progress (problem_id, status, last_viewed, is_wrong) VALUES (?, ?, ?, ?)')
              .bind(id, parsed.status?.[id] ?? 'unseen', parsed.lastViewed?.[id] ?? null, wrongSetSet.has(id) ? 1 : 0)
          )
        }
      }

      // 组合
      const groupsData = data['hot100-groups-v1']
      if (groupsData) {
        const parsed = typeof groupsData === 'string' ? JSON.parse(groupsData) : groupsData
        for (const g of parsed) {
          stmts.push(
            db.prepare('INSERT INTO groups (id, name, note, problem_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
              .bind(g.id, g.name, g.note ?? '', JSON.stringify(g.problemIds), g.createdAt, g.updatedAt)
          )
        }
      }

      // 笔记和草稿
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('hot100-note-')) {
          const problemId = Number(key.replace('hot100-note-', ''))
          const content = typeof value === 'string' ? value : JSON.stringify(value)
          stmts.push(
            db.prepare('INSERT OR REPLACE INTO notes (problem_id, content, updated_at) VALUES (?, ?, ?)')
              .bind(problemId, content, now)
          )
        } else if (key.startsWith('hot100-draft-')) {
          const problemId = Number(key.replace('hot100-draft-', ''))
          const content = typeof value === 'string' ? value : JSON.stringify(value)
          stmts.push(
            db.prepare('INSERT OR REPLACE INTO drafts (problem_id, content, updated_at) VALUES (?, ?, ?)')
              .bind(problemId, content, now)
          )
        }
      }
    } else {
      // ── 新格式（D1 表行）──
      if (body.data?.userProblems) {
        for (const r of body.data.userProblems) {
          stmts.push(
            db.prepare('INSERT INTO user_problems (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)')
              .bind(r.id, r.data, r.created_at ?? now, r.updated_at ?? now)
          )
        }
      }
      if (body.data?.modifiedProblems) {
        for (const r of body.data.modifiedProblems) {
          stmts.push(
            db.prepare('INSERT INTO modified_problems (problem_id, data, updated_at) VALUES (?, ?, ?)')
              .bind(r.problem_id, r.data, r.updated_at ?? now)
          )
        }
      }
      if (body.data?.deletedProblems) {
        for (const r of body.data.deletedProblems) {
          stmts.push(
            db.prepare('INSERT INTO deleted_problems (problem_id, deleted_at) VALUES (?, ?)')
              .bind(r.problem_id, r.deleted_at ?? now)
          )
        }
      }
      if (body.data?.progress) {
        for (const r of body.data.progress) {
          stmts.push(
            db.prepare('INSERT INTO progress (problem_id, status, last_viewed, is_wrong) VALUES (?, ?, ?, ?)')
              .bind(r.problem_id, r.status, r.last_viewed, r.is_wrong)
          )
        }
      }
      if (body.data?.groups) {
        for (const r of body.data.groups) {
          stmts.push(
            db.prepare('INSERT INTO groups (id, name, note, problem_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
              .bind(r.id, r.name, r.note, r.problem_ids, r.created_at, r.updated_at)
          )
        }
      }
      if (body.data?.notes) {
        for (const r of body.data.notes) {
          stmts.push(
            db.prepare('INSERT INTO notes (problem_id, content, updated_at) VALUES (?, ?, ?)')
              .bind(r.problem_id, r.content, r.updated_at ?? now)
          )
        }
      }
      if (body.data?.drafts) {
        for (const r of body.data.drafts) {
          stmts.push(
            db.prepare('INSERT INTO drafts (problem_id, content, updated_at) VALUES (?, ?, ?)')
              .bind(r.problem_id, r.content, r.updated_at ?? now)
          )
        }
      }
    }

    await db.batch(stmts)
    return Response.json({ ok: true })
  }

  // ── Migrate from localStorage ──
  if (pathname === '/api/migrate' && method === 'POST') {
    const body = await request.json() as Record<string, any>
    const now = Date.now()

    const stmts = [
      db.prepare('DELETE FROM user_problems'),
      db.prepare('DELETE FROM modified_problems'),
      db.prepare('DELETE FROM deleted_problems'),
      db.prepare('DELETE FROM progress'),
      db.prepare('DELETE FROM groups'),
      db.prepare('DELETE FROM notes'),
      db.prepare('DELETE FROM drafts'),
    ]

    // Migrate problems store data
    const problemsData = body['hot100-user-problems-v1']
    if (problemsData) {
      const parsed = typeof problemsData === 'string' ? JSON.parse(problemsData) : problemsData
      if (parsed.added) {
        for (const p of parsed.added) {
          stmts.push(
            db.prepare('INSERT INTO user_problems (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)')
              .bind(p.id, JSON.stringify(p), now, now)
          )
        }
      }
      if (parsed.modified) {
        for (const [id, p] of Object.entries(parsed.modified)) {
          stmts.push(
            db.prepare('INSERT INTO modified_problems (problem_id, data, updated_at) VALUES (?, ?, ?)')
              .bind(Number(id), JSON.stringify(p), now)
          )
        }
      }
      if (parsed.deleted) {
        for (const id of parsed.deleted) {
          stmts.push(
            db.prepare('INSERT INTO deleted_problems (problem_id, deleted_at) VALUES (?, ?)')
              .bind(id, now)
          )
        }
      }
    }

    // Migrate progress store data
    const progressData = body['hot100-progress-v1']
    if (progressData) {
      const parsed = typeof progressData === 'string' ? JSON.parse(progressData) : progressData
      const wrongSetSet = new Set(parsed.wrongSet ?? [])
      const allIds = new Set([
        ...Object.keys(parsed.status ?? {}).map(Number),
        ...Object.keys(parsed.lastViewed ?? {}).map(Number),
        ...(parsed.wrongSet ?? []),
      ])
      for (const id of allIds) {
        stmts.push(
          db.prepare('INSERT INTO progress (problem_id, status, last_viewed, is_wrong) VALUES (?, ?, ?, ?)')
            .bind(id, parsed.status?.[id] ?? 'unseen', parsed.lastViewed?.[id] ?? null, wrongSetSet.has(id) ? 1 : 0)
        )
      }
    }

    // Migrate groups store data
    const groupsData = body['hot100-groups-v1']
    if (groupsData) {
      const parsed = typeof groupsData === 'string' ? JSON.parse(groupsData) : groupsData
      for (const g of parsed) {
        stmts.push(
          db.prepare('INSERT INTO groups (id, name, note, problem_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(g.id, g.name, g.note ?? '', JSON.stringify(g.problemIds), g.createdAt, g.updatedAt)
        )
      }
    }

    // Migrate per-problem notes and drafts
    for (const [key, value] of Object.entries(body)) {
      if (key.startsWith('hot100-note-')) {
        const problemId = Number(key.replace('hot100-note-', ''))
        const content = typeof value === 'string' ? value : JSON.stringify(value)
        stmts.push(
          db.prepare('INSERT OR REPLACE INTO notes (problem_id, content, updated_at) VALUES (?, ?, ?)')
            .bind(problemId, content, now)
        )
      } else if (key.startsWith('hot100-draft-')) {
        const problemId = Number(key.replace('hot100-draft-', ''))
        const content = typeof value === 'string' ? value : JSON.stringify(value)
        stmts.push(
          db.prepare('INSERT OR REPLACE INTO drafts (problem_id, content, updated_at) VALUES (?, ?, ?)')
            .bind(problemId, content, now)
        )
      }
    }

    await db.batch(stmts)
    return Response.json({ ok: true, migrated: stmts.length })
  }

  return Response.json({ error: 'Not Found' }, { status: 404 })
}
