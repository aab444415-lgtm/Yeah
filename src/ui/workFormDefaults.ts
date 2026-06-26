import type { WorkInput } from "../domain/reports"
import { EMPTY_WORK_BLOCK_INPUT } from "../domain/workCopy"

export const EMPTY_WORK_INPUT: WorkInput = {
  quantityReportId: "",
  date: "",
  shift: "주간",
  workerNames: [],
  floor: "",
  sectionLabel: "",
  workBlocks: [EMPTY_WORK_BLOCK_INPUT],
  closingNote: "",
}
