import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { App } from "../../src/ui/App"

describe("report app UI", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("Given empty quantity form When saving Then validation errors appear and no row is created", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "저장" }))

    expect(screen.getByText("날짜를 입력하세요.")).toBeInTheDocument()
    expect(screen.getByText("RMD번호를 입력하세요.")).toBeInTheDocument()
    expect(screen.getByText("미터 수는 0보다 커야 합니다.")).toBeInTheDocument()
    expect(screen.getByText("저장된 물량일보가 없습니다.")).toBeInTheDocument()
  })

  it("Given a quantity report When saving linked work Then inherited fields and summary totals appear", async () => {
    const user = userEvent.setup()
    render(<App />)

    await createQuantity(user)
    await user.click(screen.getByRole("tab", { name: "작업일보" }))
    await user.selectOptions(
      screen.getByLabelText("연결 물량일보"),
      screen.getByRole("option", { name: /RMD-001/u }),
    )
    expect(screen.getByLabelText("1번 작업 위치/제목")).toHaveDisplayValue("A")
    expect(screen.getByLabelText("1번 작업 내용")).toHaveDisplayValue("VMB-A12\n케이블 자켓 12.5m")
    await user.type(screen.getByLabelText("작업 날짜"), "2026-06-26")
    await user.selectOptions(screen.getByLabelText("구분"), "연장")
    await registerWorker(user, "김민수")
    await registerWorker(user, "이서연")
    await user.click(screen.getByRole("button", { name: "이서연" }))
    expect(screen.getByLabelText("작업일보 총원")).toHaveTextContent("1명")
    await user.type(screen.getByLabelText("대표 층수"), "3층")
    await user.type(screen.getByLabelText("작업 분류"), "HF")
    await user.clear(screen.getByLabelText("1번 작업 위치/제목"))
    await user.type(screen.getByLabelText("1번 작업 위치/제목"), "A 3층")
    await user.clear(screen.getByLabelText("1번 작업 내용"))
    await user.type(screen.getByLabelText("1번 작업 내용"), "VMB-A12 #1{enter}케이블 자켓 12.5m")
    await user.click(screen.getByRole("button", { name: "작업 묶음 추가" }))
    await user.type(screen.getByLabelText("2번 작업 위치/제목"), "B 4층")
    await user.type(screen.getByLabelText("2번 작업 내용"), "VMB-B22 #2{enter}케이블 자켓 5m")
    await user.click(screen.getByRole("button", { name: "저장" }))

    const workList = screen.getByLabelText("작업일보 목록")
    expect(within(workList).getByText("김민수 · 1명 · 3층")).toBeInTheDocument()
    expect(within(workList).getByText("2026-06-26 · A · 2호기")).toBeInTheDocument()
    expect(within(workList).getByLabelText("작업일보 복사용 내용").textContent).toBe(
      [
        "2026.06.26 연장작업",
        "김민수",
        "",
        "[HF]",
        "A 3층",
        "VMB-A12 #1",
        "케이블 자켓 12.5m",
        "",
        "B 4층",
        "VMB-B22 #2",
        "케이블 자켓 5m",
      ].join("\n"),
    )

    await user.click(screen.getByRole("tab", { name: "통합현황" }))
    expect(screen.getByText("12.5")).toBeInTheDocument()
    expect(screen.getAllByText("1건", { selector: "strong" })).toHaveLength(2)
    expect(screen.getByText("1명", { selector: "strong" })).toBeInTheDocument()
  })

  it("Given 작업일보 flow without a parent When creating 물량일보 inline Then it is selected for the child", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("tab", { name: "작업일보" }))
    await user.type(screen.getByLabelText("같이 만들 날짜"), "2026-06-25")
    await user.type(screen.getByLabelText("같이 만들 라인"), "A")
    await user.type(screen.getByLabelText("같이 만들 장비호기"), "2호기")
    await user.type(screen.getByLabelText("같이 만들 RMD번호"), "RMD-001")
    await user.type(screen.getByLabelText("같이 만들 VMB코드"), "VMB-A12")
    await user.type(screen.getByLabelText("같이 만들 미터 수"), "12.5")
    await user.type(screen.getByLabelText("같이 만들 위치"), "동측")
    await user.click(screen.getByRole("button", { name: "물량일보 같이 만들기" }))

    expect(screen.getByText("물량 1건")).toBeInTheDocument()
    expect(screen.getByLabelText("연결 물량일보")).toHaveDisplayValue(
      "2026-06-25 / A / 2호기 / RMD-001",
    )
    expect(screen.getByLabelText("상위 물량일보에서 가져온 값")).toHaveTextContent("2026-06-25")
    expect(screen.getByLabelText("1번 작업 위치/제목")).toHaveDisplayValue("A")
    expect(screen.getByLabelText("1번 작업 내용")).toHaveDisplayValue("VMB-A12\n케이블 자켓 12.5m")

    await user.type(screen.getByLabelText("작업 날짜"), "2026-06-25")
    await registerWorker(user, "김민수")
    await user.type(screen.getByLabelText("대표 층수"), "3층")
    await user.click(screen.getByRole("button", { name: "저장" }))

    expect(screen.getByText("작업 1건")).toBeInTheDocument()
    expect(screen.getByText("2026-06-25 · A · 2호기")).toBeInTheDocument()
  })

  it("Given saved reports When the app remounts Then localStorage restores linked parent and child", async () => {
    const user = userEvent.setup()
    const rendered = render(<App />)

    await createQuantity(user)
    await createWork(user)
    rendered.unmount()
    render(<App />)

    expect(screen.getByText("물량 1건")).toBeInTheDocument()
    expect(screen.getByText("작업 1건")).toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: "작업일보" }))
    expect(screen.getByText("김민수 · 1명 · 3층")).toBeInTheDocument()
    expect(screen.getByText("2026-06-25 · A · 2호기")).toBeInTheDocument()
  })

  it("Given linked child When parent date line and equipment are edited Then work keeps its date and updates parent fields", async () => {
    const user = userEvent.setup()
    render(<App />)

    await createQuantity(user)
    await createWork(user)
    const quantityList = screen.getByLabelText("물량일보 목록")
    await user.click(within(quantityList).getByRole("button", { name: "수정" }))
    await user.clear(screen.getByLabelText("날짜"))
    await user.type(screen.getByLabelText("날짜"), "2026-06-26")
    await user.clear(screen.getByLabelText("라인"))
    await user.type(screen.getByLabelText("라인"), "B")
    await user.clear(screen.getByLabelText("장비호기"))
    await user.type(screen.getByLabelText("장비호기"), "3호기")
    await user.click(screen.getByRole("button", { name: "수정 저장" }))

    await user.click(screen.getByRole("tab", { name: "작업일보" }))
    expect(screen.getByText("2026-06-25 · B · 3호기")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "통합현황" }))
    expect(screen.getByText("2026-06-25 · B · 3호기")).toBeInTheDocument()
    expect(screen.getByText(/미터 12.5 \/ 물량 1건 \/ 작업/u)).toBeInTheDocument()
  })

  it("Given existing data When malformed JSON is imported Then data remains visible", async () => {
    const user = userEvent.setup()
    render(<App />)

    await createQuantity(user)
    const file = new File(["{ broken"], "broken.json", { type: "application/json" })
    await user.upload(screen.getByLabelText("JSON 가져오기 파일"), file)

    expect(screen.getByText("가져올 JSON 형식이 올바르지 않습니다.")).toBeInTheDocument()
    expect(screen.getByText("물량 1건")).toBeInTheDocument()
    expect(screen.getByText(/RMD-001/u)).toBeInTheDocument()
  })
})

async function createQuantity(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText("날짜"), "2026-06-25")
  await user.type(screen.getByLabelText("라인"), "A")
  await user.type(screen.getByLabelText("장비호기"), "2호기")
  await user.type(screen.getByLabelText("RMD번호"), "RMD-001")
  await user.type(screen.getByLabelText("VMB코드"), "VMB-A12")
  await user.type(screen.getByLabelText("미터 수"), "12.5")
  await user.type(screen.getByLabelText("위치"), "동측")
  await user.click(screen.getByRole("button", { name: "저장" }))
}

async function createWork(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("tab", { name: "작업일보" }))
  await user.selectOptions(
    screen.getByLabelText("연결 물량일보"),
    screen.getByRole("option", { name: /RMD-001/u }),
  )
  await user.type(screen.getByLabelText("작업 날짜"), "2026-06-25")
  await registerWorker(user, "김민수")
  await user.type(screen.getByLabelText("대표 층수"), "3층")
  await user.click(screen.getByRole("button", { name: "저장" }))
  await user.click(screen.getByRole("tab", { name: "물량일보" }))
}

async function registerWorker(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
): Promise<void> {
  await user.type(screen.getByLabelText("이름 등록"), name)
  await user.click(screen.getByRole("button", { name: "이름 추가" }))
}
