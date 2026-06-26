import { describe, expect, it } from "vitest"
import { summarizeReports } from "../../src/domain/store"
import { makeQuantityReport, makeStore, makeWorkReport } from "./reportFixtures"

describe("summary reports", () => {
  it("Given one work report linked to multiple quantities in the same group When summarizing Then workers are counted once", () => {
    const firstQuantity = makeQuantityReport({ id: "qty-first" })
    const secondQuantity = makeQuantityReport({
      id: "qty-second",
      input: { rmdNumber: "RMD-002", vmbCode: "VMB-B12", meterCount: "7.5" },
    })
    const work = makeWorkReport({
      quantityReportId: firstQuantity.id,
      input: {
        workBlocks: [
          {
            quantityReportId: firstQuantity.id,
            title: "A 동측",
            detailText: "VMB-A12\n케이블 자켓 12.5m",
          },
          {
            quantityReportId: secondQuantity.id,
            title: "A 서측",
            detailText: "VMB-B12\n케이블 자켓 7.5m",
          },
        ],
      },
    })
    const data = makeStore({
      quantityReports: [firstQuantity, secondQuantity],
      workReports: [work],
    })

    expect(summarizeReports(data)).toMatchObject([
      {
        meterCount: 20,
        quantityCount: 2,
        workCount: 1,
        totalWorkers: 2,
        workReports: [{ id: work.id }],
      },
    ])
  })
})
