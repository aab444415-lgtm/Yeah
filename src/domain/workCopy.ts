import { z } from "zod"

export const WORK_SHIFT_OPTIONS = ["주간", "연장"] as const

export const WorkShiftSchema = z.enum(WORK_SHIFT_OPTIONS)

export const WorkCopyItemSchema = z.object({
  vmbCode: z.string().min(1),
  cableMeter: z.number().nonnegative(),
  jacketMeter: z.number().nonnegative(),
})

export const WorkBlockSchema = z.object({
  quantityReportId: z.string().min(1),
  title: z.string().min(1),
  detailLines: z.array(z.string().min(1)).min(1),
})

export type WorkShift = z.infer<typeof WorkShiftSchema>
export type WorkCopyItem = z.infer<typeof WorkCopyItemSchema>
export type WorkBlock = z.infer<typeof WorkBlockSchema>

export type WorkCopyItemInput = {
  readonly vmbCode: string
  readonly cableMeter: string
  readonly jacketMeter: string
}

export type WorkBlockInput = {
  readonly quantityReportId: string
  readonly title: string
  readonly detailText: string
}

export type QuantityCopySource = {
  readonly id: string
  readonly line: string
  readonly location: string
  readonly vmbCode: string
  readonly meterCount: number
}

export type WorkCopyTextData = {
  readonly date: string
  readonly shift: WorkShift
  readonly workerNames: readonly string[]
  readonly sectionLabel: string
  readonly workBlocks: readonly WorkBlock[]
  readonly closingNote: string
}

export const EMPTY_WORK_COPY_ITEM_INPUT: WorkCopyItemInput = {
  vmbCode: "",
  cableMeter: "",
  jacketMeter: "",
}

export const EMPTY_WORK_BLOCK_INPUT: WorkBlockInput = {
  quantityReportId: "",
  title: "",
  detailText: "",
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

export function createWorkBlockInputFromQuantity(
  quantity: QuantityCopySource | undefined,
): WorkBlockInput {
  if (quantity === undefined) return EMPTY_WORK_BLOCK_INPUT
  return {
    quantityReportId: quantity.id,
    title: formatQuantityWorkTitle(quantity),
    detailText: [quantity.vmbCode, `케이블 자켓 ${formatMeter(quantity.meterCount)}m`].join("\n"),
  }
}

export function createWorkBlockFromQuantity(
  quantity: QuantityCopySource | undefined,
  fallbackQuantityReportId: string,
): WorkBlock {
  if (quantity === undefined) {
    return {
      quantityReportId: fallbackQuantityReportId,
      title: "-",
      detailLines: ["-"],
    }
  }
  return WorkBlockSchema.parse({
    quantityReportId: quantity.id,
    title: formatQuantityWorkTitle(quantity),
    detailLines: [quantity.vmbCode, `케이블 자켓 ${formatMeter(quantity.meterCount)}m`],
  })
}

export function createWorkBlocksFromCopyItems(
  items: readonly WorkCopyItem[],
  title: string,
  quantityReportId: string,
): readonly WorkBlock[] {
  return [
    WorkBlockSchema.parse({
      quantityReportId,
      title: title.trim().length > 0 ? title.trim() : "-",
      detailLines: formatWorkCopyItems(items),
    }),
  ]
}

export function toWorkCopyItemInput(items: readonly WorkCopyItem[]): readonly WorkCopyItemInput[] {
  return items.map((item) => ({
    vmbCode: item.vmbCode,
    cableMeter: formatMeter(item.cableMeter),
    jacketMeter: formatMeter(item.jacketMeter),
  }))
}

export function toWorkBlockInput(blocks: readonly WorkBlock[]): readonly WorkBlockInput[] {
  return blocks.map((block) => ({
    quantityReportId: block.quantityReportId,
    title: block.title,
    detailText: block.detailLines.join("\n"),
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

export function normalizeWorkBlocks(items: readonly WorkBlockInput[]): readonly WorkBlock[] {
  return items.map((item) =>
    WorkBlockSchema.parse({
      quantityReportId: item.quantityReportId.trim(),
      title: item.title.trim(),
      detailLines: splitDetailLines(item.detailText),
    }),
  )
}

export function normalizeSectionLabel(value: string): string {
  return value.trim().replace(/^\[/u, "").replace(/\]$/u, "").trim()
}

export function normalizeClosingNote(value: string): string {
  return splitDetailLines(value).join("\n")
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

export function getWorkBlocksError(items: readonly WorkBlockInput[]): string | undefined {
  if (items.length === 0) return "작업을 한 개 이상 입력하세요."
  for (const item of items) {
    if (item.quantityReportId.trim().length === 0) {
      return "작업 묶음마다 물량일보를 선택하세요."
    }
    if (item.title.trim().length === 0) return "작업 위치/제목을 입력하세요."
    if (splitDetailLines(item.detailText).length === 0) return "작업 내용을 입력하세요."
  }
  return undefined
}

export function formatWorkCopyText(data: WorkCopyTextData): string {
  const sectionLabel = normalizeSectionLabel(data.sectionLabel)
  const closingLines = splitDetailLines(data.closingNote)
  const lines = [`${formatWorkDate(data.date)} ${data.shift}작업`, data.workerNames.join(" "), ""]
  if (sectionLabel.length > 0) lines.push(`[${sectionLabel}]`)
  lines.push(...formatWorkBlocks(data.workBlocks))
  if (closingLines.length > 0) lines.push("", ...closingLines)
  return lines.join("\n")
}

export function formatWorkCopyItems(items: readonly WorkCopyItem[]): readonly string[] {
  return items.map(
    (item, index) =>
      `${index + 1}. ${item.vmbCode} #${index + 1} 케이블 ${formatMeter(item.cableMeter)}m 자켓 ${formatMeter(item.jacketMeter)}m`,
  )
}

function formatWorkBlocks(blocks: readonly WorkBlock[]): readonly string[] {
  return blocks.flatMap((block, index) => {
    const prefix = index === 0 ? [] : [""]
    return [...prefix, block.title, ...block.detailLines]
  })
}

function splitDetailLines(value: string): readonly string[] {
  return value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function formatQuantityWorkTitle(quantity: QuantityCopySource): string {
  return [quantity.line, quantity.location].filter((value) => value.trim().length > 0).join(" ")
}

function isNonNegativeNumber(value: string): boolean {
  const parsed = Number(value)
  return value.trim().length > 0 && Number.isFinite(parsed) && parsed >= 0
}

function formatWorkDate(value: string): string {
  return value.replaceAll("-", ".")
}

function formatMeter(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2).replace(/\.?0+$/u, "")
}
