import { joinWorkReports } from "./linked"
import type { ReportStore } from "./store"
import { formatWorkCopyItems } from "./workCopy"

export function exportQuantityCsv(data: ReportStore): string {
  return toCsv([
    ["날짜", "라인", "장비호기", "RMD번호", "VMB코드", "미터 수", "위치"],
    ...data.quantityReports.map((report) => [
      report.date,
      report.line,
      report.equipmentUnit,
      report.rmdNumber,
      report.vmbCode,
      String(report.meterCount),
      report.location,
    ]),
  ])
}

export function exportWorkCsv(data: ReportStore): string {
  const joined = joinWorkReports(data.quantityReports, data.workReports)
  const rows = joined.kind === "ok" ? joined.rows : []
  return toCsv([
    ["날짜", "구분", "라인", "장비호기", "출근자", "총원", "층수", "복사용 항목"],
    ...rows.map((report) => [
      report.date,
      report.shift,
      report.line,
      report.equipmentUnit,
      report.workerNames.join(" / "),
      String(report.totalWorkers),
      report.floor,
      formatWorkCopyItems(report.copyItems).join("\n"),
    ]),
  ])
}

function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")
}

function escapeCsvCell(value: string): string {
  const safeValue = /^[ \n\f\v]*[=+\-@\t\r]/.test(value) ? `'${value}` : value
  if (
    safeValue.includes(",") ||
    safeValue.includes('"') ||
    safeValue.includes("\n") ||
    safeValue.includes("\r")
  ) {
    return `"${safeValue.replaceAll('"', '""')}"`
  }
  return safeValue
}
