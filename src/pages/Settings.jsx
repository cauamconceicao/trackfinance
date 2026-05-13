import { supabase } from "../supabase"

export default function Settings({
  user,
}) {
  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-10">
        Settings
      </h1>

      <div className="bg-zinc-900 p-8 rounded-2xl">
        <div className="mb-8">
          <p className="text-zinc-400">
            Logged as
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {user?.email}
          </h2>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 px-6 py-3 rounded-xl text-white"
        >
          Logout
        </button>
      </div>
    </div>
  )
}