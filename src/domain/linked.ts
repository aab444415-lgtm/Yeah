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
    const quantityReport = quantityById.get(workReport.quantityReportId)
    if (quantityReport === undefined) {
      return {
        kind: "error",
        message: "작업일보가 존재하지 않는 물량일보에 연결되어 있습니다.",
      }
    }
    rows.push(deriveWorkReportView(workReport, quantityReport))
  }
  return { kind: "ok", rows }
}
