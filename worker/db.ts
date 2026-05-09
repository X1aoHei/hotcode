/// <reference types="@cloudflare/workers-types" />
/**
 * D1 数据库查询封装层
 */

interface Problem {
  id: number
  title: string
  slug: string
  difficulty: string
  tags: string[]
  description: string
  approach: string
  code: string
  timeComplexity?: string
  spaceComplexity?: string
  draft?: string
}

interface UserData {
  added: Problem[]
  modified: Record<number, Problem>
  deleted: number[]
}

interface ProgressRecord {
  status: string
  lastViewed: number
}

interface ContentRecord {
  note: string
  draft: string
}

function rowToProblem(row: Record<string, unknown>): Problem {
  return {
    id: row.problem_id as number,
    title: row.title as string,
    slug: row.slug as string,
    difficulty: row.difficulty as string,
    tags: JSON.parse(row.tags as string || '[]'),
    description: row.description as string,
    approach: row.approach as string,
    code: row.code as string,
    timeComplexity: row.time_complexity as string | undefined,
    spaceComplexity: row.space_complexity as string | undefined,
    draft: row.draft as string | undefined,
  }
}

export async function getUserProblems(db: D1Database): Promise<UserData> {
  const [problems, deleted] = await Promise.all([
    db.prepare('SELECT * FROM user_problems').all(),
    db.prepare('SELECT problem_id FROM deleted_problems').all(),
  ])

  const added: Problem[] = []
  const modified: Record<number, Problem> = {}

  for (const row of problems.results ?? []) {
    const p = rowToProblem(row)
    if (row.is_custom) {
      added.push(p)
    } else {
      modified[p.id] = p
    }
  }

  const deletedIds = (deleted.results ?? []).map((r) => r.problem_id as number)

  return { added, modified, deleted: deletedIds }
}

export async function upsertProblem(db: D1Database, p: Problem, isCustom: boolean): Promise<void> {
  await db.prepare(
    `INSERT INTO user_problems (problem_id, title, slug, difficulty, tags, description, approach, code, time_complexity, space_complexity, draft, is_custom, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(problem_id) DO UPDATE SET
       title=excluded.title, slug=excluded.slug, difficulty=excluded.difficulty,
       tags=excluded.tags, description=excluded.description, approach=excluded.approach,
       code=excluded.code, time_complexity=excluded.time_complexity,
       space_complexity=excluded.space_complexity, draft=excluded.draft,
       is_custom=excluded.is_custom, updated_at=excluded.updated_at`
  ).bind(
    p.id, p.title, p.slug, p.difficulty,
    JSON.stringify(p.tags), p.description, p.approach, p.code,
    p.timeComplexity ?? null, p.spaceComplexity ?? null, p.draft ?? null,
    isCustom ? 1 : 0
  ).run()
}

export async function deleteProblem(db: D1Database, id: number): Promise<void> {
  // 先检查是否为自定义题目
  const row = await db.prepare('SELECT is_custom FROM user_problems WHERE problem_id = ?').bind(id).first()
  if (row && row.is_custom) {
    await db.prepare('DELETE FROM user_problems WHERE problem_id = ?').bind(id).run()
  } else {
    // 内置题目：标记删除，并移除可能的修改记录
    await db.prepare('INSERT OR IGNORE INTO deleted_problems (problem_id) VALUES (?)').bind(id).run()
    await db.prepare('DELETE FROM user_problems WHERE problem_id = ? AND is_custom = 0').bind(id).run()
  }
}

export async function resetProblem(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM user_problems WHERE problem_id = ?').bind(id).run()
  await db.prepare('DELETE FROM deleted_problems WHERE problem_id = ?').bind(id).run()
}

export async function getProgress(db: D1Database): Promise<Record<number, ProgressRecord>> {
  const { results } = await db.prepare('SELECT * FROM progress').all()
  const map: Record<number, ProgressRecord> = {}
  for (const row of results ?? []) {
    map[row.problem_id as number] = {
      status: row.status as string,
      lastViewed: row.last_viewed as number,
    }
  }
  return map
}

export async function updateProgress(db: D1Database, id: number, data: { status?: string; lastViewed?: number }): Promise<void> {
  await db.prepare(
    `INSERT INTO progress (problem_id, status, last_viewed) VALUES (?, ?, ?)
     ON CONFLICT(problem_id) DO UPDATE SET
       status=COALESCE(excluded.status, status),
       last_viewed=CASE WHEN excluded.last_viewed > 0 THEN excluded.last_viewed ELSE last_viewed END`
  ).bind(id, data.status ?? 'unseen', data.lastViewed ?? 0).run()
}

export async function resetProgress(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM progress').run()
}

export async function getContent(db: D1Database, id: number): Promise<ContentRecord> {
  const row = await db.prepare('SELECT note, draft FROM problem_content WHERE problem_id = ?').bind(id).first()
  return {
    note: (row?.note as string) ?? '',
    draft: (row?.draft as string) ?? '',
  }
}

export async function updateContent(db: D1Database, id: number, data: { note?: string; draft?: string }): Promise<void> {
  // 先尝试更新
  const existing = await db.prepare('SELECT 1 FROM problem_content WHERE problem_id = ?').bind(id).first()
  if (existing) {
    const sets: string[] = []
    const vals: unknown[] = []
    if (data.note !== undefined) { sets.push('note = ?'); vals.push(data.note) }
    if (data.draft !== undefined) { sets.push('draft = ?'); vals.push(data.draft) }
    if (sets.length === 0) return
    sets.push("updated_at = datetime('now')")
    vals.push(id)
    await db.prepare(`UPDATE problem_content SET ${sets.join(', ')} WHERE problem_id = ?`).bind(...vals).run()
  } else {
    await db.prepare(
      `INSERT INTO problem_content (problem_id, note, draft, updated_at) VALUES (?, ?, ?, datetime('now'))`
    ).bind(id, data.note ?? null, data.draft ?? null).run()
  }
}

export async function deleteContent(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM problem_content WHERE problem_id = ?').bind(id).run()
}

// ── 导出全部数据 ──

export async function exportAll(db: D1Database): Promise<Record<string, unknown>> {
  const [userData, progressResult, contentRows] = await Promise.all([
    getUserProblems(db),
    db.prepare('SELECT * FROM progress').all(),
    db.prepare('SELECT * FROM problem_content').all(),
  ])

  const data: Record<string, unknown> = {}

  // 用户题目数据
  data['hot100-user-problems-v1'] = userData

  // 进度数据
  const progressState: { status: Record<number, string>; lastViewed: Record<number, number> } = { status: {}, lastViewed: {} }
  for (const row of progressResult.results ?? []) {
    const id = row.problem_id as number
    progressState.status[id] = row.status as string
    progressState.lastViewed[id] = row.last_viewed as number
  }
  data['hot100-progress-v1'] = progressState

  // 笔记和草稿
  for (const row of contentRows.results ?? []) {
    const id = row.problem_id as number
    if (row.note) data[`hot100-note-${id}`] = row.note
    if (row.draft) data[`hot100-draft-${id}`] = row.draft
  }

  return data
}

// ── 导入数据（覆盖） ──

export async function importAll(db: D1Database, payload: Record<string, unknown>): Promise<number> {
  const stmts: D1PreparedStatement[] = []

  // 清空所有表
  stmts.push(db.prepare('DELETE FROM user_problems'))
  stmts.push(db.prepare('DELETE FROM deleted_problems'))
  stmts.push(db.prepare('DELETE FROM progress'))
  stmts.push(db.prepare('DELETE FROM problem_content'))

  let count = 0

  for (const [key, value] of Object.entries(payload)) {
    if (key === 'hot100-user-problems-v1' && typeof value === 'object' && value !== null) {
      const ud = value as UserData
      for (const p of ud.added ?? []) {
        stmts.push(db.prepare(
          `INSERT INTO user_problems (problem_id, title, slug, difficulty, tags, description, approach, code, time_complexity, space_complexity, draft, is_custom)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
        ).bind(p.id, p.title, p.slug, p.difficulty, JSON.stringify(p.tags), p.description, p.approach, p.code, p.timeComplexity ?? null, p.spaceComplexity ?? null, p.draft ?? null))
        count++
      }
      for (const [, p] of Object.entries(ud.modified ?? {})) {
        stmts.push(db.prepare(
          `INSERT INTO user_problems (problem_id, title, slug, difficulty, tags, description, approach, code, time_complexity, space_complexity, draft, is_custom)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
        ).bind(p.id, p.title, p.slug, p.difficulty, JSON.stringify(p.tags), p.description, p.approach, p.code, p.timeComplexity ?? null, p.spaceComplexity ?? null, p.draft ?? null))
        count++
      }
      for (const id of ud.deleted ?? []) {
        stmts.push(db.prepare('INSERT OR IGNORE INTO deleted_problems (problem_id) VALUES (?)').bind(id))
        count++
      }
    } else if (key === 'hot100-progress-v1' && typeof value === 'object' && value !== null) {
      const ps = value as { status?: Record<number, string>; lastViewed?: Record<number, number> }
      const ids = new Set([...Object.keys(ps.status ?? {}), ...Object.keys(ps.lastViewed ?? {})])
      for (const idStr of ids) {
        const id = Number(idStr)
        stmts.push(db.prepare(
          `INSERT INTO progress (problem_id, status, last_viewed) VALUES (?, ?, ?)`
        ).bind(id, ps.status?.[id] ?? 'unseen', ps.lastViewed?.[id] ?? 0))
        count++
      }
    } else if (key.startsWith('hot100-note-')) {
      const id = Number(key.replace('hot100-note-', ''))
      if (id) {
        stmts.push(db.prepare(
          `INSERT INTO problem_content (problem_id, note) VALUES (?, ?) ON CONFLICT(problem_id) DO UPDATE SET note=excluded.note`
        ).bind(id, typeof value === 'string' ? value : JSON.stringify(value)))
        count++
      }
    } else if (key.startsWith('hot100-draft-')) {
      const id = Number(key.replace('hot100-draft-', ''))
      if (id) {
        stmts.push(db.prepare(
          `INSERT INTO problem_content (problem_id, draft) VALUES (?, ?) ON CONFLICT(problem_id) DO UPDATE SET draft=excluded.draft`
        ).bind(id, typeof value === 'string' ? value : JSON.stringify(value)))
        count++
      }
    }
  }

  // 分批执行（D1 限制每批最多 100 条）
  for (let i = 0; i < stmts.length; i += 100) {
    await db.batch(stmts.slice(i, i + 100))
  }

  return count
}
