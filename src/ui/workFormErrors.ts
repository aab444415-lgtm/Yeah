import type { WorkFieldErrors } from "../domain/reports"

export function clearWorkerNamesError(errors: WorkFieldErrors): WorkFieldErrors {
  const nextErrors: WorkFieldErrors = {}
  if (errors.date !== undefined) nextErrors.date = errors.date
  if (errors.workBlocks !== undefined) nextErrors.workBlocks = errors.workBlocks
  return nextErrors
}

export function clearWorkBlocksError(errors: WorkFieldErrors): WorkFieldErrors {
  const nextErrors: WorkFieldErrors = {}
  if (errors.date !== undefined) nextErrors.date = errors.date
  if (errors.workerNames !== undefined) nextErrors.workerNames = errors.workerNames
  return nextErrors
}
