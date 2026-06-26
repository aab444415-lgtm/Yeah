import { z } from "zod"
import {
  type WorkCopyItemInput,
  WorkCopyItemSchema,
  type WorkShift,
  WorkShiftSchema,
  getWorkCopyItemsError,
  normalizeWorkCopyItems,
} from "./workCopy"

export const QuantityReportIdSchema = z.string().min(1).brand("QuantityReportId")
export const WorkReportIdSchema = z.string().min(1).brand("WorkReportId")

export type QuantityReportId = z.infer<typeof QuantityReportIdSchema>
export type WorkReportId = z.infer<typeof WorkReportIdSchema>

export type QuantityInput = {
  readonly date: string
  readonly line: string
  readonly equipmentUnit: string
  readonly rmdNumber: string
  readonly vmbCode: string
  readonly meterCount: string
  readonly location: string
}

export type WorkInput = {
  readonly quantityReportId: string
  readonly date: string
  readonly shift: WorkShift
  readonly workerNames: readonly string[]
  readonly floor: string
  readonly copyItems: readonly WorkCopyItemInput[]
}

export const QuantityReportSchema = z.object({
  id: QuantityReportIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  line: z.string().min(1),
  equipmentUnit: z.string().min(1),
  rmdNumber: z.string().min(1),
  vmbCode: z.string().min(1),
  meterCount: z.number().positive(),
  location: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const WorkReportSchema = z.object({
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

export type QuantityReport = z.infer<typeof QuantityReportSchema>
export type WorkReport = z.infer<typeof WorkReportSchema>

export type QuantityFieldErrors = Partial<Record<keyof QuantityInput, string>>
export type WorkFieldErrors = Partial<Record<keyof WorkInput, string>>

export type WorkReportView = WorkReport & {
  readonly line: string
  readonly equipmentUnit: string
  readonly totalWorkers: number
}

type CreateQuantityArgs = {
  readonly id: string
  readonly now: string
  readonly input: QuantityInput
}

type CreateWorkArgs = {
  readonly id: string
  readonly now: string
  readonly input: WorkInput
}

export class ReportValidationError extends Error {
  readonly errors: QuantityFieldErrors | WorkFieldErrors

  constructor(errors: QuantityFieldErrors | WorkFieldErrors) {
    super("보고서 입력값이 올바르지 않습니다.")
    this.name = "ReportValidationError"
    this.errors = errors
  }
}

export function validateQuantityInput(input: QuantityInput): QuantityFieldErrors {
  const errors: QuantityFieldErrors = {}
  if (input.date.trim().length === 0) errors.date = "날짜를 입력하세요."
  if (input.line.trim().length === 0) errors.line = "라인을 입력하세요."
  if (input.equipmentUnit.trim().length === 0) errors.equipmentUnit = "장비호기를 입력하세요."
  if (input.rmdNumber.trim().length === 0) errors.rmdNumber = "RMD번호를 입력하세요."
  if (input.vmbCode.trim().length === 0) errors.vmbCode = "VMB코드를 입력하세요."
  if (input.location.trim().length === 0) errors.location = "위치를 입력하세요."
  if (!isPositiveNumber(input.meterCount)) errors.meterCount = "미터 수는 0보다 커야 합니다."
  return errors
}

export function validateWorkInput(input: WorkInput): WorkFieldErrors {
  const errors: WorkFieldErrors = {}
  if (input.quantityReportId.trim().length === 0) {
    errors.quantityReportId = "연결할 물량일보를 선택하세요."
  }
  if (input.date.trim().length === 0) errors.date = "작업 날짜를 입력하세요."
  if (normalizeWorkerNames(input.workerNames).length === 0) {
    errors.workerNames = "출근자를 한 명 이상 선택하세요."
  }
  if (input.floor.trim().length === 0) errors.floor = "층수를 입력하세요."
  const copyItemsError = getWorkCopyItemsError(input.copyItems)
  if (copyItemsError !== undefined) errors.copyItems = copyItemsError
  return errors
}

export function createQuantityReport(args: CreateQuantityArgs): QuantityReport {
  const errors = validateQuantityInput(args.input)
  if (hasErrors(errors)) throw new ReportValidationError(errors)

  return QuantityReportSchema.parse({
    id: args.id,
    date: args.input.date.trim(),
    line: args.input.line.trim(),
    equipmentUnit: args.input.equipmentUnit.trim(),
    rmdNumber: args.input.rmdNumber.trim(),
    vmbCode: args.input.vmbCode.trim(),
    meterCount: Number(args.input.meterCount),
    location: args.input.location.trim(),
    createdAt: args.now,
    updatedAt: args.now,
  })
}

export function updateQuantityReport(
  report: QuantityReport,
  input: QuantityInput,
  now: string,
): QuantityReport {
  const next = createQuantityReport({ id: report.id, input, now })
  return { ...next, createdAt: report.createdAt }
}

export function createWorkReport(args: CreateWorkArgs): WorkReport {
  const errors = validateWorkInput(args.input)
  if (hasErrors(errors)) throw new ReportValidationError(errors)

  return WorkReportSchema.parse({
    id: args.id,
    quantityReportId: args.input.quantityReportId,
    date: args.input.date.trim(),
    shift: args.input.shift,
    workerNames: normalizeWorkerNames(args.input.workerNames),
    floor: args.input.floor.trim(),
    copyItems: normalizeWorkCopyItems(args.input.copyItems),
    createdAt: args.now,
    updatedAt: args.now,
  })
}

export function updateWorkReport(report: WorkReport, input: WorkInput, now: string): WorkReport {
  const next = createWorkReport({ id: report.id, input, now })
  return { ...next, createdAt: report.createdAt }
}

export function deriveWorkReportView(
  workReport: WorkReport,
  quantityReport: QuantityReport,
): WorkReportView {
  return {
    ...workReport,
    line: quantityReport.line,
    equipmentUnit: quantityReport.equipmentUnit,
    totalWorkers: workReport.workerNames.length,
  }
}

export function normalizeWorkerNames(names: readonly string[]): string[] {
  return Array.from(new Set(names.map((name) => name.trim()).filter((name) => name.length > 0)))
}

function hasErrors(errors: QuantityFieldErrors | WorkFieldErrors): boolean {
  return Object.keys(errors).length > 0
}

function isPositiveNumber(value: string): boolean {
  const parsed = Number(value)
  return value.trim().length > 0 && Number.isFinite(parsed) && parsed > 0
}
