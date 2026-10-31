import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { Check, TriangleAlert, WifiOff, X } from "lucide-react"

const UIContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  return useContext(UIContext)
}

let toastId = 0

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [online, setOnline] = useState(() => navigator.onLine)
  // Gavetas globais: { type: "transaction" | "import" | "goal", payload }
  const [sheet, setSheet] = useState(null)
  const timers = useRef({})

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message, { tone = "success", action, duration } = {}) => {
      const id = ++toastId
      setToasts((list) => [...list.slice(-2), { id, message, tone, action }])
      timers.current[id] = setTimeout(() => dismiss(id), duration ?? (action ? 6000 : 3500))
      return id
    },
    [dismiss]
  )

  // Escritas no Firestore: a tela responde na hora (cache local) e avisamos se o servidor recusar
  const runWrite = useCallback(
    (promise, { success, error = "Não foi possível salvar. Tente novamente.", undo } = {}) => {
      if (success) {
        toast(navigator.onLine ? success : `${success} no aparelho. Sincroniza quando a internet voltar.`, {
          action: undo ? { label: "Desfazer", onClick: undo } : undefined,
        })
      }
      return Promise.resolve(promise).catch((err) => {
        console.error(err)
        toast(err?.code === "permission-denied" ? "Sem permissão para salvar. Entre de novo na conta." : error, {
          tone: "error",
        })
        throw err
      })
    },
    [toast]
  )

  const value = {
    toast,
    runWrite,
    online,
    sheet,
    openSheet: (type, payload) => setSheet({ type, payload }),
    closeSheet: () => setSheet(null),
  }

  return (
    <UIContext.Provider value={value}>
      {children}

      {!online && (
        <div className="fixed top-0 inset-x-0 z-[80] flex justify-center pt-[max(0.5rem,env(safe-area-inset-top))] pointer-events-none">
          <div className="flex items-center gap-2 bg-ink text-white text-[13px] px-4 py-2 rounded-full shadow-lg">
            <WifiOff size={14} className="text-lime" />
            Sem internet. Suas alterações ficam salvas aqui e sincronizam depois.
          </div>
        </div>
      )}

      <div
        aria-live="polite"
        className="fixed z-[90] inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] md:bottom-6 flex flex-col items-center gap-2 px-4 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex items-center gap-3 bg-ink text-white pl-4 pr-2 py-2 rounded-full shadow-xl animate-pop-in max-w-md"
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0
              ${t.tone === "error" ? "bg-danger" : "bg-lime text-ink"}`}>
              {t.tone === "error" ? <TriangleAlert size={13} /> : <Check size={14} strokeWidth={3} />}
            </span>
            <span className="text-sm py-1">{t.message}</span>
            {t.action ? (
              <button
                onClick={() => {
                  t.action.onClick()
                  dismiss(t.id)
                }}
                className="text-sm font-bold text-lime px-3 h-9 rounded-full hover:bg-white/10"
              >
                {t.action.label}
              </button>
            ) : (
              <button aria-label="Fechar aviso" onClick={() => dismiss(t.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white">
                <X size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </UIContext.Provider>
  )
}
