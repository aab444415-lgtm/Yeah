import { z } from "zod"
import {
  type QuantityReport,
  QuantityReportSchema,
  type WorkReport,
  WorkReportSchema,
  type WorkReportView,
  deriveWorkReportView,
} from "./reports"

export const STORAGE_KEY = "worklog-quantity-app:v1"

export const ReportStoreSchema = z.object({
  version: z.literal(1),
  quantityReports: z.array(QuantityReportSchema),
  workReports: z.array(WorkReportSchema),
})

export type ReportStore = z.infer<typeof ReportStoreSchema>

export type JoinedResult =
  | { readonly kind: "ok"; readonly rows: readonly WorkReportView[] }
  | { readonly kind: "error"; readonly message: string }

export type ImportResult =
  | { readonly kind: "success"; readonly message: string; readonly data: ReportStore }
  | { readonly kind: "error"; readonly message: string; readonly data: ReportStore }

export type SummaryRow = {
  readonly date: string
  readonly line: string
  readonly equipmentUnit: string
  readonly meterCount: number
  readonly quantityCount: number
  readonly workCount: number
  readonly totalWorkers: number
  readonly quantityReports: readonly QuantityReport[]
  readonly workReports: readonly WorkReportView[]
}

type SummaryDraft = {
  readonly key: string
  readonly date: string
  readonly line: string
  readonly equipmentUnit: string
  readonly quantityReports: QuantityReport[]
  readonly workReports: WorkReportView[]
}

export const EMPTY_STORE: ReportStore = {
  version: 1,
  quantityReports: [],
  workReports: [],
}

export function parseStoredData(value: string | null): ReportStore {
  if (value === null) return EMPTY_STORE
  try {
    const raw: unknown = JSON.parse(value)
    const parsed = ReportStoreSchema.safeParse(raw)
    return parsed.success && isStoreConsistent(parsed.data) ? parsed.data : EMPTY_STORE
  } catch (error) {
    if (error instanceof SyntaxError) return EMPTY_STORE
    throw error
  }
}

export function serializeStore(data: ReportStore): string {
  return JSON.stringify(data, null, 2)
}

export function joinWorkReports(
  quantityReports: readonly QuantityReport[],
  workReports: readonly WorkReport[],
): JoinedResult {
  const quantityById = new Map(quantityReports.map((report) => [report.id, report]))
  const rows: WorkReportView[] = []
  for (const workReport of workReports) {
    const quantityReport = quantityById.get(workReport.quantityReportId)
    if (quantityReport === undefined) {
      return {
        kind: "error",
        message: "작업일보가 존재하지 않는 물량일보에 연결되어 있습니다.",
      }
    }
    rows.push(deriveWorkReportView(workReport, quantityReport))
  }
  return { kind: "ok", rows }
}

export function summarizeReports(data: ReportStore): readonly SummaryRow[] {
  const drafts = new Map<string, SummaryDraft>()
  for (const quantity of data.quantityReports) {
    const key = summaryKey(quantity)
    const current = drafts.get(key)
    if (current === undefined) {
      drafts.set(key, {
        key,
        date: quantity.date,
        line: quantity.line,
        equipmentUnit: quantity.equipmentUnit,
        quantityReports: [quantity],
        workReports: [],
      })
    } else {
      current.quantityReports.push(quantity)
    }
  }

  const joined = joinWorkReports(data.quantityReports, data.workReports)
  if (joined.kind === "ok") {
    for (const workReport of joined.rows) {
      const key = summaryKey(workReport)
      const current = drafts.get(key)
      if (current !== undefined) current.workReports.push(workReport)
    }
  }

  return Array.from(drafts.values()).map(toSummaryRow).sort(compareSummaryRows)
}

export function exportBackup(data: ReportStore): string {
  return serializeStore(data)
}

export function importBackup(source: string, current: ReportStore): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(source)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        kind: "error",
        message: "가져올 JSON 형식이 올바르지 않습니다.",
        data: current,
      }
    }
    throw error
  }

  const parsed = ReportStoreSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      kind: "error",
      message: "가져올 데이터 구조가 올바르지 않습니다.",
      data: current,
    }
  }

  if (!hasUniqueStoreIds(parsed.data)) {
    return {
      kind: "error",
      message: "가져올 데이터에 중복된 ID가 있습니다.",
      data: current,
    }
  }

  if (hasOrphanWorkReports(parsed.data)) {
    return {
      kind: "error",
      message: "가져올 작업일보가 존재하지 않는 물량일보에 연결되어 있습니다.",
      data: current,
    }
  }

  const currentQuantityIds = new Set(current.quantityReports.map((report) => report.id))
  const currentWorkIds = new Set(current.workReports.map((report) => report.id))
  const nextQuantity = parsed.data.quantityReports.filter(
    (report) => !currentQuantityIds.has(report.id),
  )
  const nextWork = parsed.data.workReports.filter((report) => !currentWorkIds.has(report.id))
  const nextData: ReportStore = {
    version: 1,
    quantityReports: [...current.quantityReports, ...nextQuantity],
    workReports: [...current.workReports, ...nextWork],
  }
  const skipped =
    parsed.data.quantityReports.length +
    parsed.data.workReports.length -
    nextQuantity.length -
    nextWork.length

  return {
    kind: "success",
    message: `가져오기 완료: 물량일보 ${nextQuantity.length}건, 작업일보 ${nextWork.length}건, 중복 ${skipped}건 건너뜀.`,
    data: nextData,
  }
}

export function exportQuantityCsv(data: ReportStore): string {
  return toCsv([
    ["날짜", "라인", "장비호기", "RMD번호", "VMB코드", "미터 수", "위치"],
    ...data.quantityReports.map((report) => [
      report.date,
      report.line,
      report.equipmentUnit,
      report.rmdNumber,
      report.vmbCode,
      String(report.meterCount),
      report.location,
    ]),
  ])
}

export function exportWorkCsv(data: ReportStore): string {
  const joined = joinWorkReports(data.quantityReports, data.workReports)
  const rows = joined.kind === "ok" ? joined.rows : []
  return toCsv([
    ["날짜", "라인", "장비호기", "이름", "총원", "층수"],
    ...rows.map((report) => [
      report.date,
      report.line,
      report.equipmentUnit,
      report.name,
      String(report.totalWorkers),
      report.floor,
    ]),
  ])
}

function summaryKey(report: Pick<QuantityReport, "date" | "line" | "equipmentUnit">): string {
  return `${report.date}\u001f${report.line}\u001f${report.equipmentUnit}`
}

function toSummaryRow(draft: SummaryDraft): SummaryRow {
  return {
    date: draft.date,
    line: draft.line,
    equipmentUnit: draft.equipmentUnit,
    meterCount: sum(draft.quantityReports.map((report) => report.meterCount)),
    quantityCount: draft.quantityReports.length,
    workCount: draft.workReports.length,
    totalWorkers: sum(draft.workReports.map((report) => report.totalWorkers)),
    quantityReports: draft.quantityReports,
    workReports: draft.workReports,
  }
}

function compareSummaryRows(left: SummaryRow, right: SummaryRow): number {
  return (
    left.date.localeCompare(right.date) ||
    left.line.localeCompare(right.line) ||
    left.equipmentUnit.localeCompare(right.equipmentUnit)
  )
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")
}

function hasDuplicateIds(reports: readonly { readonly id: string }[]): boolean {
  return new Set(reports.map((report) => report.id)).size !== reports.length
}

function hasUniqueStoreIds(data: ReportStore): boolean {
  return !hasDuplicateIds(data.quantityReports) && !hasDuplicateIds(data.workReports)
}

function hasOrphanWorkReports(data: ReportStore): boolean {
  const quantityIds = new Set(data.quantityReports.map((report) => report.id))
  return data.workReports.some((report) => !quantityIds.has(report.quantityReportId))
}

function isStoreConsistent(data: ReportStore): boolean {
  return hasUniqueStoreIds(data) && !hasOrphanWorkReports(data)
}

function escapeCsvCell(value: string): string {
  const safeValue = /^[ \n\f\v]*[=+\-@\t\r]/.test(value) ? `'${value}` : value
  if (
    safeValue.includes(",") ||
    safeValue.includes('"') ||
    safeValue.includes("\n") ||
    safeValue.includes("\r")
  ) {
    return `"${safeValue.replaceAll('"', '""')}"`
  }
  return safeValue
}
