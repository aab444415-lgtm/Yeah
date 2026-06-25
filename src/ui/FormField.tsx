import type { ChangeEventHandler, InputHTMLAttributes, ReactElement, ReactNode } from "react"

type FormFieldProps = {
  readonly label: string
  readonly name: string
  readonly value: string
  readonly onChange: ChangeEventHandler<HTMLInputElement>
  readonly error?: string | undefined
  readonly type?: InputHTMLAttributes<HTMLInputElement>["type"]
  readonly min?: string
  readonly step?: string
}

type ReadOnlyFieldProps = {
  readonly label: string
  readonly value: ReactNode
}

export function FormField(props: FormFieldProps): ReactElement {
  return (
    <label className="field" htmlFor={props.name}>
      <span>{props.label}</span>
      <input
        aria-invalid={props.error === undefined ? "false" : "true"}
        id={props.name}
        min={props.min}
        name={props.name}
        onChange={props.onChange}
        step={props.step}
        type={props.type ?? "text"}
        value={props.value}
      />
      {props.error === undefined ? null : <strong className="field-error">{props.error}</strong>}
    </label>
  )
}

export function ReadOnlyField(props: ReadOnlyFieldProps): ReactElement {
  return (
    <div className="readonly-field">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  )
}
