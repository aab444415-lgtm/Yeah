import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./ui/App"
import "./index.css"
import "./line-categories.css"
import "./ui.css"
import "./work-copy.css"
import "./workers.css"

const root = document.getElementById("root")

if (root === null) {
  throw new Error("앱을 표시할 루트 요소를 찾을 수 없습니다.")
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
