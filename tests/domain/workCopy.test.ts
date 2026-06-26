import { describe, expect, it } from "vitest"
import { formatWorkCopyText } from "../../src/domain/workCopy"

describe("work report copy text", () => {
  it("Given cable work blocks When formatting Then it matches the multi-work daily report form", () => {
    const result = formatWorkCopyText({
      date: "2026-06-24",
      shift: "주간",
      workerNames: ["최병묵", "박진삼", "봉윤희", "최찬혁", "전진우", "김덕진", "박봉훈"],
      sectionLabel: "HF",
      workBlocks: [
        {
          title: "P2L 1F BUNKER-1 연결",
          detailLines: ["SGPL2HF0P01_CABE06  #OUT", "케이블 자켓 16m"],
        },
        {
          title: "P2L 2F 말단",
          detailLines: ["SGPL2HF0P01_VMBE03  #IN", "케이블 자켓 68m"],
        },
      ],
      closingNote: "내부작업 완료 20옴",
    })

    expect(result).toBe(
      [
        "2026.06.24 주간작업",
        "최병묵 박진삼 봉윤희 최찬혁 전진우 김덕진 박봉훈",
        "",
        "[HF]",
        "P2L 1F BUNKER-1 연결",
        "SGPL2HF0P01_CABE06  #OUT",
        "케이블 자켓 16m",
        "",
        "P2L 2F 말단",
        "SGPL2HF0P01_VMBE03  #IN",
        "케이블 자켓 68m",
        "",
        "내부작업 완료 20옴",
      ].join("\n"),
    )
  })

  it("Given non-meter work blocks When formatting Then plain task lines are preserved", () => {
    const result = formatWorkCopyText({
      date: "2026-06-22",
      shift: "주간",
      workerNames: ["최병묵", "박진삼", "박봉훈", "김덕진", "봉윤희", "최찬혁", "전진우"],
      sectionLabel: "",
      workBlocks: [
        {
          title: "P3L_6F",
          detailLines: ["WWO3708호기_PVC 실링캡작업"],
        },
        {
          title: "P2L_2F",
          detailLines: ["WKBBF01_PVC 실링캡작업", "WSNTF01_PVC 실링캡작업"],
        },
      ],
      closingNote: "",
    })

    expect(result).toBe(
      [
        "2026.06.22 주간작업",
        "최병묵 박진삼 박봉훈 김덕진 봉윤희 최찬혁 전진우",
        "",
        "P3L_6F",
        "WWO3708호기_PVC 실링캡작업",
        "",
        "P2L_2F",
        "WKBBF01_PVC 실링캡작업",
        "WSNTF01_PVC 실링캡작업",
      ].join("\n"),
    )
  })
})
