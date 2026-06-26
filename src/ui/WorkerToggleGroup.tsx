import { Plus } from "lucide-react"
import type { ReactElement } from "react"

type WorkerToggleGroupProps = {
  readonly registeredWorkerNames: readonly string[]
  readonly selectedWorkerNames: readonly string[]
  readonly pendingWorkerName: string
  readonly error?: string | undefined
  readonly onPendingWorkerNameChange: (name: string) => void
  readonly onRegisterWorker: () => void
  readonly onToggleWorker: (name: string) => void
}

export function WorkerToggleGroup(props: WorkerToggleGroupProps): ReactElement {
  return (
    <section className="worker-panel" aria-label="출근자 선택">
      <div className="worker-register">
        <label className="field" htmlFor="work-worker-name">
          <span>이름 등록</span>
          <input
            id="work-worker-name"
            onChange={(event) => props.onPendingWorkerNameChange(event.target.value)}
            value={props.pendingWorkerName}
          />
        </label>
        <button onClick={props.onRegisterWorker} type="button">
          <Plus size={16} /> 이름 추가
        </button>
      </div>

      <div className="worker-toggle-list">
        {props.registeredWorkerNames.length === 0 ? (
          <p className="empty-state">등록된 이름이 없습니다.</p>
        ) : (
          props.registeredWorkerNames.map((name) => {
            const selected = props.selectedWorkerNames.includes(name)
            return (
              <button
                aria-pressed={selected}
                className={selected ? "worker-toggle is-selected" : "worker-toggle"}
                key={name}
                onClick={() => props.onToggleWorker(name)}
                type="button"
              >
                {name}
              </button>
            )
          })
        )}
      </div>
      {props.error === undefined ? null : <strong className="field-error">{props.error}</strong>}
    </section>
  )
}
