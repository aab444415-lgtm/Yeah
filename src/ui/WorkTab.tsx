import type { ReactElement } from "react"
import { useMemo, useState } from "react"
import {
  type QuantityReport,
  type WorkFieldErrors,
  type WorkInput,
  type WorkReport,
  createWorkReport,
  deriveWorkReportView,
  normalizeWorkerNames,
  updateWorkReport,
  validateWorkInput,
} from "../domain/reports"
import type { ReportStore } from "../domain/store"
import {
  type WorkCopyItemInput,
  createCopyItemInputFromQuantity,
  toWorkCopyItemInput,
} from "../domain/workCopy"
import { FormField, ReadOnlyField } from "./FormField"
import { InlineQuantityCreator } from "./InlineQuantityCreator"
import { WorkCopyItemsEditor } from "./WorkCopyItemsEditor"
import { WorkFormActions } from "./WorkFormActions"
import { WorkParentSelector } from "./WorkParentSelector"
import { WorkParentSummary } from "./WorkParentSummary"
import { WorkReportList } from "./WorkReportList"
import { WorkShiftSelect } from "./WorkShiftSelect"
import { WorkerToggleGroup } from "./WorkerToggleGroup"
import { EMPTY_WORK_INPUT } from "./workFormDefaults"
import {
  clearCopyItemsError,
  clearQuantityAndCopyErrors,
  clearWorkerNamesError,
} from "./workFormErrors"

type WorkTabProps = {
  readonly data: ReportStore
  readonly onChange: (data: ReportStore) => void
}

export function WorkTab(props: WorkTabProps): ReactElement {
  const [form, setForm] = useState<WorkInput>(EMPTY_WORK_INPUT)
  const [errors, setErrors] = useState<WorkFieldErrors>({})
  const [editingId, setEditingId] = useState<string>("")
  const [filter, setFilter] = useState<string>("")
  const [notice, setNotice] = useState<string>("")
  const [pendingWorkerName, setPendingWorkerName] = useState<string>("")
  const [showQuantityCreator, setShowQuantityCreator] = useState<boolean>(false)

  const selectedQuantity = props.data.quantityReports.find(
    (report) => report.id === form.quantityReportId,
  )
  const availableWorkerNames = useMemo(
    () => normalizeWorkerNames([...props.data.registeredWorkerNames, ...form.workerNames]),
    [form.workerNames, props.data.registeredWorkerNames],
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
      [report.date, report.line, report.equipmentUnit, report.workerNames.join(" "), report.floor]
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
      date: report.date,
      shift: report.shift,
      workerNames: report.workerNames,
      floor: report.floor,
      copyItems: toWorkCopyItemInput(report.copyItems),
    })
    setErrors({})
    setNotice("")
  }

  function deleteReport(report: WorkReport): void {
    const workerText = report.workerNames.join(", ")
    if (!window.confirm(`${workerText} 작업일보를 삭제할까요?`)) return
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
    setForm({
      ...form,
      quantityReportId: report.id,
      copyItems: [createCopyItemInputFromQuantity(report)],
    })
    setShowQuantityCreator(false)
    setErrors({})
    setNotice("물량일보를 만들고 작업일보에 연결했습니다.")
  }

  function registerWorker(): void {
    const names = normalizeWorkerNames([pendingWorkerName])
    for (const name of names) {
      props.onChange({
        ...props.data,
        registeredWorkerNames: normalizeWorkerNames([...props.data.registeredWorkerNames, name]),
      })
      setForm({ ...form, workerNames: normalizeWorkerNames([...form.workerNames, name]) })
      setPendingWorkerName("")
      setErrors(clearWorkerNamesError(errors))
      return
    }
  }

  function toggleWorker(name: string): void {
    const workerNames = form.workerNames.includes(name)
      ? form.workerNames.filter((workerName) => workerName !== name)
      : [...form.workerNames, name]
    setForm({ ...form, workerNames: normalizeWorkerNames(workerNames) })
    setErrors(clearWorkerNamesError(errors))
  }

  function selectQuantity(quantityReportId: string): void {
    const quantity = props.data.quantityReports.find((report) => report.id === quantityReportId)
    setForm({
      ...form,
      quantityReportId,
      copyItems: [createCopyItemInputFromQuantity(quantity)],
    })
    setErrors(clearQuantityAndCopyErrors(errors))
  }

  function updateCopyItems(copyItems: readonly WorkCopyItemInput[]): void {
    setForm({ ...form, copyItems })
    setErrors(clearCopyItemsError(errors))
  }

  function resetForm(): void {
    setForm(EMPTY_WORK_INPUT)
    setErrors({})
    setEditingId("")
    setPendingWorkerName("")
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
          onSelect={selectQuantity}
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

        <WorkParentSummary quantity={selectedQuantity} />

        <div className="form-grid">
          <FormField
            error={errors.date}
            label="작업 날짜"
            name="work-date"
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            type="date"
            value={form.date}
          />
          <WorkShiftSelect onChange={(shift) => setForm({ ...form, shift })} value={form.shift} />
          <FormField
            error={errors.floor}
            label="층수"
            name="work-floor"
            onChange={(event) => setForm({ ...form, floor: event.target.value })}
            value={form.floor}
          />
        </div>

        <WorkerToggleGroup
          error={errors.workerNames}
          onPendingWorkerNameChange={setPendingWorkerName}
          onRegisterWorker={registerWorker}
          onToggleWorker={toggleWorker}
          pendingWorkerName={pendingWorkerName}
          registeredWorkerNames={availableWorkerNames}
          selectedWorkerNames={form.workerNames}
        />

        <div className="readonly-grid" aria-label="작업일보 총원">
          <ReadOnlyField label="총원" value={`${form.workerNames.length}명`} />
        </div>

        <WorkCopyItemsEditor
          error={errors.copyItems}
          items={form.copyItems}
          onChange={updateCopyItems}
        />

        <WorkFormActions editing={editingId.length > 0} notice={notice} onCancel={resetForm} />
      </form>

      <WorkReportList
        filter={filter}
        onDelete={deleteReport}
        onEdit={startEdit}
        onFilterChange={setFilter}
        rows={rows}
      />
    </section>
  )
}

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}
