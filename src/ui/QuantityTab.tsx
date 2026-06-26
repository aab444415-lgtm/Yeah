import { Plus, Save, X } from "lucide-react"
import type { ReactElement } from "react"
import { useState } from "react"
import {
  type QuantityFieldErrors,
  type QuantityInput,
  type QuantityReport,
  createQuantityReport,
  updateQuantityReport,
  validateQuantityInput,
} from "../domain/reports"
import type { ReportStore } from "../domain/store"
import { FormField } from "./FormField"
import { QuantityReportList } from "./QuantityReportList"

type QuantityTabProps = {
  readonly data: ReportStore
  readonly onChange: (data: ReportStore) => void
}

const EMPTY_INPUT: QuantityInput = {
  date: "",
  line: "",
  equipmentUnit: "",
  rmdNumber: "",
  vmbCode: "",
  meterCount: "",
  location: "",
}

export function QuantityTab(props: QuantityTabProps): ReactElement {
  const [form, setForm] = useState<QuantityInput>(EMPTY_INPUT)
  const [errors, setErrors] = useState<QuantityFieldErrors>({})
  const [editingId, setEditingId] = useState<string>("")
  const [filter, setFilter] = useState<string>("")
  const [selectedLine, setSelectedLine] = useState<string>("")
  const [notice, setNotice] = useState<string>("")

  function submit(): void {
    const nextErrors = validateQuantityInput(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const now = new Date().toISOString()
    if (editingId.length > 0) {
      const nextReports = props.data.quantityReports.map((report) =>
        report.id === editingId ? updateQuantityReport(report, form, now) : report,
      )
      props.onChange({ ...props.data, quantityReports: nextReports })
      setNotice("물량일보를 수정했습니다.")
    } else {
      const report = createQuantityReport({ id: makeId("qty"), now, input: form })
      props.onChange({ ...props.data, quantityReports: [report, ...props.data.quantityReports] })
      setNotice("물량일보를 저장했습니다.")
    }
    resetForm()
  }

  function startEdit(report: QuantityReport): void {
    setEditingId(report.id)
    setForm({
      date: report.date,
      line: report.line,
      equipmentUnit: report.equipmentUnit,
      rmdNumber: report.rmdNumber,
      vmbCode: report.vmbCode,
      meterCount: String(report.meterCount),
      location: report.location,
    })
    setErrors({})
    setNotice("")
  }

  function deleteReport(report: QuantityReport): void {
    const linkedCount = countLinked(report.id, props.data)
    if (linkedCount > 0) {
      setNotice(`연결된 작업일보 ${linkedCount}건이 있어 삭제할 수 없습니다.`)
      return
    }
    if (
      !window.confirm(
        `${report.date} ${report.line} ${report.equipmentUnit} 물량일보를 삭제할까요?`,
      )
    ) {
      return
    }
    props.onChange({
      ...props.data,
      quantityReports: props.data.quantityReports.filter((row) => row.id !== report.id),
    })
    setNotice("물량일보를 삭제했습니다.")
  }

  function resetForm(): void {
    setForm(EMPTY_INPUT)
    setErrors({})
    setEditingId("")
  }

  return (
    <section className="view-grid" aria-labelledby="quantity-heading">
      <form
        className="panel form-panel"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="section-heading">
          <p className="eyebrow">상위 물량 데이터</p>
          <h2 id="quantity-heading">{editingId.length > 0 ? "물량일보 수정" : "물량일보 작성"}</h2>
        </div>
        <div className="form-grid">
          <FormField
            error={errors.date}
            label="날짜"
            name="quantity-date"
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            type="date"
            value={form.date}
          />
          <FormField
            error={errors.line}
            label="라인"
            name="quantity-line"
            onChange={(event) => setForm({ ...form, line: event.target.value })}
            value={form.line}
          />
          <FormField
            error={errors.equipmentUnit}
            label="장비호기"
            name="quantity-equipment"
            onChange={(event) => setForm({ ...form, equipmentUnit: event.target.value })}
            value={form.equipmentUnit}
          />
          <FormField
            error={errors.rmdNumber}
            label="RMD번호"
            name="quantity-rmd"
            onChange={(event) => setForm({ ...form, rmdNumber: event.target.value })}
            value={form.rmdNumber}
          />
          <FormField
            error={errors.vmbCode}
            label="VMB코드"
            name="quantity-vmb"
            onChange={(event) => setForm({ ...form, vmbCode: event.target.value })}
            value={form.vmbCode}
          />
          <FormField
            error={errors.meterCount}
            label="미터 수"
            min="0"
            name="quantity-meter"
            onChange={(event) => setForm({ ...form, meterCount: event.target.value })}
            step="0.1"
            type="number"
            value={form.meterCount}
          />
          <FormField
            error={errors.location}
            label="위치"
            name="quantity-location"
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            value={form.location}
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

      <QuantityReportList
        filter={filter}
        onDelete={deleteReport}
        onEdit={startEdit}
        onFilterChange={setFilter}
        onLineChange={setSelectedLine}
        reports={props.data.quantityReports}
        selectedLine={selectedLine}
      />
    </section>
  )
}

function countLinked(quantityReportId: string, data: ReportStore): number {
  return data.workReports.filter((report) =>
    report.workBlocks.some((block) => block.quantityReportId === quantityReportId),
  ).length
}

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}
