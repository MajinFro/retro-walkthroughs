import { createFileRoute, Link } from '@tanstack/react-router'
import masterData from '../../content/master.json'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  // Sort games by createdAt, most recent first, take top 10
  const recentGames = Object.entries(masterData)
    .map(([id, data]) => ({ id, ...(data as any) }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="bg-slate-900/60 p-8 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-xl bg-gradient-to-br from-slate-900 to-slate-800">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-4">Latest Walkthroughs</h2>
        <p className="text-slate-300 leading-relaxed max-w-2xl text-lg">
          Master your favorite retro games with detailed, achievement-focused guides. Pick a game below to begin your 100% completion journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recentGames.map(game => (
          <Link key={game.id} to="/walkthroughs/$gameId" params={{ gameId: String(game.id) }} className="group block">
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/50 hover:border-indigo-500/80 transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.25)] hover:-translate-y-1 h-full flex flex-col">
              <div className="w-full h-48 bg-slate-950 rounded-xl mb-5 overflow-hidden flex items-center justify-center relative shadow-inner">
                {game.boxArt ? (
                  <img src={game.boxArt} alt={game.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="text-slate-600 font-medium">No Image</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-2">{game.title}</h3>
              <p className="text-indigo-300/80 font-medium text-sm mt-auto pt-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                {game.system}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

