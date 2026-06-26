import { mkdir, readFile, writeFile } from "node:fs/promises"
import { type Page, expect, test } from "@playwright/test"

const evidenceDir = ".omo/evidence/gate-fix"
const storageKey = "worklog-quantity-app:v1"

test("gate fix linked report flow with persistence exports and corrupt storage reset", async ({
  page,
}) => {
  test.setTimeout(60_000)
  const log: string[] = []
  await mkdir(evidenceDir, { recursive: true })

  await page.goto("/")
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await expect(page.getByRole("heading", { name: "작업일보 / 물량일보" })).toBeVisible()
  await page.screenshot({ path: `${evidenceDir}/shell.png`, fullPage: true })
  log.push("PASS shell: root rendered nonblank Korean app shell")

  await seedCorruptStorage(page)
  await page.reload()
  await expect(page.getByLabel("현재 저장 현황").getByText("물량 0건")).toBeVisible()
  await expect(page.getByLabel("현재 저장 현황").getByText("작업 0건")).toBeVisible()
  log.push("PASS corrupt storage: shape-valid orphan localStorage reset to EMPTY_STORE")

  await page.getByRole("tab", { name: "작업일보" }).click()
  await page.getByRole("button", { name: "저장" }).click()
  await expect(page.getByText("연결할 물량일보를 선택하세요.")).toBeVisible()
  await expect(page.getByText("작업 날짜를 입력하세요.")).toBeVisible()
  await expect(page.getByText("출근자를 한 명 이상 선택하세요.")).toBeVisible()
  await expect(page.getByText("작업 위치/제목을 입력하세요.")).toBeVisible()
  log.push("PASS work invalid: child save without parent and workers was blocked")

  await createInlineQuantity(page)
  await expect(page.getByLabel("연결 물량일보")).toHaveValue(/qty-/u)
  const inherited = page.getByLabel("상위 물량일보에서 가져온 값")
  await expect(inherited.getByText("2026-06-25")).toBeVisible()
  await expect(inherited.getByText("A")).toBeVisible()
  await expect(inherited.getByText("2호기")).toBeVisible()
  await expect(page.getByLabel("1번 작업 위치/제목")).toHaveValue("A")
  await expect(page.getByLabel("1번 작업 내용")).toHaveValue("VMB-A12\n케이블 자켓 12.5m")
  log.push("PASS inline parent: 작업일보 flow created and selected parent 물량일보")

  await createWork(page)
  await expect(page.getByText("김민수 · 1명 · 3층")).toBeVisible()
  await expect(page.getByText("2026-06-25 · A · 2호기")).toBeVisible()
  await expect(page.getByLabel("작업일보 복사용 내용")).toHaveText(
    [
      "2026.06.25 연장작업",
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
  log.push("PASS work happy: child 작업일보 saved with paste-ready copy output")

  await page.reload()
  await expect(page.getByLabel("현재 저장 현황").getByText("물량 1건")).toBeVisible()
  await expect(page.getByLabel("현재 저장 현황").getByText("작업 1건")).toBeVisible()
  await page.getByRole("tab", { name: "작업일보" }).click()
  await expect(page.getByText("김민수 · 1명 · 3층")).toBeVisible()
  await expect(page.getByText("2026-06-25 · A · 2호기")).toBeVisible()
  log.push("PASS reload persistence: linked parent and child restored from localStorage")

  await editParent(page)
  await page.getByRole("tab", { name: "작업일보" }).click()
  await expect(page.getByText("2026-06-25 · B · 3호기")).toBeVisible()
  log.push("PASS parent edit display: 작업일보 kept direct date and reflected edited parent fields")

  await page.getByRole("tab", { name: "통합현황" }).click()
  await expect(page.getByText("2026-06-25 · B · 3호기")).toBeVisible()
  await expect(page.getByText(/미터 12.5 \/ 물량 1건 \/ 작업/u)).toBeVisible()
  log.push("PASS parent edit summary: 통합현황 shows direct work date separately")

  await saveDownload(page, "작업일보 CSV", `${evidenceDir}/work-report-updated.csv`)
  await expectCsv(
    `${evidenceDir}/work-report-updated.csv`,
    ["2026.06.25 연장작업", "김민수", "", "[HF]", "A 3층"].join("\n"),
  )
  log.push("PASS parent edit CSV: 작업일보 CSV used direct date and selected worker total")

  await saveDownload(page, "JSON 백업", `${evidenceDir}/round-trip-backup.json`)
  const backupBuffer = await readFile(`${evidenceDir}/round-trip-backup.json`)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await page.getByLabel("JSON 가져오기 파일").setInputFiles({
    name: "round-trip-backup.json",
    mimeType: "application/json",
    buffer: backupBuffer,
  })
  await expect(page.getByText(/가져오기 완료/u)).toBeVisible()
  await expect(page.getByLabel("현재 저장 현황").getByText("물량 1건")).toBeVisible()
  await expect(page.getByLabel("현재 저장 현황").getByText("작업 1건")).toBeVisible()
  log.push("PASS JSON round trip: downloaded backup imported after storage clear")

  await page.getByRole("tab", { name: "작업일보" }).click()
  await page.setViewportSize({ width: 375, height: 900 })
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `${evidenceDir}/work-copy-375.png`, fullPage: true })
  await page.setViewportSize({ width: 768, height: 900 })
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `${evidenceDir}/work-copy-768.png`, fullPage: true })
  await page.setViewportSize({ width: 1280, height: 900 })
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: `${evidenceDir}/work-copy-1280.png`, fullPage: true })
  log.push("PASS responsive: 작업일보 screenshots captured without horizontal overflow")

  await writeFile(`${evidenceDir}/browser-flow.txt`, `${log.join("\n")}\n`, "utf8")
})

async function seedCorruptStorage(page: Page): Promise<void> {
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        quantityReports: [],
        workReports: [
          {
            id: "work-orphan",
            quantityReportId: "missing-quantity",
            date: "2026-06-25",
            workerNames: ["김민수"],
            floor: "3층",
            createdAt: "2026-06-25T00:00:00.000Z",
            updatedAt: "2026-06-25T00:00:00.000Z",
          },
        ],
      }),
    )
  }, storageKey)
}

async function createInlineQuantity(page: Page): Promise<void> {
  await page.getByLabel("같이 만들 날짜").fill("2026-06-25")
  await page.getByLabel("같이 만들 라인").fill("A")
  await page.getByLabel("같이 만들 장비호기").fill("2호기")
  await page.getByLabel("같이 만들 RMD번호").fill("RMD-001")
  await page.getByLabel("같이 만들 VMB코드").fill("VMB-A12")
  await page.getByLabel("같이 만들 미터 수").fill("12.5")
  await page.getByLabel("같이 만들 위치").fill("동측")
  await page.getByRole("button", { name: "물량일보 같이 만들기" }).click()
}

async function createWork(page: Page): Promise<void> {
  await page.getByLabel("작업 날짜").fill("2026-06-25")
  await page.getByLabel("구분").selectOption("연장")
  await page.getByLabel("이름 등록").fill("김민수")
  await page.getByRole("button", { name: "이름 추가" }).click()
  await page.getByLabel("대표 층수").fill("3층")
  await page.getByLabel("작업 분류").fill("HF")
  await page.getByLabel("1번 작업 위치/제목").fill("A 3층")
  await page.getByLabel("1번 작업 내용").fill("VMB-A12 #1\n케이블 자켓 12.5m")
  await page.getByRole("button", { name: "작업 묶음 추가" }).click()
  await page.getByLabel("2번 작업 위치/제목").fill("B 4층")
  await page.getByLabel("2번 작업 내용").fill("VMB-B22 #2\n케이블 자켓 5m")
  await page.getByRole("button", { name: "저장" }).click()
}

async function editParent(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "물량일보" }).click()
  await page.getByRole("button", { name: "수정" }).click()
  await page.getByLabel("날짜").fill("2026-06-26")
  await page.getByLabel("라인").fill("B")
  await page.getByLabel("장비호기").fill("3호기")
  await page.getByRole("button", { name: "수정 저장" }).click()
}

async function saveDownload(page: Page, buttonName: string, path: string): Promise<void> {
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: buttonName }).click()
  const download = await downloadPromise
  await download.saveAs(path)
}

async function expectCsv(path: string, expected: string): Promise<void> {
  const text = await readFile(path, "utf8")
  expect(text).toContain(expected)
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true)
}
