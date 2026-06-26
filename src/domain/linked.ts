import {
  type QuantityReport,
  type WorkReport,
  type WorkReportView,
  deriveWorkReportView,
} from "./reports"

export type JoinedResult =
  | { readonly kind: "ok"; readonly rows: readonly WorkReportView[] }
  | { readonly kind: "error"; readonly message: string }

export function joinWorkReports(
  quantityReports: readonly QuantityReport[],
  workReports: readonly WorkReport[],
): JoinedResult {
  const quantityById = new Map(quantityReports.map((report) => [report.id, report]))
  const rows: WorkReportView[] = []
  for (const workReport of workReports) {
    const linkedQuantities = getLinkedQuantities(workReport, quantityById)
    if (linkedQuantities === null) return missingParentError()
    rows.push(deriveWorkReportView(workReport, linkedQuantities))
  }
  return { kind: "ok", rows }
}

function getLinkedQuantities(
  workReport: WorkReport,
  quantityById: ReadonlyMap<string, QuantityReport>,
): readonly QuantityReport[] | null {
  const linkedQuantities: QuantityReport[] = []
  const seenIds = new Set<string>()
  for (const block of workReport.workBlocks) {
    const quantityReport = quantityById.get(block.quantityReportId)
    if (quantityReport === undefined) return null
    if (!seenIds.has(quantityReport.id)) {
      linkedQuantities.push(quantityReport)
      seenIds.add(quantityReport.id)
    }
  }
  return linkedQuantities
}

function missingParentError(): JoinedResult {
  return {
    kind: "error",
    message: "작업일보가 존재하지 않는 물량일보에 연결되어 있습니다.",
  }
}
