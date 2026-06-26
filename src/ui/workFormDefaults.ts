import type { WorkInput } from "../domain/reports"
import { EMPTY_WORK_COPY_ITEM_INPUT } from "../domain/workCopy"

export const EMPTY_WORK_INPUT: WorkInput = {
  quantityReportId: "",
  date: "",
  shift: "주간",
  workerNames: [],
  floor: "",
  copyItems: [EMPTY_WORK_COPY_ITEM_INPUT],
}
