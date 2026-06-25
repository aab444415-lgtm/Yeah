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
  name: "김민수",
  totalWorkers: "8",
  floor: "3층",
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
  return {
    version: 1,
    quantityReports: [...(args.quantityReports ?? [])],
    workReports: [...(args.workReports ?? [])],
  }
}
