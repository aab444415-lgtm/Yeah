import { z } from "zod"

export const WORK_SHIFT_OPTIONS = ["주간", "연장"] as const

export const WorkShiftSchema = z.enum(WORK_SHIFT_OPTIONS)

export const WorkCopyItemSchema = z.object({
  vmbCode: z.string().min(1),
  cableMeter: z.number().nonnegative(),
  jacketMeter: z.number().nonnegative(),
})

export type WorkShift = z.infer<typeof WorkShiftSchema>
export type WorkCopyItem = z.infer<typeof WorkCopyItemSchema>

export type WorkCopyItemInput = {
  readonly vmbCode: string
  readonly cableMeter: string
  readonly jacketMeter: string
}

export type QuantityCopySource = {
  readonly vmbCode: string
  readonly meterCount: number
}

export type WorkCopyTextData = {
  readonly date: string
  readonly shift: WorkShift
  readonly workerNames: readonly string[]
  readonly totalWorkers: number
  readonly line: string
  readonly floor: string
  readonly copyItems: readonly WorkCopyItem[]
}

export const EMPTY_WORK_COPY_ITEM_INPUT: WorkCopyItemInput = {
  vmbCode: "",
  cableMeter: "",
  jacketMeter: "",
}

export function parseWorkShift(value: string): WorkShift {
  const parsed = WorkShiftSchema.safeParse(value)
  return parsed.success ? parsed.data : "주간"
}

export function createCopyItemInputFromQuantity(
  quantity: QuantityCopySource | undefined,
): WorkCopyItemInput {
  if (quantity === undefined) return EMPTY_WORK_COPY_ITEM_INPUT
  return {
    vmbCode: quantity.vmbCode,
    cableMeter: formatMeter(quantity.meterCount),
    jacketMeter: "",
  }
}

export function createCopyItemFromQuantity(quantity: QuantityCopySource | undefined): WorkCopyItem {
  if (quantity === undefined) {
    return { vmbCode: "-", cableMeter: 0, jacketMeter: 0 }
  }
  return { vmbCode: quantity.vmbCode, cableMeter: quantity.meterCount, jacketMeter: 0 }
}

export function toWorkCopyItemInput(items: readonly WorkCopyItem[]): readonly WorkCopyItemInput[] {
  return items.map((item) => ({
    vmbCode: item.vmbCode,
    cableMeter: formatMeter(item.cableMeter),
    jacketMeter: formatMeter(item.jacketMeter),
  }))
}

export function normalizeWorkCopyItems(
  items: readonly WorkCopyItemInput[],
): readonly WorkCopyItem[] {
  return items.map((item) =>
    WorkCopyItemSchema.parse({
      vmbCode: item.vmbCode.trim(),
      cableMeter: Number(item.cableMeter),
      jacketMeter: Number(item.jacketMeter),
    }),
  )
}

export function getWorkCopyItemsError(items: readonly WorkCopyItemInput[]): string | undefined {
  if (items.length === 0) return "복사용 VMB 항목을 한 개 이상 입력하세요."
  for (const item of items) {
    if (item.vmbCode.trim().length === 0) return "VMB코드를 입력하세요."
    if (!isNonNegativeNumber(item.cableMeter)) return "케이블미터를 입력하세요."
    if (!isNonNegativeNumber(item.jacketMeter)) return "자켓미터를 입력하세요."
  }
  return undefined
}

export function formatWorkCopyText(data: WorkCopyTextData): string {
  return [
    `${data.date} ${data.shift}`,
    `${data.workerNames.join(", ")} ${data.totalWorkers}명`,
    "",
    `${data.line}${data.floor}`,
    ...formatWorkCopyItems(data.copyItems),
  ].join("\n")
}

export function formatWorkCopyItems(items: readonly WorkCopyItem[]): readonly string[] {
  return items.map(
    (item, index) =>
      `${index + 1}. ${item.vmbCode} ${formatMeter(item.cableMeter)} ${formatMeter(item.jacketMeter)}`,
  )
}

function isNonNegativeNumber(value: string): boolean {
  const parsed = Number(value)
  return value.trim().length > 0 && Number.isFinite(parsed) && parsed >= 0
}

function formatMeter(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2).replace(/\.?0+$/u, "")
}
