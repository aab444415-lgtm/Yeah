import { Download, Upload } from "lucide-react"
import type { ChangeEvent, ReactElement } from "react"
import { useRef, useState } from "react"
import {
  type ReportStore,
  exportBackup,
  exportQuantityCsv,
  exportWorkCsv,
  importBackup,
} from "../domain/store"

type BackupControlsProps = {
  readonly data: ReportStore
  readonly onChange: (data: ReportStore) => void
}

export function BackupControls(props: BackupControlsProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")

  function download(name: string, content: string, type: string): void {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const link = document.createElement("a")
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.item(0)
    if (file === null || file === undefined) return
    try {
      const text = await readFileText(file)
      const result = importBackup(text, props.data)
      if (result.kind === "success") {
        props.onChange(result.data)
        setMessage(result.message)
        setError("")
      } else {
        setError(result.message)
        setMessage("")
      }
    } catch (caught) {
      if (caught instanceof Error) {
        setError(`파일을 읽을 수 없습니다: ${caught.message}`)
        setMessage("")
        return
      }
      throw caught
    } finally {
      event.target.value = ""
    }
  }

  return (
    <section className="backup-bar" aria-label="백업 및 내보내기">
      <div className="backup-actions">
        <button
          onClick={() =>
            download("작업일보-물량일보-backup.json", exportBackup(props.data), "application/json")
          }
          type="button"
        >
          <Download size={16} /> JSON 백업
        </button>
        <button
          onClick={() =>
            download("물량일보.csv", exportQuantityCsv(props.data), "text/csv;charset=utf-8")
          }
          type="button"
        >
          <Download size={16} /> 물량일보 CSV
        </button>
        <button
          onClick={() =>
            download("작업일보.csv", exportWorkCsv(props.data), "text/csv;charset=utf-8")
          }
          type="button"
        >
          <Download size={16} /> 작업일보 CSV
        </button>
        <button onClick={() => inputRef.current?.click()} type="button">
          <Upload size={16} /> JSON 가져오기
        </button>
        <input
          accept="application/json,.json"
          aria-label="JSON 가져오기 파일"
          className="visually-hidden"
          onChange={handleImport}
          ref={inputRef}
          type="file"
        />
      </div>
      <div aria-live="polite" className="backup-message">
        {message.length > 0 ? <span className="success-text">{message}</span> : null}
        {error.length > 0 ? <span className="error-text">{error}</span> : null}
      </div>
    </section>
  )
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }
      reject(new Error("텍스트 파일이 아닙니다."))
    })
    reader.addEventListener("error", () => reject(new Error("파일 읽기에 실패했습니다.")))
    reader.readAsText(file)
  })
}
