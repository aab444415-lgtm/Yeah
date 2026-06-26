import { Copy, Pencil, Trash2 } from "lucide-react"
import type { ReactElement } from "react"
import type { WorkReportView } from "../domain/reports"
import { formatWorkCopyText } from "../domain/workCopy"

type WorkReportListProps = {
  readonly rows: readonly WorkReportView[]
  readonly filter: string
  readonly onFilterChange: (filter: string) => void
  readonly onEdit: (report: WorkReportView) => void
  readonly onDelete: (report: WorkReportView) => void
}

export function WorkReportList(props: WorkReportListProps): ReactElement {
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
      {props.rows.length === 0 ? (
        <p className="empty-state">저장된 작업일보가 없습니다.</p>
      ) : (
        <div className="report-list">
          {props.rows.map((report) => {
            const copyText = formatWorkCopyText(report)
            return (
              <article className="report-row report-row-with-copy" key={report.id}>
                <div>
                  <strong>
                    {report.workerNames.join(", ")} · {report.totalWorkers}명 · {report.floor}
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
                  <button className="danger" onClick={() => props.onDelete(report)} type="button">
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
      )}
    </section>
  )
}

function copyToClipboard(text: string): void {
  if ("clipboard" in navigator) {
    void navigator.clipboard.writeText(text)
  }
}
