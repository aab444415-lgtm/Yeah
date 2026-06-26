import { z } from "zod"
import {
  type QuantityReport,
  QuantityReportIdSchema,
  QuantityReportSchema,
  type WorkReport,
  WorkReportIdSchema,
  WorkReportSchema,
} from "./reports"
import {
  WorkCopyItemSchema,
  WorkShiftSchema,
  createWorkBlockFromQuantity,
  createWorkBlocksFromCopyItems,
} from "./workCopy"

const PreviousWorkBlockSchema = z.object({
  title: z.string().min(1),
  detailLines: z.array(z.string().min(1)).min(1),
})

const PreviousBlockWorkReportSchema = z.object({
  id: WorkReportIdSchema,
  quantityReportId: QuantityReportIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shift: WorkShiftSchema,
  workerNames: z.array(z.string().min(1)).min(1),
  floor: z.string().min(1),
  sectionLabel: z.string(),
  workBlocks: z.array(PreviousWorkBlockSchema).min(1),
  closingNote: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const LegacyWorkReportSchema = z.object({
  id: WorkReportIdSchema,
  quantityReportId: QuantityReportIdSchema,
  name: z.string().min(1),
  totalWorkers: z.number().int().min(1),
  floor: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const FlatWorkReportSchema = z.object({
  id: WorkReportIdSchema,
  quantityReportId: QuantityReportIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shift: WorkShiftSchema,
  workerNames: z.array(z.string().min(1)).min(1),
  floor: z.string().min(1),
  copyItems: z.array(WorkCopyItemSchema).min(1),
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

export const StoredReportStoreSchema = z.object({
  version: z.literal(1),
  registeredWorkerNames: z.array(z.string().min(1)).default([]),
  quantityReports: z.array(QuantityReportSchema),
  workReports: z.array(
    z.union([
      WorkReportSchema,
      PreviousBlockWorkReportSchema,
      FlatWorkReportSchema,
      AttendanceWorkReportSchema,
      LegacyWorkReportSchema,
    ]),
  ),
})

type StoredWorkReport = z.infer<typeof StoredReportStoreSchema>["workReports"][number]

export function migrateStoredWorkReports(
  quantityReports: readonly QuantityReport[],
  reports: readonly StoredWorkReport[],
): WorkReport[] {
  const quantityById = new Map(quantityReports.map((report) => [report.id, report]))
  return reports.map((report) => migrateStoredWorkReport(report, quantityById))
}

function migrateStoredWorkReport(
  report: StoredWorkReport,
  quantityById: ReadonlyMap<string, QuantityReport>,
): WorkReport {
  const quantityReportId = "quantityReportId" in report ? report.quantityReportId : ""
  const quantity = quantityById.get(quantityReportId)
  if ("workBlocks" in report) {
    if (!("quantityReportId" in report)) return report
    return WorkReportSchema.parse({
      ...report,
      workBlocks: report.workBlocks.map((block) => ({
        ...block,
        quantityReportId: report.quantityReportId,
      })),
    })
  }
  if ("copyItems" in report) {
    return WorkReportSchema.parse({
      ...report,
      sectionLabel: "",
      workBlocks: createWorkBlocksFromCopyItems(
        report.copyItems,
        legacyWorkBlockTitle(quantity?.line, report.floor),
        report.quantityReportId,
      ),
      closingNote: "",
    })
  }
  if ("workerNames" in report) {
    return WorkReportSchema.parse({
      ...report,
      shift: "주간",
      sectionLabel: "",
      workBlocks: [createWorkBlockFromQuantity(quantity, report.quantityReportId)],
      closingNote: "",
    })
  }
  return WorkReportSchema.parse({
    id: report.id,
    quantityReportId: report.quantityReportId,
    date: quantity?.date ?? report.createdAt.slice(0, 10),
    shift: "주간",
    workerNames: [report.name],
    sectionLabel: "",
    workBlocks: [createWorkBlockFromQuantity(quantity, report.quantityReportId)],
    closingNote: "",
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  })
}

function legacyWorkBlockTitle(line: string | undefined, floor: string): string {
  return [line, floor].filter((value) => value !== undefined && value.length > 0).join(" ")
}
