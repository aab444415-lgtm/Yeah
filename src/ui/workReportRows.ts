import { type WorkReportView, deriveWorkReportView } from "../domain/reports"
import type { ReportStore } from "../domain/store"

export function deriveWorkRows(data: ReportStore): readonly WorkReportView[] {
  return data.workReports.flatMap((workReport) => {
    const quantityReports = data.quantityReports.filter((quantity) =>
      workReport.workBlocks.some((block) => block.quantityReportId === quantity.id),
    )
    return quantityReports.length === 0 ? [] : [deriveWorkReportView(workReport, quantityReports)]
  })
}

export function filterWorkRows(
  rows: readonly WorkReportView[],
  filter: string,
): readonly WorkReportView[] {
  const query = filter.trim().toLowerCase()
  if (query.length === 0) return rows
  return rows.filter((report) => searchableWorkText(report).includes(query))
}

function searchableWorkText(report: WorkReportView): string {
  return [
    report.date,
    report.line,
    report.equipmentUnit,
    report.workerNames.join(" "),
    report.sectionLabel,
    ...report.quantityReports.flatMap((quantity) => [
      quantity.rmdNumber,
      quantity.vmbCode,
      quantity.location,
    ]),
    ...report.workBlocks.flatMap((block) => [block.title, ...block.detailLines]),
  ]
    .join(" ")
    .toLowerCase()
}
