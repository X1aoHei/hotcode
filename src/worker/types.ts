export interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  all<T = unknown>(): Promise<{ results: T[] }>
  run(): Promise<D1Result>
}

interface D1Result {
  success: boolean
  meta: Record<string, unknown>
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result[]>
  exec(sql: string): Promise<D1Result>
}

export interface Env {
  DB: D1Database
}
