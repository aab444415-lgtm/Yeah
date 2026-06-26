import type { QuantityReport, WorkInput, WorkReport } from "../domain/reports"
import { createWorkBlockInputFromQuantity, toWorkBlockInput } from "../domain/workCopy"

export function workInputFromReport(report: WorkReport): WorkInput {
  return {
    quantityReportId: report.quantityReportId,
    date: report.date,
    shift: report.shift,
    workerNames: report.workerNames,
    floor: report.floor,
    sectionLabel: report.sectionLabel,
    workBlocks: toWorkBlockInput(report.workBlocks),
    closingNote: report.closingNote,
  }
}

export function workInputWithSelectedQuantity(
  form: WorkInput,
  quantityReportId: string,
  quantity: QuantityReport | undefined,
): WorkInput {
  return {
    ...form,
    quantityReportId,
    workBlocks: [createWorkBlockInputFromQuantity(quantity)],
  }
}
