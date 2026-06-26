import type { ReactElement } from "react"
import type { QuantityReport } from "../domain/reports"
import { ReadOnlyField } from "./FormField"

type WorkParentSummaryProps = {
  readonly quantity: QuantityReport | undefined
}

export function WorkParentSummary(props: WorkParentSummaryProps): ReactElement {
  return (
    <div className="readonly-grid" aria-label="상위 물량일보에서 가져온 값">
      <ReadOnlyField label="물량 날짜" value={props.quantity?.date ?? "-"} />
      <ReadOnlyField label="라인" value={props.quantity?.line ?? "-"} />
      <ReadOnlyField label="장비호기" value={props.quantity?.equipmentUnit ?? "-"} />
    </div>
  )
}
