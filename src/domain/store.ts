import { z } from "zod"
import {
  QuantityReportIdSchema,
  QuantityReportSchema,
  type WorkReport,
  WorkReportIdSchema,
  WorkReportSchema,
  normalizeWorkerNames,
} from "./reports"
import { createCopyItemFromQuantity } from "./workCopy"

export { exportQuantityCsv, exportWorkCsv } from "./csv"
export { joinWorkReports, type JoinedResult } from "./linked"
export { summarizeReports, type SummaryRow } from "./summary"

export const STORAGE_KEY = "worklog-quantity-app:v1"

export const ReportStoreSchema = z.object({
  version: z.literal(1),
  registeredWorkerNames: z.array(z.string().min(1)).default([]),
  quantityReports: z.array(QuantityReportSchema),
  workReports: z.array(WorkReportSchema),
})

export type ReportStore = z.infer<typeof ReportStoreSchema>

const LegacyWorkReportSchema = z.object({
  id: WorkReportIdSchema,
  quantityReportId: QuantityReportIdSchema,
  name: z.string().min(1),
  totalWorkers: z.number().int().min(1),
  floor: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const AttendanceWorkReportSchema = z.object({
  id: WorkReportIdSchema,
  quantityReportId: QuantityReportIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workerNames: z.array(z.string().min(1)).min(1),
  floor: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const StoredReportStoreSchema = z.object({
  version: z.literal(1),
  registeredWorkerNames: z.array(z.string().min(1)).default([]),
  quantityReports: z.array(QuantityReportSchema),
  workReports: z.array(
    z.union([WorkReportSchema, AttendanceWorkReportSchema, LegacyWorkReportSchema]),
  ),
})

export type ImportResult =
  | { readonly kind: "success"; readonly message: string; readonly data: ReportStore }
  | { readonly kind: "error"; readonly message: string; readonly data: ReportStore }

export const EMPTY_STORE: ReportStore = {
  version: 1,
  registeredWorkerNames: [],
  quantityReports: [],
  workReports: [],
}

export function parseStoredData(value: string | null): ReportStore {
  if (value === null) return EMPTY_STORE
  try {
    const raw: unknown = JSON.parse(value)
    const parsed = parseReportStore(raw)
    return parsed !== null && isStoreConsistent(parsed) ? parsed : EMPTY_STORE
  } catch (error) {
    if (error instanceof SyntaxError) return EMPTY_STORE
    throw error
  }
}

export function serializeStore(data: ReportStore): string {
  return JSON.stringify(withRegisteredWorkers(data), null, 2)
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

  const parsed = parseReportStore(raw)
  if (parsed === null) {
    return {
      kind: "error",
      message: "가져올 데이터 구조가 올바르지 않습니다.",
      data: current,
    }
  }

  const incoming = withRegisteredWorkers(parsed)
  if (!hasUniqueStoreIds(incoming)) {
    return {
      kind: "error",
      message: "가져올 데이터에 중복된 ID가 있습니다.",
      data: current,
    }
  }

  if (hasOrphanWorkReports(incoming)) {
    return {
      kind: "error",
      message: "가져올 작업일보가 존재하지 않는 물량일보에 연결되어 있습니다.",
      data: current,
    }
  }

  const currentQuantityIds = new Set(current.quantityReports.map((report) => report.id))
  const currentWorkIds = new Set(current.workReports.map((report) => report.id))
  const nextQuantity = incoming.quantityReports.filter(
    (report) => !currentQuantityIds.has(report.id),
  )
  const nextWork = incoming.workReports.filter((report) => !currentWorkIds.has(report.id))
  const nextData: ReportStore = withRegisteredWorkers({
    version: 1,
    registeredWorkerNames: [...current.registeredWorkerNames, ...incoming.registeredWorkerNames],
    quantityReports: [...current.quantityReports, ...nextQuantity],
    workReports: [...current.workReports, ...nextWork],
  })
  const skipped =
    incoming.quantityReports.length +
    incoming.workReports.length -
    nextQuantity.length -
    nextWork.length

  return {
    kind: "success",
    message: `가져오기 완료: 물량일보 ${nextQuantity.length}건, 작업일보 ${nextWork.length}건, 중복 ${skipped}건 건너뜀.`,
    data: nextData,
  }
}

function withRegisteredWorkers(data: ReportStore): ReportStore {
  return {
    ...data,
    registeredWorkerNames: normalizeWorkerNames([
      ...data.registeredWorkerNames,
      ...data.workReports.flatMap((report) => report.workerNames),
    ]),
  }
}

function parseReportStore(raw: unknown): ReportStore | null {
  const parsed = StoredReportStoreSchema.safeParse(raw)
  if (!parsed.success) return null

  const quantityById = new Map(parsed.data.quantityReports.map((report) => [report.id, report]))
  const workReports: WorkReport[] = []
  for (const report of parsed.data.workReports) {
    if ("copyItems" in report) {
      workReports.push(report)
    } else if ("workerNames" in report) {
      const quantity = quantityById.get(report.quantityReportId)
      workReports.push(
        WorkReportSchema.parse({
          ...report,
          shift: "주간",
          copyItems: [createCopyItemFromQuantity(quantity)],
        }),
      )
    } else {
      const quantity = quantityById.get(report.quantityReportId)
      workReports.push(
        WorkReportSchema.parse({
          id: report.id,
          quantityReportId: report.quantityReportId,
          date: quantity?.date ?? report.createdAt.slice(0, 10),
          shift: "주간",
          workerNames: [report.name],
          floor: report.floor,
          copyItems: [createCopyItemFromQuantity(quantity)],
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        }),
      )
    }
  }

  return withRegisteredWorkers({
    version: 1,
    registeredWorkerNames: parsed.data.registeredWorkerNames,
    quantityReports: parsed.data.quantityReports,
    workReports,
  })
}

function hasDuplicateIds(reports: readonly { readonly id: string }[]): boolean {
  return new Set(reports.map((report) => report.id)).size !== reports.length
}

function hasUniqueStoreIds(data: ReportStore): boolean {
  return !hasDuplicateIds(data.quantityReports) && !hasDuplicateIds(data.workReports)
}

function hasOrphanWorkReports(data: ReportStore): boolean {
  const quantityIds = new Set(data.quantityReports.map((report) => report.id))
  return data.workReports.some((report: WorkReport) => !quantityIds.has(report.quantityReportId))
}

function isStoreConsistent(data: ReportStore): boolean {
  return hasUniqueStoreIds(data) && !hasOrphanWorkReports(data)
}
