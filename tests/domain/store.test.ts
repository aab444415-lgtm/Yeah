import { describe, expect, it } from "vitest"
import { updateQuantityReport } from "../../src/domain/reports"
import {
  EMPTY_STORE,
  type ReportStore,
  exportQuantityCsv,
  exportWorkCsv,
  importBackup,
  joinWorkReports,
  parseStoredData,
  serializeStore,
  summarizeReports,
} from "../../src/domain/store"
import { makeQuantityReport, makeStore, makeWorkReport, testNow } from "./reportFixtures"

describe("report store selectors and import/export", () => {
  it("Given duplicate quantity IDs in localStorage When parsing Then the empty store is returned", () => {
    const quantity = makeQuantityReport({ id: "qty-duplicate" })
    const duplicateQuantity = makeQuantityReport({
      id: "qty-duplicate",
      input: {
        date: "2026-06-26",
        line: "B",
        equipmentUnit: "3호기",
        rmdNumber: "RMD-002",
        vmbCode: "VMB-B12",
        meterCount: "9",
        location: "서측",
      },
    })
    const source = JSON.stringify(makeStore({ quantityReports: [quantity, duplicateQuantity] }))

    expect(parseStoredData(source)).toEqual(EMPTY_STORE)
  })

  it("Given duplicate work IDs in localStorage When parsing Then the empty store is returned", () => {
    const quantity = makeQuantityReport({ id: "qty-parent" })
    const work = makeWorkReport({ id: "work-duplicate", quantityReportId: quantity.id })
    const duplicateWork = makeWorkReport({
      id: "work-duplicate",
      quantityReportId: quantity.id,
      input: { name: "이서연", totalWorkers: "3", floor: "4층" },
    })
    const source = JSON.stringify(
      makeStore({ quantityReports: [quantity], workReports: [work, duplicateWork] }),
    )

    expect(parseStoredData(source)).toEqual(EMPTY_STORE)
  })

  it("Given orphan child in localStorage When parsing Then the empty store is returned", () => {
    const orphan = makeWorkReport({ id: "work-orphan", quantityReportId: "missing-quantity" })
    const source = JSON.stringify(makeStore({ workReports: [orphan] }))

    expect(parseStoredData(source)).toEqual(EMPTY_STORE)
  })

  it("Given valid linked reports When serializing and parsing Then the JSON round trip is preserved", () => {
    const quantity = makeQuantityReport({ id: "qty-round-trip" })
    const work = makeWorkReport({ id: "work-round-trip", quantityReportId: quantity.id })
    const data = makeStore({ quantityReports: [quantity], workReports: [work] })

    expect(parseStoredData(serializeStore(data))).toEqual(data)
  })

  it("Given malformed JSON When importing Then existing data is preserved with Korean error", () => {
    const current = makeStore()

    const result = importBackup("{ broken", current)

    expect(result).toEqual({
      kind: "error",
      message: "가져올 JSON 형식이 올바르지 않습니다.",
      data: current,
    })
  })

  it("Given an orphan work report When joining Then a missing parent error is returned", () => {
    const work = makeWorkReport({ quantityReportId: "missing" })

    const result = joinWorkReports([], [work])

    expect(result).toEqual({
      kind: "error",
      message: "작업일보가 존재하지 않는 물량일보에 연결되어 있습니다.",
    })
  })

  it("Given linked reports When exporting Then CSV and summary include derived parent fields", () => {
    const quantity = makeQuantityReport()
    const work = makeWorkReport({ quantityReportId: quantity.id })
    const data = makeStore({ quantityReports: [quantity], workReports: [work] })

    expect(exportQuantityCsv(data)).toContain("날짜,라인,장비호기,RMD번호,VMB코드,미터 수,위치")
    expect(exportWorkCsv(data)).toContain("날짜,라인,장비호기,이름,총원,층수")
    expect(exportWorkCsv(data)).toContain("2026-06-25,A,2호기,김민수,8,3층")
    expect(summarizeReports(data)).toEqual([
      {
        date: "2026-06-25",
        line: "A",
        equipmentUnit: "2호기",
        meterCount: 12.5,
        quantityCount: 1,
        workCount: 1,
        totalWorkers: 8,
        quantityReports: [quantity],
        workReports: [
          {
            id: "work-1",
            quantityReportId: "qty-1",
            date: "2026-06-25",
            line: "A",
            equipmentUnit: "2호기",
            name: "김민수",
            totalWorkers: 8,
            floor: "3층",
            createdAt: testNow,
            updatedAt: testNow,
          },
        ],
      },
    ])
  })

  it("Given linked child When parent line equipment and date are edited Then display data sources use updated parent fields", () => {
    const quantity = makeQuantityReport({ id: "qty-parent-edit" })
    const work = makeWorkReport({ id: "work-linked", quantityReportId: quantity.id })
    const editedQuantity = updateQuantityReport(
      quantity,
      { ...quantity, date: "2026-06-26", line: "B", equipmentUnit: "3호기", meterCount: "12.5" },
      "2026-06-25T01:00:00.000Z",
    )
    const data = makeStore({ quantityReports: [editedQuantity], workReports: [work] })

    expect(exportWorkCsv(data)).toContain("2026-06-26,B,3호기,김민수,8,3층")
    expect(summarizeReports(data)).toMatchObject([
      { date: "2026-06-26", line: "B", equipmentUnit: "3호기", workCount: 1, totalWorkers: 8 },
    ])
  })

  it("Given formula-risk cells with leading whitespace When exporting Then CSV prefixes them safely", () => {
    const quantity = makeQuantityReport({
      id: "qty-formula",
      input: {
        line: " =SUM(A1:A2)",
        equipmentUnit: "+2호기",
        rmdNumber: "-RMD-001",
        vmbCode: "@VMB-A12",
        location: "\t동측",
      },
    })
    const ordinary = makeQuantityReport({
      id: "qty-korean",
      input: {
        line: "가나다",
        rmdNumber: "RMD-002",
        vmbCode: "VMB-B12",
        meterCount: "3",
        location: "서측",
      },
    })
    const storedQuantity = { ...quantity, line: " =SUM(A1:A2)", location: "\t동측" }
    const data = makeStore({ quantityReports: [storedQuantity, ordinary] })

    const csv = exportQuantityCsv(data)

    expect(csv).toContain("'\t동측")
    expect(csv).toContain("' =SUM(A1:A2),'+2호기,'-RMD-001,'@VMB-A12")
    expect(csv).toContain("2026-06-25,가나다,2호기,RMD-002,VMB-B12,3,서측")
  })

  it("Given orphan child backup When importing Then current data is preserved with Korean error", () => {
    const currentQuantity = makeQuantityReport({ id: "qty-current" })
    const orphan = makeWorkReport({ id: "work-orphan", quantityReportId: "missing-quantity" })
    const current = makeStore({ quantityReports: [currentQuantity] })
    const source = JSON.stringify(makeStore({ workReports: [orphan] }))

    const result = importBackup(source, current)

    expect(result).toEqual({
      kind: "error",
      message: "가져올 작업일보가 존재하지 않는 물량일보에 연결되어 있습니다.",
      data: current,
    })
  })

  it("Given duplicate ids inside backup When importing Then current data is preserved with Korean error", () => {
    const quantity = makeQuantityReport({ id: "qty-duplicate" })
    const duplicateQuantity = makeQuantityReport({
      id: "qty-duplicate",
      input: { date: "2026-06-26" },
    })
    const current = makeStore()
    const source = JSON.stringify(makeStore({ quantityReports: [quantity, duplicateQuantity] }))

    const result = importBackup(source, current)

    expect(result).toEqual({
      kind: "error",
      message: "가져올 데이터에 중복된 ID가 있습니다.",
      data: current,
    })
  })

  it("Given duplicate work ids inside backup When importing Then current data is preserved with Korean error", () => {
    const quantity = makeQuantityReport({ id: "qty-parent" })
    const work = makeWorkReport({ id: "work-duplicate", quantityReportId: quantity.id })
    const duplicateWork = makeWorkReport({
      id: "work-duplicate",
      quantityReportId: quantity.id,
      input: { name: "이서연", totalWorkers: "3", floor: "4층" },
    })
    const current: ReportStore = makeStore()
    const source = JSON.stringify(
      makeStore({ quantityReports: [quantity], workReports: [work, duplicateWork] }),
    )

    const result = importBackup(source, current)

    expect(result).toEqual({
      kind: "error",
      message: "가져올 데이터에 중복된 ID가 있습니다.",
      data: current,
    })
  })
})
