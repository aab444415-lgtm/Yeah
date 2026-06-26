import { describe, expect, it } from "vitest"
import { parseStoredData } from "../../src/domain/store"
import { makeQuantityReport, testNow } from "./reportFixtures"

describe("report store migration", () => {
  it("Given legacy work report storage When parsing Then it is migrated to direct date and worker names", () => {
    const quantity = makeQuantityReport({ id: "qty-legacy" })
    const source = JSON.stringify({
      version: 1,
      quantityReports: [quantity],
      workReports: [
        {
          id: "work-legacy",
          quantityReportId: quantity.id,
          name: "김민수",
          totalWorkers: 8,
          floor: "3층",
          createdAt: testNow,
          updatedAt: testNow,
        },
      ],
    })

    expect(parseStoredData(source)).toMatchObject({
      registeredWorkerNames: ["김민수"],
      workReports: [
        {
          id: "work-legacy",
          date: "2026-06-25",
          shift: "주간",
          workerNames: ["김민수"],
          sectionLabel: "",
          workBlocks: [
            {
              quantityReportId: quantity.id,
              title: "A 동측",
              detailLines: ["VMB-A12", "케이블 자켓 12.5m"],
            },
          ],
          closingNote: "",
        },
      ],
    })
  })

  it("Given flat VMB work storage When parsing Then it is migrated to work blocks", () => {
    const quantity = makeQuantityReport({ id: "qty-flat" })
    const source = JSON.stringify({
      version: 1,
      registeredWorkerNames: ["김민수"],
      quantityReports: [quantity],
      workReports: [
        {
          id: "work-flat",
          quantityReportId: quantity.id,
          date: "2026-06-26",
          shift: "연장",
          workerNames: ["김민수"],
          floor: "3층",
          copyItems: [{ vmbCode: "VMB-A12", cableMeter: 12.5, jacketMeter: 3 }],
          createdAt: testNow,
          updatedAt: testNow,
        },
      ],
    })

    expect(parseStoredData(source)).toMatchObject({
      workReports: [
        {
          id: "work-flat",
          shift: "연장",
          sectionLabel: "",
          workBlocks: [
            {
              quantityReportId: quantity.id,
              title: "A 3층",
              detailLines: ["1. VMB-A12 #1 케이블 12.5m 자켓 3m"],
            },
          ],
          closingNote: "",
        },
      ],
    })
  })

  it("Given previous block work storage When parsing Then the parent id moves into each block", () => {
    const quantity = makeQuantityReport({ id: "qty-block" })
    const source = JSON.stringify({
      version: 1,
      registeredWorkerNames: ["김민수"],
      quantityReports: [quantity],
      workReports: [
        {
          id: "work-block",
          quantityReportId: quantity.id,
          date: "2026-06-26",
          shift: "연장",
          workerNames: ["김민수"],
          floor: "3층",
          sectionLabel: "HF",
          workBlocks: [{ title: "A 3층", detailLines: ["VMB-A12 #1", "케이블 자켓 12.5m"] }],
          closingNote: "",
          createdAt: testNow,
          updatedAt: testNow,
        },
      ],
    })

    expect(parseStoredData(source)).toMatchObject({
      workReports: [
        {
          id: "work-block",
          sectionLabel: "HF",
          workBlocks: [
            {
              quantityReportId: quantity.id,
              title: "A 3층",
              detailLines: ["VMB-A12 #1", "케이블 자켓 12.5m"],
            },
          ],
        },
      ],
    })
  })
})
