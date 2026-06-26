import {
  type QuantityInput,
  type QuantityReport,
  type WorkInput,
  type WorkReport,
  createQuantityReport,
  createWorkReport,
} from "../../src/domain/reports"
import type { ReportStore } from "../../src/domain/store"

export const testNow = "2026-06-25T00:00:00.000Z"

const defaultQuantityInput: QuantityInput = {
  date: "2026-06-25",
  line: "A",
  equipmentUnit: "2호기",
  rmdNumber: "RMD-001",
  vmbCode: "VMB-A12",
  meterCount: "12.5",
  location: "동측",
}

const defaultWorkInput: Omit<WorkInput, "quantityReportId"> = {
  date: "2026-06-25",
  shift: "주간",
  workerNames: ["김민수", "이서연"],
  floor: "3층",
  sectionLabel: "",
  workBlocks: [{ title: "A 3층", detailText: "VMB-A12\n케이블 자켓 12.5m" }],
  closingNote: "",
}

type QuantityFixtureArgs = {
  readonly id?: string
  readonly now?: string
  readonly input?: Partial<QuantityInput>
}

type WorkFixtureArgs = {
  readonly id?: string
  readonly now?: string
  readonly quantityReportId: string
  readonly input?: Partial<Omit<WorkInput, "quantityReportId">>
}

type StoreFixtureArgs = {
  readonly quantityReports?: readonly QuantityReport[]
  readonly workReports?: readonly WorkReport[]
}

export function makeQuantityReport(args: QuantityFixtureArgs = {}): QuantityReport {
  return createQuantityReport({
    id: args.id ?? "qty-1",
    now: args.now ?? testNow,
    input: { ...defaultQuantityInput, ...args.input },
  })
}

export function makeWorkReport(args: WorkFixtureArgs): WorkReport {
  return createWorkReport({
    id: args.id ?? "work-1",
    now: args.now ?? testNow,
    input: {
      ...defaultWorkInput,
      ...args.input,
      quantityReportId: args.quantityReportId,
    },
  })
}

export function makeStore(args: StoreFixtureArgs = {}): ReportStore {
  const workReports = [...(args.workReports ?? [])]
  return {
    version: 1,
    registeredWorkerNames: Array.from(new Set(workReports.flatMap((report) => report.workerNames))),
    quantityReports: [...(args.quantityReports ?? [])],
    workReports,
  }
}
