import type { WorkInput } from "../domain/reports"
import { EMPTY_WORK_BLOCK_INPUT } from "../domain/workCopy"

export const EMPTY_WORK_INPUT: WorkInput = {
  date: "",
  shift: "주간",
  workerNames: [],
  sectionLabel: "",
  workBlocks: [EMPTY_WORK_BLOCK_INPUT],
  closingNote: "",
}
