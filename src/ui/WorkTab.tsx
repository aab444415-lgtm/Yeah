import { Pencil, Plus, Save, Trash2, X } from "lucide-react"
import type { ReactElement } from "react"
import { useMemo, useState } from "react"
import {
  type QuantityReport,
  type WorkFieldErrors,
  type WorkInput,
  type WorkReport,
  createWorkReport,
  deriveWorkReportView,
  updateWorkReport,
  validateWorkInput,
} from "../domain/reports"
import type { ReportStore } from "../domain/store"
import { FormField, ReadOnlyField } from "./FormField"
import { InlineQuantityCreator } from "./InlineQuantityCreator"
import { WorkParentSelector } from "./WorkParentSelector"

type WorkTabProps = {
  readonly data: ReportStore
  readonly onChange: (data: ReportStore) => void
}

const EMPTY_INPUT: WorkInput = {
  quantityReportId: "",
  name: "",
  totalWorkers: "",
  floor: "",
}

export function WorkTab(props: WorkTabProps): ReactElement {
  const [form, setForm] = useState<WorkInput>(EMPTY_INPUT)
  const [errors, setErrors] = useState<WorkFieldErrors>({})
  const [editingId, setEditingId] = useState<string>("")
  const [filter, setFilter] = useState<string>("")
  const [notice, setNotice] = useState<string>("")
  const [showQuantityCreator, setShowQuantityCreator] = useState<boolean>(false)

  const selectedQuantity = props.data.quantityReports.find(
    (report) => report.id === form.quantityReportId,
  )
  const hasQuantityReports = props.data.quantityReports.length > 0
  const shouldShowQuantityCreator = !hasQuantityReports || showQuantityCreator
  const joinedRows = useMemo(
    () =>
      props.data.workReports.flatMap((workReport) => {
        const quantity = props.data.quantityReports.find(
          (report) => report.id === workReport.quantityReportId,
        )
        return quantity === undefined ? [] : [deriveWorkReportView(workReport, quantity)]
      }),
    [props.data.quantityReports, props.data.workReports],
  )
  const rows = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (query.length === 0) return joinedRows
    return joinedRows.filter((report) =>
      [report.date, report.line, report.equipmentUnit, report.name, report.floor]
        .join(" ")
        .toLowerCase()
        .includes(query),
    )
  }, [filter, joinedRows])

  function submit(): void {
    const nextErrors = validateWorkInput(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const now = new Date().toISOString()
    if (editingId.length > 0) {
      props.onChange({
        ...props.data,
        workReports: props.data.workReports.map((report) =>
          report.id === editingId ? updateWorkReport(report, form, now) : report,
        ),
      })
      setNotice("작업일보를 수정했습니다.")
    } else {
      const report = createWorkReport({ id: makeId("work"), now, input: form })
      props.onChange({ ...props.data, workReports: [report, ...props.data.workReports] })
      setNotice("작업일보를 저장했습니다.")
    }
    resetForm()
  }

  function startEdit(report: WorkReport): void {
    setEditingId(report.id)
    setForm({
      quantityReportId: report.quantityReportId,
      name: report.name,
      totalWorkers: String(report.totalWorkers),
      floor: report.floor,
    })
    setErrors({})
    setNotice("")
  }

  function deleteReport(report: WorkReport): void {
    if (!window.confirm(`${report.name} 작업일보를 삭제할까요?`)) return
    props.onChange({
      ...props.data,
      workReports: props.data.workReports.filter((row) => row.id !== report.id),
    })
    setNotice("작업일보를 삭제했습니다.")
  }

  function createAndSelectQuantity(report: QuantityReport): void {
    props.onChange({
      ...props.data,
      quantityReports: [report, ...props.data.quantityReports],
    })
    setForm({ ...form, quantityReportId: report.id })
    setShowQuantityCreator(false)
    setErrors({})
    setNotice("물량일보를 만들고 작업일보에 연결했습니다.")
  }

  function resetForm(): void {
    setForm(EMPTY_INPUT)
    setErrors({})
    setEditingId("")
  }

  return (
    <section className="view-grid" aria-labelledby="work-heading">
      <form
        className="panel form-panel"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="section-heading">
          <p className="eyebrow">작업일보 데이터</p>
          <h2 id="work-heading">{editingId.length > 0 ? "작업일보 수정" : "작업일보 작성"}</h2>
        </div>
        <WorkParentSelector
          error={errors.quantityReportId}
          expanded={showQuantityCreator}
          onSelect={(quantityReportId) => setForm({ ...form, quantityReportId })}
          onToggleCreator={() => setShowQuantityCreator(!showQuantityCreator)}
          quantityReports={props.data.quantityReports}
          selectedId={form.quantityReportId}
        />
        {shouldShowQuantityCreator ? (
          <InlineQuantityCreator
            onCancel={hasQuantityReports ? () => setShowQuantityCreator(false) : undefined}
            onCreate={createAndSelectQuantity}
          />
        ) : null}

        <div className="readonly-grid" aria-label="상위 물량일보에서 가져온 값">
          <ReadOnlyField label="날짜" value={selectedQuantity?.date ?? "-"} />
          <ReadOnlyField label="라인" value={selectedQuantity?.line ?? "-"} />
          <ReadOnlyField label="장비호기" value={selectedQuantity?.equipmentUnit ?? "-"} />
        </div>

        <div className="form-grid">
          <FormField
            error={errors.name}
            label="이름"
            name="work-name"
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            value={form.name}
          />
          <FormField
            error={errors.totalWorkers}
            label="총원"
            min="1"
            name="work-total-workers"
            onChange={(event) => setForm({ ...form, totalWorkers: event.target.value })}
            step="1"
            type="number"
            value={form.totalWorkers}
          />
          <FormField
            error={errors.floor}
            label="층수"
            name="work-floor"
            onChange={(event) => setForm({ ...form, floor: event.target.value })}
            value={form.floor}
          />
        </div>

        <div className="command-row">
          <button className="primary" type="submit">
            {editingId.length > 0 ? <Save size={16} /> : <Plus size={16} />}
            {editingId.length > 0 ? "수정 저장" : "저장"}
          </button>
          {editingId.length > 0 ? (
            <button onClick={resetForm} type="button">
              <X size={16} /> 취소
            </button>
          ) : null}
        </div>
        <p aria-live="polite" className="notice">
          {notice}
        </p>
      </form>

      <section className="panel list-panel" aria-label="작업일보 목록">
        <div className="section-heading">
          <p className="eyebrow">연결된 작업일보</p>
          <h2>작업일보 목록</h2>
        </div>
        <label className="field filter-field" htmlFor="work-filter">
          <span>검색</span>
          <input
            id="work-filter"
            onChange={(event) => setFilter(event.target.value)}
            value={filter}
          />
        </label>
        {rows.length === 0 ? (
          <p className="empty-state">저장된 작업일보가 없습니다.</p>
        ) : (
          <div className="report-list">
            {rows.map((report) => (
              <article className="report-row" key={report.id}>
                <div>
                  <strong>
                    {report.name} · {report.totalWorkers}명 · {report.floor}
                  </strong>
                  <span>
                    {report.date} · {report.line} · {report.equipmentUnit}
                  </span>
                </div>
                <div className="row-actions">
                  <button onClick={() => startEdit(report)} type="button">
                    <Pencil size={15} /> 수정
                  </button>
                  <button className="danger" onClick={() => deleteReport(report)} type="button">
                    <Trash2 size={15} /> 삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}
