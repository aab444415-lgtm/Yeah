import { Plus, X } from "lucide-react"
import type { ReactElement } from "react"
import { useState } from "react"
import {
  type QuantityFieldErrors,
  type QuantityInput,
  type QuantityReport,
  createQuantityReport,
  validateQuantityInput,
} from "../domain/reports"
import { FormField } from "./FormField"

type InlineQuantityCreatorProps = {
  readonly onCreate: (report: QuantityReport) => void
  readonly onCancel?: (() => void) | undefined
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

export function InlineQuantityCreator(props: InlineQuantityCreatorProps): ReactElement {
  const [input, setInput] = useState<QuantityInput>(EMPTY_INPUT)
  const [errors, setErrors] = useState<QuantityFieldErrors>({})

  function submit(): void {
    const nextErrors = validateQuantityInput(input)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const report = createQuantityReport({
      id: makeId("qty"),
      now: new Date().toISOString(),
      input,
    })
    props.onCreate(report)
    setInput(EMPTY_INPUT)
    setErrors({})
  }

  return (
    <section className="inline-parent" aria-label="작업일보에서 물량일보 같이 만들기">
      <div className="inline-parent-heading">
        <strong>물량일보 같이 만들기</strong>
        <span>저장하면 바로 연결됩니다.</span>
      </div>
      <div className="form-grid">
        <FormField
          error={errors.date}
          label="같이 만들 날짜"
          name="inline-quantity-date"
          onChange={(event) => setInput({ ...input, date: event.target.value })}
          type="date"
          value={input.date}
        />
        <FormField
          error={errors.line}
          label="같이 만들 라인"
          name="inline-quantity-line"
          onChange={(event) => setInput({ ...input, line: event.target.value })}
          value={input.line}
        />
        <FormField
          error={errors.equipmentUnit}
          label="같이 만들 장비호기"
          name="inline-quantity-equipment"
          onChange={(event) => setInput({ ...input, equipmentUnit: event.target.value })}
          value={input.equipmentUnit}
        />
        <FormField
          error={errors.rmdNumber}
          label="같이 만들 RMD번호"
          name="inline-quantity-rmd"
          onChange={(event) => setInput({ ...input, rmdNumber: event.target.value })}
          value={input.rmdNumber}
        />
        <FormField
          error={errors.vmbCode}
          label="같이 만들 VMB코드"
          name="inline-quantity-vmb"
          onChange={(event) => setInput({ ...input, vmbCode: event.target.value })}
          value={input.vmbCode}
        />
        <FormField
          error={errors.meterCount}
          label="같이 만들 미터 수"
          min="0"
          name="inline-quantity-meter"
          onChange={(event) => setInput({ ...input, meterCount: event.target.value })}
          step="0.1"
          type="number"
          value={input.meterCount}
        />
        <FormField
          error={errors.location}
          label="같이 만들 위치"
          name="inline-quantity-location"
          onChange={(event) => setInput({ ...input, location: event.target.value })}
          value={input.location}
        />
      </div>
      <div className="command-row">
        <button onClick={submit} type="button">
          <Plus size={16} /> 물량일보 같이 만들기
        </button>
        {props.onCancel === undefined ? null : (
          <button onClick={props.onCancel} type="button">
            <X size={16} /> 닫기
          </button>
        )}
      </div>
    </section>
  )
}

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}
