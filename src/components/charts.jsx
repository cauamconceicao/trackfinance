import { useState } from "react"
import { Money } from "./ui"
import { formatBRL, monthShort } from "../lib/format"

/* Mini barras: saldo dos últimos 6 meses (uma série; o mês selecionado em verde-limão) */
export function MonthBars({ data }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)))
  const shown = hover ?? data.length - 1

  return (
    <div className="flex flex-col items-end shrink-0">
      <p className="text-[11px] text-white/60 h-4 mb-1 tabular" aria-live="polite">
        {hover !== null && `${monthShort(data[hover].period.month)}: ${formatBRL(data[hover].value)}`}
      </p>
      <div className="flex items-end gap-1.5 h-[52px]" role="img"
        aria-label={`Saldo dos últimos meses: ${data.map((d) => `${monthShort(d.period.month)} ${formatBRL(d.value)}`).join(", ")}`}>
        {data.map((d, i) => {
          const h = d.value === 0 ? 4 : Math.max(6, (Math.abs(d.value) / max) * 52)
          const last = i === data.length - 1
          return (
            <div
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
              className="w-[14px] h-[52px] flex items-end cursor-default"
            >
              <div
                className={`w-full rounded-[4px] transition-colors ${
                  last ? "bg-lime" : d.value < 0 ? "bg-white/15 outline outline-1 outline-white/30" : i === shown ? "bg-white/45" : "bg-white/25"
                }`}
                style={{ height: h }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {data.map((d, i) => (
          <span key={i} className={`w-[14px] text-center text-[9.5px] uppercase ${i === data.length - 1 ? "text-white" : "text-white/45"}`}>
            {monthShort(d.period.month)[0]}
          </span>
        ))}
      </div>
    </div>
  )
}

function pct(value, total) {
  const p = (value / total) * 100
  return p > 0 && p < 1 ? "<1%" : `${Math.round(p)}%`
}

/* Rosca de gastos por categoria: cor da própria categoria, legenda com % sempre visível */
export function CategoryDonut({ slices, total }) {
  const [hover, setHover] = useState(null)
  const size = 132
  const stroke = 22
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const gap = slices.length > 1 ? 2.5 : 0

  const lengths = slices.map((s) => (s.value / total) * c)
  const arcs = slices.map((s, i) => ({
    ...s,
    dash: Math.max(0, lengths[i] - gap),
    offset: lengths.slice(0, i).reduce((a, b) => a + b, 0),
  }))

  const active = hover !== null ? slices[hover] : null

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img"
          aria-label={`Gastos por categoria: ${slices.map((s) => `${s.name} ${pct(s.value, total)}`).join(", ")}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F4F3EF" strokeWidth={stroke} />
          {arcs.map((a, i) => (
            <circle
              key={a.name}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={hover === i ? stroke + 4 : stroke}
              strokeDasharray={`${a.dash} ${c - a.dash}`}
              strokeDashoffset={-a.offset}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="transition-[stroke-width] cursor-pointer"
              opacity={hover === null || hover === i ? 1 : 0.35}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
          <span className="text-[11px] text-muted truncate max-w-full">{active ? active.name : "Gastos"}</span>
          <Money value={active ? active.value : total} className="text-[15px] font-bold" centsClassName="hidden" />
        </div>
      </div>
      <ul className="flex-1 min-w-0 space-y-2">
        {slices.map((s, i) => (
          <li
            key={s.name}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center gap-2 text-[13.5px]"
          >
            <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: s.color }} />
            <span className="flex-1 truncate">{s.name}</span>
            <span className="font-semibold tabular">{pct(s.value, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
