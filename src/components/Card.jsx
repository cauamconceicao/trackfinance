function Card({ title, amount }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <h2 className="text-zinc-400 text-sm">
        {title}
      </h2>

      <p className="text-3xl font-bold mt-4">
        {amount}
      </p>
    </div>
  )
}

export default Card