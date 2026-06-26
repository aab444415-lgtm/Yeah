import { ClipboardList, Database, LayoutDashboard } from "lucide-react"
import type { ReactElement } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  EMPTY_STORE,
  type ReportStore,
  STORAGE_KEY,
  parseStoredData,
  serializeStore,
} from "../domain/store"
import { BackupControls } from "./BackupControls"
import { QuantityTab } from "./QuantityTab"
import { SummaryTab } from "./SummaryTab"
import { WorkTab } from "./WorkTab"

type TabId = "quantity" | "work" | "summary"

const TABS: readonly { readonly id: TabId; readonly label: string }[] = [
  { id: "quantity", label: "물량일보" },
  { id: "work", label: "작업일보" },
  { id: "summary", label: "통합현황" },
]

export function App(): ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>("quantity")
  const [data, setData] = useState<ReportStore>(() => {
    if (typeof window === "undefined") return EMPTY_STORE
    return parseStoredData(window.localStorage.getItem(STORAGE_KEY))
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, serializeStore(data))
  }, [data])

  const meterTotal = useMemo(
    () => data.quantityReports.reduce((total, report) => total + report.meterCount, 0),
    [data.quantityReports],
  )
  const workerTotal = useMemo(
    () => data.workReports.reduce((total, report) => total + report.workerNames.length, 0),
    [data.workReports],
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">로컬 저장</p>
          <h1>작업일보 / 물량일보</h1>
        </div>
        <div className="status-strip" aria-label="현재 저장 현황">
          <span>물량 {data.quantityReports.length}건</span>
          <span>작업 {data.workReports.length}건</span>
          <span>미터 {formatNumber(meterTotal)}</span>
          <span>총원 {workerTotal}명</span>
        </div>
      </header>

      <BackupControls data={data} onChange={setData} />

      <nav className="tabs" role="tablist" aria-label="보고서 탭">
        {TABS.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className="tab-button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.id === "quantity" ? <Database size={16} /> : null}
            {tab.id === "work" ? <ClipboardList size={16} /> : null}
            {tab.id === "summary" ? <LayoutDashboard size={16} /> : null}
            {tab.label}
          </button>
        ))}
      </nav>

      <main>
        {activeTab === "quantity" ? <QuantityTab data={data} onChange={setData} /> : null}
        {activeTab === "work" ? <WorkTab data={data} onChange={setData} /> : null}
        {activeTab === "summary" ? <SummaryTab data={data} /> : null}
      </main>
    </div>
  )
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(value)
}
