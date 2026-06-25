# 작업일보 물량일보 Design System

## 1. Atmosphere & Identity

작업 현장에서 반복 입력과 확인을 빠르게 끝내는 조용한 운영 콘솔이다. 시각적 서명은 얇은 선, 높은 대비의 숫자, 절제된 상태 색상으로 만든 밀도 있는 표면이다. 장식보다 스캔 속도와 입력 안정성을 우선한다.

## 2. Color

### Palette

| Role | Token | Light | Usage |
| --- | --- | --- | --- |
| Surface/base | `--surface` | `#f6f8fb` | 전체 배경 |
| Surface/panel | `--surface-panel` | `#ffffff` | 폼, 목록, 요약 패널 |
| Surface-muted | `--surface-muted` | `#eef3f7` | 읽기 전용 값, 빈 상태 |
| Text/primary | `--text` | `#111827` | 본문, 제목 |
| Text/secondary | `--text-muted` | `#5b6573` | 보조 설명, 메타 |
| Border/default | `--border` | `#d7dee8` | 입력, 테이블, 구획선 |
| Accent/primary | `--accent` | `#047857` | 저장, 주요 동작 |
| Accent/hover | `--accent-hover` | `#065f46` | 주요 동작 hover |
| Status/info | `--info` | `#1d4ed8` | 연결 정보, 요약 강조 |
| Status/warning | `--warning` | `#b45309` | 주의, 중복 건너뜀 |
| Status/error | `--error` | `#b91c1c` | 오류, 삭제 |
| Status/error-bg | `--error-bg` | `#fee2e2` | 오류 배경 |

### Rules

- Accent is used only for commands and selected navigation.
- No decorative gradients, large color blocks, or single-hue pages.
- Raw color values appear only in token definitions.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| H1 | `28px` | 700 | 1.25 | 0 | 앱 제목 |
| H2 | `20px` | 700 | 1.35 | 0 | 탭 섹션 제목 |
| H3 | `16px` | 700 | 1.4 | 0 | 패널 제목 |
| Body | `15px` | 400 | 1.55 | 0 | 기본 텍스트 |
| Body/sm | `13px` | 400 | 1.45 | 0 | 보조 정보 |
| Caption | `12px` | 600 | 1.35 | 0 | 라벨, 배지 |

### Font Stack

- Primary: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Mono: `"SFMono-Regular", Consolas, "Liberation Mono", monospace`

### Rules

- Body text never drops below 13px.
- Korean labels stay direct and short.
- Numeric totals use tabular figures.

## 4. Spacing & Layout

### Base Unit

All spacing derives from 4px.

| Token | Value | Usage |
| --- | --- | --- |
| `--space-1` | `4px` | Tight icon/label gap |
| `--space-2` | `8px` | Compact row gap |
| `--space-3` | `12px` | Input padding, list gap |
| `--space-4` | `16px` | Panel padding |
| `--space-5` | `20px` | Section inner spacing |
| `--space-6` | `24px` | Page grid gap |
| `--space-8` | `32px` | Major separation |

### Grid

- Max content width: `1280px`.
- Breakpoints: 375px mobile target, 768px tablet target, 1280px desktop target.
- Main views use a responsive two-column authoring/list layout that collapses to one column below 900px.

### Rules

- Fixed-format controls have stable min heights.
- Tables and row lists must wrap without horizontal overflow on 375px.

## 5. Components

### Tab Navigation

- **Structure**: `role="tablist"` wrapping button tabs.
- **Variants**: selected, default.
- **Spacing**: `--space-1`, `--space-2`.
- **States**: hover, active, focus-visible.
- **Accessibility**: buttons expose tab role and `aria-selected`.
- **Motion**: color and border transitions only.

### Form Panel

- **Structure**: section header, validation summary, labeled inputs, command row.
- **Variants**: create, edit.
- **Spacing**: `--space-3`, `--space-4`.
- **States**: default, error, disabled, read-only.
- **Accessibility**: every input has a visible label and invalid state text.
- **Motion**: no layout animation.

### Report Row

- **Structure**: compact row with primary values, metadata, and commands.
- **Variants**: quantity, work, summary drill-down.
- **Spacing**: `--space-2`, `--space-3`.
- **States**: hover, focus-within, blocked delete.
- **Accessibility**: command buttons are named with record context.
- **Motion**: background transition only.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | `120ms` | `ease-out` | Button and tab states |
| Standard | `180ms` | `ease-in-out` | Panel state changes |

### Rules

- Only color, opacity, and transform may transition.
- Every button, input, select, and file label has visible focus.
- Disabled commands remain readable and announce why nearby.

## 7. Depth & Surface

### Strategy

Borders-only with subtle tonal shifts.

| Type | Value | Usage |
| --- | --- | --- |
| Default | `1px solid var(--border)` | Panels, inputs, rows |
| Radius | `8px` | Panels and rows |
| Compact radius | `6px` | Inputs and buttons |

No box shadows, decorative blobs, or nested cards.
