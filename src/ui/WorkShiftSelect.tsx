import type { ReactElement } from "react"
import { WORK_SHIFT_OPTIONS, type WorkShift, parseWorkShift } from "../domain/workCopy"

type WorkShiftSelectProps = {
  readonly value: WorkShift
  readonly onChange: (shift: WorkShift) => void
}

export function WorkShiftSelect(props: WorkShiftSelectProps): ReactElement {
  return (
    <label className="field" htmlFor="work-shift">
      <span>구분</span>
      <select
        id="work-shift"
        onChange={(event) => props.onChange(parseWorkShift(event.target.value))}
        value={props.value}
      >
        {WORK_SHIFT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
