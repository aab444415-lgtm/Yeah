import { Plus } from "lucide-react"
import type { ReactElement } from "react"
import type { QuantityReport } from "../domain/reports"

type WorkParentSelectorProps = {
  readonly quantityReports: readonly QuantityReport[]
  readonly selectedId: string
  readonly error?: string | undefined
  readonly expanded: boolean
  readonly onSelect: (id: string) => void
  readonly onToggleCreator: () => void
}

export function WorkParentSelector(props: WorkParentSelectorProps): ReactElement {
  if (props.quantityReports.length === 0) {
    return (
      <div className="parent-picker">
        <p className="empty-state">연결할 물량일보가 없습니다. 아래에서 바로 만드세요.</p>
        {props.error === undefined ? null : <strong className="field-error">{props.error}</strong>}
      </div>
    )
  }

  return (
    <div className="parent-picker">
      <label className="field" htmlFor="work-parent">
        <span>연결 물량일보</span>
        <select
          aria-invalid={props.error === undefined ? "false" : "true"}
          id="work-parent"
          onChange={(event) => props.onSelect(event.target.value)}
          value={props.selectedId}
        >
          <option value="">선택하세요</option>
          {props.quantityReports.map((report) => (
            <option key={report.id} value={report.id}>
              {report.date} / {report.line} / {report.equipmentUnit} / {report.rmdNumber}
            </option>
          ))}
        </select>
        {props.error === undefined ? null : <strong className="field-error">{props.error}</strong>}
      </label>
      <button aria-expanded={props.expanded} onClick={props.onToggleCreator} type="button">
        <Plus size={16} /> 물량일보 같이 만들기
      </button>
    </div>
  )
}
