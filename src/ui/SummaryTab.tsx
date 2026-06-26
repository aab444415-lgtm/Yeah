import type { ReactElement } from "react"
import { useMemo, useState } from "react"
import { type ReportStore, type SummaryRow, summarizeReports } from "../domain/store"
import { LineCategoryFilter } from "./LineCategoryFilter"
import { getLineCategories, groupRowsByLine } from "./lineCategories"

type SummaryTabProps = {
  readonly data: ReportStore
}

export function SummaryTab(props: SummaryTabProps): ReactElement {
  const [date, setDate] = useState<string>("")
  const [line, setLine] = useState<string>("")
  const [equipmentUnit, setEquipmentUnit] = useState<string>("")
  const summaries = useMemo(() => summarizeReports(props.data), [props.data])
  const lineCandidateRows = useMemo(
    () =>
      summaries.filter(
        (row) => matches(row.date, date) && matches(row.equipmentUnit, equipmentUnit),
      ),
    [date, equipmentUnit, summaries],
  )
  const lineCategories = useMemo(
    () => getLineCategories(lineCandidateRows, getSummaryLines),
    [lineCandidateRows],
  )
  const rows = useMemo(
    () => lineCandidateRows.filter((row) => matches(row.line, line)),
    [line, lineCandidateRows],
  )
  const lineGroups = useMemo(() => groupRowsByLine(rows, getSummaryLines), [rows])
  const totals = useMemo(
    () => ({
      meterCount: rows.reduce((total, row) => total + row.meterCount, 0),
      quantityCount: rows.reduce((total, row) => total + row.quantityCount, 0),
      workCount: rows.reduce((total, row) => total + row.workCount, 0),
      totalWorkers: rows.reduce((total, row) => total + row.totalWorkers, 0),
    }),
    [rows],
  )

  return (
    <section className="summary-layout" aria-labelledby="summary-heading">
      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">통합 집계 현황</p>
          <h2 id="summary-heading">통합현황</h2>
        </div>
        <div className="summary-cards" aria-label="통합 합계">
          <SummaryMetric label="총 미터 수" value={formatNumber(totals.meterCount)} />
          <SummaryMetric label="물량일보" value={`${totals.quantityCount}건`} />
          <SummaryMetric label="작업일보" value={`${totals.workCount}건`} />
          <SummaryMetric label="총원" value={`${totals.totalWorkers}명`} />
        </div>
        <div className="filter-grid">
          <label className="field" htmlFor="summary-date">
            <span>날짜</span>
            <input
              id="summary-date"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>
          <label className="field" htmlFor="summary-line">
            <span>라인</span>
            <input
              id="summary-line"
              onChange={(event) => setLine(event.target.value)}
              value={line}
            />
          </label>
          <label className="field" htmlFor="summary-equipment">
            <span>장비호기</span>
            <input
              id="summary-equipment"
              onChange={(event) => setEquipmentUnit(event.target.value)}
              value={equipmentUnit}
            />
          </label>
        </div>
        <LineCategoryFilter
          categories={lineCategories}
          label="통합현황 카테고리"
          onSelect={setLine}
          selectedLine={line}
          totalCount={lineCandidateRows.length}
        />
      </section>

      <section className="panel list-panel" aria-label="통합현황 상세">
        {rows.length === 0 ? (
          <p className="empty-state">조건에 맞는 통합현황이 없습니다.</p>
        ) : (
          <div className="line-group-list">
            {lineGroups.map((group) => (
              <section
                className="line-group"
                key={group.line}
                aria-label={`${group.line} 통합현황`}
              >
                <header className="line-group-heading">
                  <strong>{group.line}</strong>
                  <span>{group.rows.length}건</span>
                </header>
                <div className="report-list">
                  {group.rows.map((row) => (
                    <article
                      className="summary-row"
                      key={`${row.date}-${row.line}-${row.equipmentUnit}`}
                    >
                      <header>
                        <strong>
                          {row.date} · {row.line} · {row.equipmentUnit}
                        </strong>
                        <span>
                          미터 {formatNumber(row.meterCount)} / 물량 {row.quantityCount}건 / 작업{" "}
                          {row.workCount}건 / 총원 {row.totalWorkers}명
                        </span>
                      </header>
                      <div className="drilldown">
                        <div>
                          <h3>물량일보</h3>
                          {row.quantityReports.map((report) => (
                            <p key={report.id}>
                              {report.rmdNumber} · {report.vmbCode} · {report.location} ·{" "}
                              {formatNumber(report.meterCount)}
                            </p>
                          ))}
                        </div>
                        <div>
                          <h3>작업일보</h3>
                          {row.workReports.length === 0 ? (
                            <p>연결된 작업일보 없음</p>
                          ) : (
                            row.workReports.map((report) => (
                              <p key={report.id}>
                                {report.workerNames.join(", ")} · {report.totalWorkers}명 · 작업{" "}
                                {report.workBlocks.length}건
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function SummaryMetric(props: { readonly label: string; readonly value: string }): ReactElement {
  return (
    <div className="metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  )
}

function matches(value: string, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  return normalized.length === 0 || value.toLowerCase().includes(normalized)
}

function getSummaryLines(row: SummaryRow): readonly string[] {
  return [row.line]
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(value)
}
