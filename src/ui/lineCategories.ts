export type LineCategory = {
  readonly line: string
  readonly count: number
}

export type LineGroup<T> = {
  readonly line: string
  readonly rows: readonly T[]
}

export type LineReader<T> = (row: T) => readonly string[]

export function getLineCategories<T>(
  rows: readonly T[],
  readLines: LineReader<T>,
): readonly LineCategory[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    for (const line of uniqueLines(readLines(row))) {
      counts.set(line, (counts.get(line) ?? 0) + 1)
    }
  }
  return Array.from(counts, ([line, count]) => ({ line, count })).sort(compareLineCategories)
}

export function filterRowsByLine<T>(
  rows: readonly T[],
  selectedLine: string,
  readLines: LineReader<T>,
): readonly T[] {
  if (selectedLine.length === 0) return rows
  return rows.filter((row) => uniqueLines(readLines(row)).includes(selectedLine))
}

export function groupRowsByLine<T>(
  rows: readonly T[],
  readLines: LineReader<T>,
): readonly LineGroup<T>[] {
  const groups = new Map<string, T[]>()
  for (const row of rows) {
    for (const line of uniqueLines(readLines(row))) {
      const current = groups.get(line) ?? []
      current.push(row)
      groups.set(line, current)
    }
  }
  return Array.from(groups, ([line, groupedRows]) => ({ line, rows: groupedRows })).sort(
    compareLineGroups,
  )
}

export function normalizeSelectedLine(
  selectedLine: string,
  categories: readonly LineCategory[],
): string {
  return categories.some((category) => category.line === selectedLine) ? selectedLine : ""
}

function uniqueLines(lines: readonly string[]): readonly string[] {
  return Array.from(new Set(lines.map((line) => line.trim()).filter((line) => line.length > 0)))
}

function compareLineCategories(left: LineCategory, right: LineCategory): number {
  return left.line.localeCompare(right.line, "ko-KR", { numeric: true })
}

function compareLineGroups<T>(left: LineGroup<T>, right: LineGroup<T>): number {
  return left.line.localeCompare(right.line, "ko-KR", { numeric: true })
}
