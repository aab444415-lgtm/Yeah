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
          quantityReportId: quantity.id,
          date: "2026-06-25",
          shift: "주간",
          workerNames: ["김민수"],
          floor: "3층",
          copyItems: [{ vmbCode: "VMB-A12", cableMeter: 12.5, jacketMeter: 0 }],
        },
      ],
    })
  })
})
