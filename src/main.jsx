import ReactDOM from "react-dom/client"

import { BrowserRouter } from "react-router-dom"

import App from "./App"

import "./index.css"

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

// PWA: permite instalar o app na tela inicial
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("SW:", err))
  })
}
