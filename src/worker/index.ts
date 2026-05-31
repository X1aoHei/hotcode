import type { Env, D1PreparedStatement, D1Database } from './types'

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

// SQL 日志辅助：包装 prepare，在执行前打印 SQL + 参数
function loggedPrepare(db: D1Database, sql: string, params?: unknown[]) {
  console.log('[SQL]', sql, params ?? '')
  return db.prepare(sql)
}

async function handleApi(url: URL, request: Request, env: Env): Promise<Response> {
  const { pathname } = url
  const method = request.method
  const db = env.DB

  // ── User Problems ──
  if (pathname === '/api/user-problems' && method === 'GET') {
    const added = await loggedPrepare(db, 'SELECT data FROM user_problems').all()
    const modified = await loggedPrepare(db, 'SELECT problem_id, data FROM modified_problems').all()
    const deleted = await loggedPrepare(db, 'SELECT problem_id FROM deleted_problems').all()
    return Response.json({
      added: added.results.map((r: any) => JSON.parse(r.data)),
      modified: Object.fromEntries(modified.results.map((r: any) => [r.problem_id, JSON.parse(r.data)])),
      deleted: deleted.results.map((r: any) => r.problem_id),
    })
  }

  if (pathname === '/api/user-problems' && method === 'POST') {
    const body = await request.json() as { added: any[]; modified: Record<number, any>; deleted: number[] }
    const now = Date.now()

    console.log('[SQL] POST /api/user-problems', { added: body.added.length, modified: Object.keys(body.modified).length, deleted: body.deleted.length })

    await db.batch([
      loggedPrepare(db, 'DELETE FROM user_problems'),
      loggedPrepare(db, 'DELETE FROM modified_problems'),
      loggedPrepare(db, 'DELETE FROM deleted_problems'),
      ...body.added.map((p) =>
        loggedPrepare(db, 'INSERT INTO user_problems (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)', [p.id, JSON.stringify(p), now, now])
          .bind(p.id, JSON.stringify(p), now, now)
      ),
      ...Object.entries(body.modified).map(([id, p]) =>
        loggedPrepare(db, 'INSERT OR REPLACE INTO modified_problems (problem_id, data, updated_at) VALUES (?, ?, ?)', [Number(id), JSON.stringify(p), now])
          .bind(Number(id), JSON.stringify(p), now)
      ),
      ...body.deleted.map((id) =>
        loggedPrepare(db, 'INSERT OR IGNORE INTO deleted_problems (problem_id, deleted_at) VALUES (?, ?)', [id, now])
          .bind(id, now)
      ),
    ])

    return Response.json({ ok: true })
  }

  // ── Progress ──
  if (pathname === '/api/progress' && method === 'GET') {
    const rows = await loggedPrepare(db, 'SELECT problem_id, status, last_viewed, is_wrong FROM progress').all()
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

    console.log('[SQL] POST /api/progress', { ids: allIds.size })

    const stmts = [loggedPrepare(db, 'DELETE FROM progress')]
    for (const id of allIds) {
      stmts.push(
        loggedPrepare(db, 'INSERT INTO progress (problem_id, status, last_viewed, is_wrong) VALUES (?, ?, ?, ?)', [id, body.status[id] ?? 'unseen', body.lastViewed[id] ?? null, wrongSetSet.has(id) ? 1 : 0])
          .bind(id, body.status[id] ?? 'unseen', body.lastViewed[id] ?? null, wrongSetSet.has(id) ? 1 : 0)
      )
    }
    await db.batch(stmts)
    return Response.json({ ok: true })
  }

  // ── Groups ──
  if (pathname === '/api/groups' && method === 'GET') {
    const rows = await loggedPrepare(db, 'SELECT * FROM groups ORDER BY updated_at DESC').all()
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
    console.log('[SQL] POST /api/groups', { count: groups.length })
    const incomingIds = new Set(groups.map((g: any) => g.id))
    const existing = await loggedPrepare(db, 'SELECT id FROM groups').all()
    const toDelete = (existing.results as any[]).map((r: any) => r.id).filter((id: string) => !incomingIds.has(id))
    const stmts = []
    if (toDelete.length > 0) {
      for (const id of toDelete) {
        stmts.push(loggedPrepare(db, 'DELETE FROM groups WHERE id = ?', [id]).bind(id))
      }
    }
    for (const g of groups) {
      stmts.push(
        loggedPrepare(db, 'INSERT OR REPLACE INTO groups (id, name, note, problem_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [g.id, g.name, g.note ?? '', JSON.stringify(g.problemIds), g.createdAt, g.updatedAt])
          .bind(g.id, g.name, g.note ?? '', JSON.stringify(g.problemIds), g.createdAt, g.updatedAt)
      )
    }
    await db.batch(stmts)
    return Response.json({ ok: true })
  }

  // ── Review Rounds ──
  if (pathname === '/api/review-rounds' && method === 'GET') {
    const rows = await loggedPrepare(db, 'SELECT * FROM review_rounds ORDER BY updated_at DESC').all()
    const rounds = (rows.results as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      note: r.note,
      problemIds: JSON.parse(r.problem_ids),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
    return Response.json(rounds)
  }

  if (pathname === '/api/review-rounds' && method === 'POST') {
    const rounds = await request.json() as any[]
    console.log('[SQL] POST /api/review-rounds', { count: rounds.length })
    const incomingIds = new Set(rounds.map((r: any) => r.id))
    const existing = await loggedPrepare(db, 'SELECT id FROM review_rounds').all()
    const toDelete = (existing.results as any[]).map((r: any) => r.id).filter((id: string) => !incomingIds.has(id))
    const stmts = []
    if (toDelete.length > 0) {
      for (const id of toDelete) {
        stmts.push(loggedPrepare(db, 'DELETE FROM review_rounds WHERE id = ?', [id]).bind(id))
      }
    }
    for (const r of rounds) {
      stmts.push(
        loggedPrepare(db, 'INSERT OR REPLACE INTO review_rounds (id, name, note, problem_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [r.id, r.name, r.note ?? '', JSON.stringify(r.problemIds), r.createdAt, r.updatedAt])
          .bind(r.id, r.name, r.note ?? '', JSON.stringify(r.problemIds), r.createdAt, r.updatedAt)
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
      console.log('[SQL] GET /api/notes/' + problemId)
      const row = await loggedPrepare(db, 'SELECT content FROM notes WHERE problem_id = ?', [problemId]).bind(problemId).first()
      return Response.json({ content: row ? (row as any).content : '' })
    }
    if (method === 'PUT') {
      const { content } = await request.json() as { content: string }
      const now = Date.now()
      console.log('[SQL] PUT /api/notes/' + problemId, { content: content.substring(0, 50) + (content.length > 50 ? '...' : '') })
      await loggedPrepare(db, 'INSERT OR REPLACE INTO notes (problem_id, content, updated_at) VALUES (?, ?, ?)', [problemId, content, now])
        .bind(problemId, content, now)
        .run()
      return Response.json({ ok: true })
    }
    if (method === 'DELETE') {
      console.log('[SQL] DELETE /api/notes/' + problemId)
      await loggedPrepare(db, 'DELETE FROM notes WHERE problem_id = ?', [problemId]).bind(problemId).run()
      return Response.json({ ok: true })
    }
  }

  // ── Drafts ──
  const draftMatch = pathname.match(/^\/api\/drafts\/(\d+)$/)
  if (draftMatch) {
    const problemId = Number(draftMatch[1])
    if (method === 'GET') {
      console.log('[SQL] GET /api/drafts/' + problemId)
      const row = await loggedPrepare(db, 'SELECT content FROM drafts WHERE problem_id = ?', [problemId]).bind(problemId).first()
      return Response.json({ content: row ? (row as any).content : '' })
    }
    if (method === 'PUT') {
      const { content } = await request.json() as { content: string }
      const now = Date.now()
      console.log('[SQL] PUT /api/drafts/' + problemId, { content: content.substring(0, 50) + (content.length > 50 ? '...' : '') })
      await loggedPrepare(db, 'INSERT OR REPLACE INTO drafts (problem_id, content, updated_at) VALUES (?, ?, ?)', [problemId, content, now])
        .bind(problemId, content, now)
      return Response.json({ ok: true })
    }
    if (method === 'DELETE') {
      console.log('[SQL] DELETE /api/drafts/' + problemId)
      await loggedPrepare(db, 'DELETE FROM drafts WHERE problem_id = ?', [problemId]).bind(problemId)
      return Response.json({ ok: true })
    }
  }

  // ── Export ──
  if (pathname === '/api/export' && method === 'GET') {
    console.log('[SQL] GET /api/export - exporting all tables')
    const [userProblems, modifiedProblems, deletedProblems, progressRows, groupsRows, reviewRoundsRows, notesRows, draftsRows] =
      await Promise.all([
        loggedPrepare(db, 'SELECT * FROM user_problems').all(),
        loggedPrepare(db, 'SELECT * FROM modified_problems').all(),
        loggedPrepare(db, 'SELECT * FROM deleted_problems').all(),
        loggedPrepare(db, 'SELECT * FROM progress').all(),
        loggedPrepare(db, 'SELECT * FROM groups').all(),
        loggedPrepare(db, 'SELECT * FROM review_rounds').all(),
        loggedPrepare(db, 'SELECT * FROM notes').all(),
        loggedPrepare(db, 'SELECT * FROM drafts').all(),
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
        reviewRounds: reviewRoundsRows.results,
        notes: notesRows.results,
        drafts: draftsRows.results,
      },
    })
  }

  // ── Import ──
  if (pathname === '/api/import' && method === 'POST') {
    const body = await request.json() as any
    const now = Date.now()

    console.log('[SQL] POST /api/import', { version: body.version, isLegacy: !body.data?.userProblems })

    // 判断格式：新格式有 data.userProblems，旧格式有 data['hot100-user-problems-v1']
    const isLegacy = body.data && !body.data.userProblems

    // 按表分组构建 INSERT 语句，每张表的 DELETE + INSERT 放在同一个 batch 中执行
    const tableBatches: D1PreparedStatement[][] = []

    if (isLegacy) {
      // ── 旧格式（localStorage key-value）──
      const data = body.data as Record<string, any>

      // 题目
      const problemsData = data['hot100-user-problems-v1']
      if (problemsData) {
        const parsed = typeof problemsData === 'string' ? JSON.parse(problemsData) : problemsData
        console.log('[SQL] Import legacy problems', { added: parsed.added?.length ?? 0, modified: Object.keys(parsed.modified ?? {}).length, deleted: parsed.deleted?.length ?? 0 })
        const problemStmts: D1PreparedStatement[] = [
          loggedPrepare(db, 'DELETE FROM user_problems'),
          loggedPrepare(db, 'DELETE FROM modified_problems'),
          loggedPrepare(db, 'DELETE FROM deleted_problems'),
        ]
        if (parsed.added) {
          for (const p of parsed.added) {
            problemStmts.push(
              loggedPrepare(db, 'INSERT INTO user_problems (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)', [p.id, JSON.stringify(p), now, now])
                .bind(p.id, JSON.stringify(p), now, now)
            )
          }
        }
        if (parsed.modified) {
          for (const [id, p] of Object.entries(parsed.modified)) {
            problemStmts.push(
              loggedPrepare(db, 'INSERT INTO modified_problems (problem_id, data, updated_at) VALUES (?, ?, ?)', [Number(id), JSON.stringify(p), now])
                .bind(Number(id), JSON.stringify(p), now)
            )
          }
        }
        if (parsed.deleted) {
          for (const id of parsed.deleted) {
            problemStmts.push(
              loggedPrepare(db, 'INSERT INTO deleted_problems (problem_id, deleted_at) VALUES (?, ?)', [id, now])
                .bind(id, now)
            )
          }
        }
        tableBatches.push(problemStmts)
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
        console.log('[SQL] Import legacy progress', { ids: allIds.size })
        const progressStmts: D1PreparedStatement[] = [loggedPrepare(db, 'DELETE FROM progress')]
        for (const id of allIds) {
          progressStmts.push(
            loggedPrepare(db, 'INSERT INTO progress (problem_id, status, last_viewed, is_wrong) VALUES (?, ?, ?, ?)', [id, parsed.status?.[id] ?? 'unseen', parsed.lastViewed?.[id] ?? null, wrongSetSet.has(id) ? 1 : 0])
              .bind(id, parsed.status?.[id] ?? 'unseen', parsed.lastViewed?.[id] ?? null, wrongSetSet.has(id) ? 1 : 0)
          )
        }
        tableBatches.push(progressStmts)
      }

      // 组合
      const groupsData = data['hot100-groups-v1']
      if (groupsData) {
        const parsed = typeof groupsData === 'string' ? JSON.parse(groupsData) : groupsData
        console.log('[SQL] Import legacy groups', { count: parsed.length })
        const groupStmts: D1PreparedStatement[] = [loggedPrepare(db, 'DELETE FROM groups')]
        for (const g of parsed) {
          groupStmts.push(
            loggedPrepare(db, 'INSERT INTO groups (id, name, note, problem_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [g.id, g.name, g.note ?? '', JSON.stringify(g.problemIds), g.createdAt, g.updatedAt])
              .bind(g.id, g.name, g.note ?? '', JSON.stringify(g.problemIds), g.createdAt, g.updatedAt)
          )
        }
        tableBatches.push(groupStmts)
      }

      // 笔记
      const noteStmts: D1PreparedStatement[] = [loggedPrepare(db, 'DELETE FROM notes')]
      // 草稿
      const draftStmts: D1PreparedStatement[] = [loggedPrepare(db, 'DELETE FROM drafts')]

      let noteCount = 0
      let draftCount = 0
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('hot100-note-')) {
          const problemId = Number(key.replace('hot100-note-', ''))
          const content = typeof value === 'string' ? value : JSON.stringify(value)
          noteStmts.push(
            loggedPrepare(db, 'INSERT OR REPLACE INTO notes (problem_id, content, updated_at) VALUES (?, ?, ?)', [problemId, content, now])
              .bind(problemId, content, now)
          )
          noteCount++
        } else if (key.startsWith('hot100-draft-')) {
          const problemId = Number(key.replace('hot100-draft-', ''))
          const content = typeof value === 'string' ? value : JSON.stringify(value)
          draftStmts.push(
            loggedPrepare(db, 'INSERT OR REPLACE INTO drafts (problem_id, content, updated_at) VALUES (?, ?, ?)', [problemId, content, now])
              .bind(problemId, content, now)
          )
          draftCount++
        }
      }
      if (noteStmts.length > 1) {
        console.log('[SQL] Import legacy notes', { count: noteCount })
        tableBatches.push(noteStmts)
      }
      if (draftStmts.length > 1) {
        console.log('[SQL] Import legacy drafts', { count: draftCount })
        tableBatches.push(draftStmts)
      }
    } else {
      // ── 新格式（D1 表行）──
      if (body.data?.userProblems || body.data?.modifiedProblems || body.data?.deletedProblems) {
        console.log('[SQL] Import new format problems', { user: body.data.userProblems?.length ?? 0, modified: body.data.modifiedProblems?.length ?? 0, deleted: body.data.deletedProblems?.length ?? 0 })
        const problemStmts: D1PreparedStatement[] = [
          loggedPrepare(db, 'DELETE FROM user_problems'),
          loggedPrepare(db, 'DELETE FROM modified_problems'),
          loggedPrepare(db, 'DELETE FROM deleted_problems'),
        ]
        for (const r of (body.data.userProblems ?? [])) {
          problemStmts.push(
            loggedPrepare(db, 'INSERT INTO user_problems (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)', [r.id, r.data, r.created_at ?? now, r.updated_at ?? now])
              .bind(r.id, r.data, r.created_at ?? now, r.updated_at ?? now)
          )
        }
        for (const r of (body.data.modifiedProblems ?? [])) {
          problemStmts.push(
            loggedPrepare(db, 'INSERT INTO modified_problems (problem_id, data, updated_at) VALUES (?, ?, ?)', [r.problem_id, r.data, r.updated_at ?? now])
              .bind(r.problem_id, r.data, r.updated_at ?? now)
          )
        }
        for (const r of (body.data.deletedProblems ?? [])) {
          problemStmts.push(
            loggedPrepare(db, 'INSERT INTO deleted_problems (problem_id, deleted_at) VALUES (?, ?)', [r.problem_id, r.deleted_at ?? now])
              .bind(r.problem_id, r.deleted_at ?? now)
          )
        }
        tableBatches.push(problemStmts)
      }
      if (body.data?.progress) {
        console.log('[SQL] Import new format progress', { count: body.data.progress.length })
        const progressStmts: D1PreparedStatement[] = [loggedPrepare(db, 'DELETE FROM progress')]
        for (const r of body.data.progress) {
          progressStmts.push(
            loggedPrepare(db, 'INSERT INTO progress (problem_id, status, last_viewed, is_wrong) VALUES (?, ?, ?, ?)', [r.problem_id, r.status, r.last_viewed, r.is_wrong])
              .bind(r.problem_id, r.status, r.last_viewed, r.is_wrong)
          )
        }
        tableBatches.push(progressStmts)
      }
      if (body.data?.groups) {
        console.log('[SQL] Import new format groups', { count: body.data.groups.length })
        const groupStmts: D1PreparedStatement[] = [loggedPrepare(db, 'DELETE FROM groups')]
        for (const r of body.data.groups) {
          groupStmts.push(
            loggedPrepare(db, 'INSERT INTO groups (id, name, note, problem_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [r.id, r.name, r.note, r.problem_ids, r.created_at, r.updated_at])
              .bind(r.id, r.name, r.note, r.problem_ids, r.created_at, r.updated_at)
          )
        }
        tableBatches.push(groupStmts)
      }
      if (body.data?.reviewRounds) {
        console.log('[SQL] Import new format reviewRounds', { count: body.data.reviewRounds.length })
        const roundStmts: D1PreparedStatement[] = [loggedPrepare(db, 'DELETE FROM review_rounds')]
        for (const r of body.data.reviewRounds) {
          roundStmts.push(
            loggedPrepare(db, 'INSERT INTO review_rounds (id, name, note, problem_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [r.id, r.name, r.note, r.problem_ids, r.created_at, r.updated_at])
              .bind(r.id, r.name, r.note, r.problem_ids, r.created_at, r.updated_at)
          )
        }
        tableBatches.push(roundStmts)
      }
      if (body.data?.notes) {
        console.log('[SQL] Import new format notes', { count: body.data.notes.length })
        const noteStmts: D1PreparedStatement[] = [loggedPrepare(db, 'DELETE FROM notes')]
        for (const r of body.data.notes) {
          noteStmts.push(
            loggedPrepare(db, 'INSERT INTO notes (problem_id, content, updated_at) VALUES (?, ?, ?)', [r.problem_id, r.content, r.updated_at ?? now])
              .bind(r.problem_id, r.content, r.updated_at ?? now)
          )
        }
        tableBatches.push(noteStmts)
      }
      if (body.data?.drafts) {
        console.log('[SQL] Import new format drafts', { count: body.data.drafts.length })
        const draftStmts: D1PreparedStatement[] = [loggedPrepare(db, 'DELETE FROM drafts')]
        for (const r of body.data.drafts) {
          draftStmts.push(
            loggedPrepare(db, 'INSERT INTO drafts (problem_id, content, updated_at) VALUES (?, ?, ?)', [r.problem_id, r.content, r.updated_at ?? now])
              .bind(r.problem_id, r.content, r.updated_at ?? now)
          )
        }
        tableBatches.push(draftStmts)
      }
    }

    // 按表依次执行 batch，每张表的 DELETE + INSERT 是原子操作
    console.log('[SQL] Import executing', tableBatches.length, 'table batches')
    for (let i = 0; i < tableBatches.length; i++) {
      console.log('[SQL] Import batch', i + 1, '/', tableBatches.length, '- statements:', tableBatches[i].length)
      await db.batch(tableBatches[i])
    }
    console.log('[SQL] Import completed successfully')
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Not Found' }, { status: 404 })
}
