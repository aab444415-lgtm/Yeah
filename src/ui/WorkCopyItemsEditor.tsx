import { Trash2 } from "lucide-react"
import type { ReactElement } from "react"
import { EMPTY_WORK_COPY_ITEM_INPUT, type WorkCopyItemInput } from "../domain/workCopy"
import { FormField } from "./FormField"

type WorkCopyItemsEditorProps = {
  readonly items: readonly WorkCopyItemInput[]
  readonly error?: string | undefined
  readonly onChange: (items: readonly WorkCopyItemInput[]) => void
}

type WorkCopyItemPatch = Partial<WorkCopyItemInput>

export function WorkCopyItemsEditor(props: WorkCopyItemsEditorProps): ReactElement {
  function updateItem(index: number, patch: WorkCopyItemPatch): void {
    props.onChange(
      props.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    )
  }

  function addItem(): void {
    props.onChange([...props.items, EMPTY_WORK_COPY_ITEM_INPUT])
  }

  function removeItem(index: number): void {
    const nextItems = props.items.filter((_, itemIndex) => itemIndex !== index)
    props.onChange(nextItems.length === 0 ? [EMPTY_WORK_COPY_ITEM_INPUT] : nextItems)
  }

  return (
    <section className="work-copy-editor" aria-label="복사용 VMB 항목">
      <div className="section-heading compact-heading">
        <p className="eyebrow">복사 붙여넣기 항목</p>
        <h3>VMB별 케이블 / 자켓 미터</h3>
      </div>
      {props.error === undefined ? null : <strong className="field-error">{props.error}</strong>}
      <div className="work-copy-list">
        {props.items.map((item, index) => {
          const position = index + 1
          return (
            <div className="work-copy-row" key={position}>
              <strong className="work-copy-index">{position}</strong>
              <FormField
                label={`${position}번 VMB코드`}
                name={`work-copy-vmb-${position}`}
                onChange={(event) => updateItem(index, { vmbCode: event.target.value })}
                value={item.vmbCode}
              />
              <FormField
                label={`${position}번 케이블미터`}
                min="0"
                name={`work-copy-cable-${position}`}
                onChange={(event) => updateItem(index, { cableMeter: event.target.value })}
                step="0.01"
                type="number"
                value={item.cableMeter}
              />
              <FormField
                label={`${position}번 자켓미터`}
                min="0"
                name={`work-copy-jacket-${position}`}
                onChange={(event) => updateItem(index, { jacketMeter: event.target.value })}
                step="0.01"
                type="number"
                value={item.jacketMeter}
              />
              {position === 1 ? null : (
                <button
                  aria-label={`${position}번 VMB 항목 삭제`}
                  className="danger icon-button"
                  onClick={() => removeItem(index)}
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )
        })}
      </div>
      <button onClick={addItem} type="button">
        VMB 항목 추가
      </button>
    </section>
  )
}
