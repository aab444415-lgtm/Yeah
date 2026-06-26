import { Copy, Pencil, Trash2 } from "lucide-react"
import type { ReactElement } from "react"
import { useMemo } from "react"
import type { WorkReportView } from "../domain/reports"
import { formatWorkCopyText } from "../domain/workCopy"
import { LineCategoryFilter } from "./LineCategoryFilter"
import {
  filterRowsByLine,
  getLineCategories,
  groupRowsByLine,
  normalizeSelectedLine,
} from "./lineCategories"
import { filterWorkRows } from "./workReportRows"

type WorkReportListProps = {
  readonly rows: readonly WorkReportView[]
  readonly filter: string
  readonly selectedLine: string
  readonly onFilterChange: (filter: string) => void
  readonly onLineChange: (line: string) => void
  readonly onEdit: (report: WorkReportView) => void
  readonly onDelete: (report: WorkReportView) => void
}

export function WorkReportList(props: WorkReportListProps): ReactElement {
  const searchedRows = useMemo(
    () => filterWorkRows(props.rows, props.filter),
    [props.filter, props.rows],
  )
  const lineCategories = useMemo(
    () => getLineCategories(searchedRows, getWorkLines),
    [searchedRows],
  )
  const selectedLine = normalizeSelectedLine(props.selectedLine, lineCategories)
  const visibleRows = useMemo(
    () => filterRowsByLine(searchedRows, selectedLine, getWorkLines),
    [searchedRows, selectedLine],
  )
  const lineGroups = useMemo(() => groupRowsByLine(visibleRows, getWorkLines), [visibleRows])

  return (
    <section className="panel list-panel" aria-label="작업일보 목록">
      <div className="section-heading">
        <p className="eyebrow">연결된 작업일보</p>
        <h2>작업일보 목록</h2>
      </div>
      <label className="field filter-field" htmlFor="work-filter">
        <span>검색</span>
        <input
          id="work-filter"
          onChange={(event) => props.onFilterChange(event.target.value)}
          value={props.filter}
        />
      </label>
      <LineCategoryFilter
        categories={lineCategories}
        label="작업일보 카테고리"
        onSelect={props.onLineChange}
        selectedLine={selectedLine}
        totalCount={searchedRows.length}
      />
      {visibleRows.length === 0 ? (
        <p className="empty-state">{getEmptyMessage(props.rows.length)}</p>
      ) : (
        <div className="line-group-list">
          {lineGroups.map((group) => (
            <section className="line-group" key={group.line} aria-label={`${group.line} 작업일보`}>
              <header className="line-group-heading">
                <strong>{group.line}</strong>
                <span>{group.rows.length}건</span>
              </header>
              <div className="report-list">
                {group.rows.map((report) => {
                  const copyText = formatWorkCopyText(report)
                  return (
                    <article className="report-row report-row-with-copy" key={report.id}>
                      <div>
                        <strong>
                          {report.workerNames.join(", ")} · {report.totalWorkers}명 · 작업{" "}
                          {report.workBlocks.length}건
                        </strong>
                        <span>
                          {report.date} · {report.line} · {report.equipmentUnit}
                        </span>
                      </div>
                      <div className="row-actions">
                        <button onClick={() => copyToClipboard(copyText)} type="button">
                          <Copy size={15} /> 복사
                        </button>
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
                      <pre aria-label="작업일보 복사용 내용" className="copy-output">
                        {copyText}
                      </pre>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

function copyToClipboard(text: string): void {
  if ("clipboard" in navigator) {
    void navigator.clipboard.writeText(text)
  }
}

function getWorkLines(report: WorkReportView): readonly string[] {
  return report.quantityReports.length > 0
    ? report.quantityReports.map((quantity) => quantity.line)
    : [report.line]
}

function getEmptyMessage(totalReports: number): string {
  return totalReports === 0 ? "저장된 작업일보가 없습니다." : "조건에 맞는 작업일보가 없습니다."
}
