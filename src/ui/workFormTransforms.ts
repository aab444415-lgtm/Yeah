import type { WorkInput, WorkReport } from "../domain/reports"
import { toWorkBlockInput } from "../domain/workCopy"

export function workInputFromReport(report: WorkReport): WorkInput {
  return {
    date: report.date,
    shift: report.shift,
    workerNames: report.workerNames,
    sectionLabel: report.sectionLabel,
    workBlocks: toWorkBlockInput(report.workBlocks),
    closingNote: report.closingNote,
  }
}
