import { joinWorkReports } from "./linked"
import type { QuantityReport, WorkReport, WorkReportView } from "./reports"

type ReportData = {
  readonly quantityReports: readonly QuantityReport[]
  readonly workReports: readonly WorkReport[]
}

export type SummaryRow = {
  readonly date: string
  readonly line: string
  readonly equipmentUnit: string
  readonly meterCount: number
  readonly quantityCount: number
  readonly workCount: number
  readonly totalWorkers: number
  readonly quantityReports: readonly QuantityReport[]
  readonly workReports: readonly WorkReportView[]
}

type SummaryDraft = {
  readonly key: string
  readonly date: string
  readonly line: string
  readonly equipmentUnit: string
  readonly quantityReports: QuantityReport[]
  readonly workReports: WorkReportView[]
}

type SummaryIdentity = {
  readonly date: string
  readonly line: string
  readonly equipmentUnit: string
}

export function summarizeReports(data: ReportData): readonly SummaryRow[] {
  const drafts = new Map<string, SummaryDraft>()
  for (const quantity of data.quantityReports) {
    const current = getOrCreateDraft(drafts, quantity)
    current.quantityReports.push(quantity)
  }

  const joined = joinWorkReports(data.quantityReports, data.workReports)
  if (joined.kind === "ok") {
    for (const workReport of joined.rows) {
      for (const quantityReport of workReport.quantityReports) {
        const current = getOrCreateDraft(drafts, {
          date: workReport.date,
          line: quantityReport.line,
          equipmentUnit: quantityReport.equipmentUnit,
        })
        current.workReports.push(workReport)
      }
    }
  }

  return Array.from(drafts.values()).map(toSummaryRow).sort(compareSummaryRows)
}

function getOrCreateDraft(
  drafts: Map<string, SummaryDraft>,
  identity: SummaryIdentity,
): SummaryDraft {
  const key = summaryKey(identity)
  const current = drafts.get(key)
  if (current !== undefined) return current

  const draft: SummaryDraft = {
    key,
    date: identity.date,
    line: identity.line,
    equipmentUnit: identity.equipmentUnit,
    quantityReports: [],
    workReports: [],
  }
  drafts.set(key, draft)
  return draft
}

function summaryKey(identity: SummaryIdentity): string {
  return `${identity.date}\u001f${identity.line}\u001f${identity.equipmentUnit}`
}

function toSummaryRow(draft: SummaryDraft): SummaryRow {
  return {
    date: draft.date,
    line: draft.line,
    equipmentUnit: draft.equipmentUnit,
    meterCount: sum(draft.quantityReports.map((report) => report.meterCount)),
    quantityCount: draft.quantityReports.length,
    workCount: draft.workReports.length,
    totalWorkers: sum(draft.workReports.map((report) => report.totalWorkers)),
    quantityReports: draft.quantityReports,
    workReports: draft.workReports,
  }
}

function compareSummaryRows(left: SummaryRow, right: SummaryRow): number {
  return (
    left.date.localeCompare(right.date) ||
    left.line.localeCompare(right.line) ||
    left.equipmentUnit.localeCompare(right.equipmentUnit)
  )
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}
