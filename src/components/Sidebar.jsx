function Sidebar() {
  return (
    <div className="w-64 h-screen bg-zinc-900 border-r border-zinc-800 p-6">
      <h1 className="text-2xl font-bold text-white">
        TrackFinance
      </h1>

      <div className="mt-10 space-y-4">
        <button className="text-zinc-300 hover:text-white block">
          Dashboard
        </button>

        <button className="text-zinc-300 hover:text-white block">
          Transactions
        </button>

        <button className="text-zinc-300 hover:text-white block">
          Goals
        </button>

        <button className="text-zinc-300 hover:text-white block">
          Settings
        </button>
      </div>
    </div>
  )
}

export default Sidebar