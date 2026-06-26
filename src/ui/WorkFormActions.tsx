import { Plus, Save, X } from "lucide-react"
import type { ReactElement } from "react"

type WorkFormActionsProps = {
  readonly editing: boolean
  readonly notice: string
  readonly onCancel: () => void
}

export function WorkFormActions(props: WorkFormActionsProps): ReactElement {
  return (
    <>
      <div className="command-row">
        <button className="primary" type="submit">
          {props.editing ? <Save size={16} /> : <Plus size={16} />}
          {props.editing ? "수정 저장" : "저장"}
        </button>
        {props.editing ? (
          <button onClick={props.onCancel} type="button">
            <X size={16} /> 취소
          </button>
        ) : null}
      </div>
      <p aria-live="polite" className="notice">
        {props.notice}
      </p>
    </>
  )
}
