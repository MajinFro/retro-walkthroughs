import { Link } from "@tanstack/react-router";
import masterData from "../../content/master.json";

export function Header() {
  // Group games by system
  const systems = Object.entries(masterData).reduce((acc, [id, game]) => {
    const sys = (game as any).system;
    if (!acc[sys]) acc[sys] = [];
    acc[sys].push({ id, ...(game as any) });
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <header className="sticky top-0 z-50 p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-sm flex items-center justify-between">
      <Link to="/" className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 hover:opacity-80 transition-opacity">
        Retro Walkthroughs
      </Link>

      <nav className="flex space-x-6">
        {Object.entries(systems).map(([system, games]) => (
          <div key={system} className="relative group">
            <button className="text-slate-300 font-medium hover:text-white transition-colors flex items-center gap-1 cursor-default py-2">
              {system}
              <svg className="w-4 h-4 opacity-70 group-hover:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full right-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right transform scale-95 group-hover:scale-100">
              <div className="py-2">
                {games.map(game => (
                  <Link 
                    key={game.id} 
                    to="/walkthroughs/$gameId" params={{ gameId: String(game.id) }}
                    className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {game.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </nav>
    </header>
  );
}
