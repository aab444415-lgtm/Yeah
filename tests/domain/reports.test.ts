import { describe, expect, it } from "vitest"
import {
  createQuantityReport,
  createWorkReport,
  deriveWorkReportView,
  validateQuantityInput,
  validateWorkInput,
} from "../../src/domain/reports"

describe("linked report domain", () => {
  it("Given invalid quantity fields When validating Then Korean field errors are returned", () => {
    const result = validateQuantityInput({
      date: "",
      line: "",
      equipmentUnit: "",
      rmdNumber: "",
      vmbCode: "",
      meterCount: "0",
      location: "",
    })

    expect(result).toEqual({
      date: "날짜를 입력하세요.",
      line: "라인을 입력하세요.",
      equipmentUnit: "장비호기를 입력하세요.",
      rmdNumber: "RMD번호를 입력하세요.",
      vmbCode: "VMB코드를 입력하세요.",
      meterCount: "미터 수는 0보다 커야 합니다.",
      location: "위치를 입력하세요.",
    })
  })

  it("Given invalid work fields When validating Then parent link and worker errors are returned", () => {
    const result = validateWorkInput({
      quantityReportId: "",
      name: "",
      totalWorkers: "0",
      floor: "",
    })

    expect(result).toEqual({
      quantityReportId: "연결할 물량일보를 선택하세요.",
      name: "이름을 입력하세요.",
      totalWorkers: "총원은 1명 이상의 정수여야 합니다.",
      floor: "층수를 입력하세요.",
    })
  })

  it("Given a parent quantity report When deriving a work view Then date line and equipment are inherited", () => {
    const quantity = createQuantityReport({
      id: "qty-1",
      now: "2026-06-25T00:00:00.000Z",
      input: {
        date: "2026-06-25",
        line: "A",
        equipmentUnit: "2호기",
        rmdNumber: "RMD-001",
        vmbCode: "VMB-A12",
        meterCount: "12.5",
        location: "동측",
      },
    })
    const work = createWorkReport({
      id: "work-1",
      now: "2026-06-25T01:00:00.000Z",
      input: {
        quantityReportId: quantity.id,
        name: "김민수",
        totalWorkers: "8",
        floor: "3층",
      },
    })

    expect(deriveWorkReportView(work, quantity)).toMatchObject({
      id: "work-1",
      quantityReportId: "qty-1",
      date: "2026-06-25",
      line: "A",
      equipmentUnit: "2호기",
      name: "김민수",
      totalWorkers: 8,
      floor: "3층",
    })
  })
})
