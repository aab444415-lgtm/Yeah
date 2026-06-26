import { Plus, Trash2 } from "lucide-react"
import { type ReactElement, useRef } from "react"
import { EMPTY_WORK_BLOCK_INPUT, type WorkBlockInput } from "../domain/workCopy"

type WorkBlocksEditorProps = {
  readonly sectionLabel: string
  readonly blocks: readonly WorkBlockInput[]
  readonly closingNote: string
  readonly error: string | undefined
  readonly onSectionLabelChange: (value: string) => void
  readonly onBlocksChange: (blocks: readonly WorkBlockInput[]) => void
  readonly onClosingNoteChange: (value: string) => void
}

type WorkBlockPatch = Partial<WorkBlockInput>

export function WorkBlocksEditor(props: WorkBlocksEditorProps): ReactElement {
  const blocks = props.blocks.length > 0 ? props.blocks : [EMPTY_WORK_BLOCK_INPUT]
  const blockKeys = useBlockKeys(blocks.length)

  function updateBlock(index: number, patch: WorkBlockPatch): void {
    props.onBlocksChange(
      blocks.map((block, current) => (current === index ? { ...block, ...patch } : block)),
    )
  }

  function addBlock(): void {
    props.onBlocksChange([...blocks, EMPTY_WORK_BLOCK_INPUT])
  }

  function removeBlock(index: number): void {
    const nextBlocks = blocks.filter((_, current) => current !== index)
    props.onBlocksChange(nextBlocks.length > 0 ? nextBlocks : [EMPTY_WORK_BLOCK_INPUT])
  }

  return (
    <section className="work-blocks-editor" aria-labelledby="work-blocks-heading">
      <div className="section-heading compact-heading">
        <p className="eyebrow">작업 내용</p>
        <h3 id="work-blocks-heading">작업 묶음</h3>
      </div>

      <label className="field" htmlFor="work-section-label">
        <span>작업 분류</span>
        <input
          id="work-section-label"
          onChange={(event) => props.onSectionLabelChange(event.target.value)}
          placeholder="HF"
          value={props.sectionLabel}
        />
      </label>

      <div className="work-block-list">
        {blocks.map((block, index) => (
          <fieldset className="work-block" key={blockKeys[index]}>
            <legend>{index + 1}번 작업</legend>
            <label className="field" htmlFor={`work-block-title-${index}`}>
              <span>{index + 1}번 작업 위치/제목</span>
              <input
                aria-invalid={props.error !== undefined && block.title.trim().length === 0}
                id={`work-block-title-${index}`}
                onChange={(event) => updateBlock(index, { title: event.target.value })}
                placeholder="P2L 1F BUNKER-1 연결"
                value={block.title}
              />
            </label>
            <label className="field" htmlFor={`work-block-detail-${index}`}>
              <span>{index + 1}번 작업 내용</span>
              <textarea
                aria-invalid={props.error !== undefined && block.detailText.trim().length === 0}
                id={`work-block-detail-${index}`}
                onChange={(event) => updateBlock(index, { detailText: event.target.value })}
                placeholder={"SGPL2HF0P01_CABE06  #OUT\n케이블 자켓 16m"}
                rows={4}
                value={block.detailText}
              />
            </label>
            {blocks.length > 1 ? (
              <button
                aria-label={`${index + 1}번 작업 삭제`}
                className="danger icon-button"
                onClick={() => removeBlock(index)}
                title={`${index + 1}번 작업 삭제`}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </fieldset>
        ))}
      </div>

      {props.error !== undefined ? <p className="field-error">{props.error}</p> : null}

      <button onClick={addBlock} type="button">
        <Plus size={16} /> 작업 묶음 추가
      </button>

      <label className="field" htmlFor="work-closing-note">
        <span>마무리 메모</span>
        <textarea
          id="work-closing-note"
          onChange={(event) => props.onClosingNoteChange(event.target.value)}
          placeholder="내부작업 완료 20옴"
          rows={2}
          value={props.closingNote}
        />
      </label>
    </section>
  )
}

function useBlockKeys(length: number): readonly string[] {
  const keys = useRef<string[]>([])
  while (keys.current.length < length) keys.current.push(crypto.randomUUID())
  if (keys.current.length > length) keys.current = keys.current.slice(0, length)
  return keys.current
}
