import type { WorkFieldErrors } from "../domain/reports"

export function clearWorkerNamesError(errors: WorkFieldErrors): WorkFieldErrors {
  const nextErrors: WorkFieldErrors = {}
  if (errors.quantityReportId !== undefined) nextErrors.quantityReportId = errors.quantityReportId
  if (errors.date !== undefined) nextErrors.date = errors.date
  if (errors.floor !== undefined) nextErrors.floor = errors.floor
  if (errors.copyItems !== undefined) nextErrors.copyItems = errors.copyItems
  return nextErrors
}

export function clearQuantityAndCopyErrors(errors: WorkFieldErrors): WorkFieldErrors {
  const nextErrors: WorkFieldErrors = {}
  if (errors.date !== undefined) nextErrors.date = errors.date
  if (errors.workerNames !== undefined) nextErrors.workerNames = errors.workerNames
  if (errors.floor !== undefined) nextErrors.floor = errors.floor
  return nextErrors
}

export function clearCopyItemsError(errors: WorkFieldErrors): WorkFieldErrors {
  const nextErrors: WorkFieldErrors = {}
  if (errors.quantityReportId !== undefined) nextErrors.quantityReportId = errors.quantityReportId
  if (errors.date !== undefined) nextErrors.date = errors.date
  if (errors.workerNames !== undefined) nextErrors.workerNames = errors.workerNames
  if (errors.floor !== undefined) nextErrors.floor = errors.floor
  return nextErrors
}
