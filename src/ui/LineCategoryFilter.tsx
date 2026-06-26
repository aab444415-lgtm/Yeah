import type { ReactElement } from "react"
import type { LineCategory } from "./lineCategories"

type LineCategoryFilterProps = {
  readonly label: string
  readonly categories: readonly LineCategory[]
  readonly selectedLine: string
  readonly totalCount: number
  readonly onSelect: (line: string) => void
}

export function LineCategoryFilter(props: LineCategoryFilterProps): ReactElement | null {
  if (props.totalCount === 0) return null
  return (
    <section className="line-category-panel" aria-label={props.label}>
      <div className="line-category-heading">
        <span>라인별 보기</span>
        <strong>{props.totalCount}건</strong>
      </div>
      <div className="line-category-list">
        <button
          aria-pressed={props.selectedLine.length === 0}
          className="line-category-chip"
          onClick={() => props.onSelect("")}
          type="button"
        >
          전체 <span>{props.totalCount}</span>
        </button>
        {props.categories.map((category) => (
          <button
            aria-pressed={props.selectedLine === category.line}
            className="line-category-chip"
            key={category.line}
            onClick={() => props.onSelect(category.line)}
            type="button"
          >
            {category.line} <span>{category.count}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
