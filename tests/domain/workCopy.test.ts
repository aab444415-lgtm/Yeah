import { describe, expect, it } from "vitest"
import { formatWorkCopyText } from "../../src/domain/workCopy"

describe("work report copy text", () => {
  it("Given work copy data When formatting Then it matches the paste-ready daily report form", () => {
    const result = formatWorkCopyText({
      date: "2026-06-26",
      shift: "연장",
      workerNames: ["김민수", "이서연"],
      totalWorkers: 2,
      line: "A",
      floor: "3층",
      copyItems: [
        { vmbCode: "VMB-A12", cableMeter: 12.5, jacketMeter: 3 },
        { vmbCode: "VMB-B22", cableMeter: 5, jacketMeter: 1 },
      ],
    })

    expect(result).toBe(
      [
        "2026-06-26 연장",
        "김민수, 이서연 2명",
        "",
        "A3층",
        "1. VMB-A12 12.5 3",
        "2. VMB-B22 5 1",
      ].join("\n"),
    )
  })
})
