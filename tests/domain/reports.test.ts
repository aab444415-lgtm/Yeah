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
      date: "",
      shift: "주간",
      workerNames: [],
      floor: "",
      sectionLabel: "",
      workBlocks: [],
      closingNote: "",
    })

    expect(result).toEqual({
      quantityReportId: "연결할 물량일보를 선택하세요.",
      date: "작업 날짜를 입력하세요.",
      workerNames: "출근자를 한 명 이상 선택하세요.",
      floor: "층수를 입력하세요.",
      workBlocks: "작업을 한 개 이상 입력하세요.",
    })
  })

  it("Given a parent quantity report When deriving a work view Then work date is direct and total follows selected workers", () => {
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
        date: "2026-06-26",
        shift: "연장",
        workerNames: ["김민수", "이서연"],
        floor: "3층",
        sectionLabel: "HF",
        workBlocks: [
          { title: "A 3층", detailText: "VMB-A12 #1\n케이블 자켓 12.5m" },
          { title: "B 4층", detailText: "VMB-B22 #2\n케이블 자켓 5m" },
        ],
        closingNote: "내부작업 완료",
      },
    })

    expect(deriveWorkReportView(work, quantity)).toMatchObject({
      id: "work-1",
      quantityReportId: "qty-1",
      date: "2026-06-26",
      shift: "연장",
      line: "A",
      equipmentUnit: "2호기",
      workerNames: ["김민수", "이서연"],
      totalWorkers: 2,
      floor: "3층",
      sectionLabel: "HF",
      workBlocks: [
        { title: "A 3층", detailLines: ["VMB-A12 #1", "케이블 자켓 12.5m"] },
        { title: "B 4층", detailLines: ["VMB-B22 #2", "케이블 자켓 5m"] },
      ],
      closingNote: "내부작업 완료",
    })
  })
})
