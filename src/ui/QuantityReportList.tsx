import { Pencil, Trash2 } from "lucide-react"
import type { ReactElement } from "react"
import { useMemo } from "react"
import type { QuantityReport } from "../domain/reports"
import { LineCategoryFilter } from "./LineCategoryFilter"
import {
  filterRowsByLine,
  getLineCategories,
  groupRowsByLine,
  normalizeSelectedLine,
} from "./lineCategories"

type QuantityReportListProps = {
  readonly reports: readonly QuantityReport[]
  readonly filter: string
  readonly selectedLine: string
  readonly onFilterChange: (filter: string) => void
  readonly onLineChange: (line: string) => void
  readonly onEdit: (report: QuantityReport) => void
  readonly onDelete: (report: QuantityReport) => void
}

export function QuantityReportList(props: QuantityReportListProps): ReactElement {
  const searchedRows = useMemo(
    () => filterQuantityReports(props.reports, props.filter),
    [props.filter, props.reports],
  )
  const lineCategories = useMemo(
    () => getLineCategories(searchedRows, getQuantityLines),
    [searchedRows],
  )
  const selectedLine = normalizeSelectedLine(props.selectedLine, lineCategories)
  const visibleRows = useMemo(
    () => filterRowsByLine(searchedRows, selectedLine, getQuantityLines),
    [searchedRows, selectedLine],
  )
  const lineGroups = useMemo(() => groupRowsByLine(visibleRows, getQuantityLines), [visibleRows])

  return (
    <section className="panel list-panel" aria-label="물량일보 목록">
      <div className="section-heading">
        <p className="eyebrow">최근 물량일보</p>
        <h2>물량일보 목록</h2>
      </div>
      <label className="field filter-field" htmlFor="quantity-filter">
        <span>검색</span>
        <input
          id="quantity-filter"
          onChange={(event) => props.onFilterChange(event.target.value)}
          value={props.filter}
        />
      </label>
      <LineCategoryFilter
        categories={lineCategories}
        label="물량일보 카테고리"
        onSelect={props.onLineChange}
        selectedLine={selectedLine}
        totalCount={searchedRows.length}
      />
      {visibleRows.length === 0 ? (
        <p className="empty-state">{getEmptyMessage(props.reports.length)}</p>
      ) : (
        <div className="line-group-list">
          {lineGroups.map((group) => (
            <section className="line-group" key={group.line} aria-label={`${group.line} 물량일보`}>
              <header className="line-group-heading">
                <strong>{group.line}</strong>
                <span>{group.rows.length}건</span>
              </header>
              <div className="report-list">
                {group.rows.map((report) => (
                  <article className="report-row" key={report.id}>
                    <div>
                      <strong>
                        {report.date} · {report.line} · {report.equipmentUnit}
                      </strong>
                      <span>
                        {report.rmdNumber} / {report.vmbCode} · {report.location}
                      </span>
                      <span>미터 수 {formatNumber(report.meterCount)}</span>
                    </div>
                    <div className="row-actions">
                      <button onClick={() => props.onEdit(report)} type="button">
                        <Pencil size={15} /> 수정
                      </button>
                      <button
                        className="danger"
                        onClick={() => props.onDelete(report)}
                        type="button"
                      >
                        <Trash2 size={15} /> 삭제
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

function filterQuantityReports(
  reports: readonly QuantityReport[],
  filter: string,
): readonly QuantityReport[] {
  const query = filter.trim().toLowerCase()
  if (query.length === 0) return reports
  return reports.filter((report) =>
    [
      report.date,
      report.line,
      report.equipmentUnit,
      report.rmdNumber,
      report.vmbCode,
      report.location,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query),
  )
}

function getQuantityLines(report: QuantityReport): readonly string[] {
  return [report.line]
}

function getEmptyMessage(totalReports: number): string {
  return totalReports === 0 ? "저장된 물량일보가 없습니다." : "조건에 맞는 물량일보가 없습니다."
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(value)
}
