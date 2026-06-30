import {
  BarChart2,
  BookOpen,
  Brain,
  Calendar,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Timer,
  Flame,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/planner', label: 'Planner', icon: Calendar },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/flashcards', label: 'Flashcards', icon: Brain },
  { to: '/quizzes', label: 'Quizzes', icon: HelpCircle },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
];

function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
          <BookOpen size={18} />
        </div>
        <span className="text-lg font-bold">Study Buddy</span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-100'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function Topbar() {
  const user = useAuthStore((s) => s.user);
  const { theme, toggle } = useThemeStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const xpInLevel = user ? user.xp % 500 : 0;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:px-6">
      <div className="md:hidden flex items-center gap-2 font-bold">
        <BookOpen size={18} className="text-brand-600" /> Study Buddy
      </div>
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <>
            <div className="hidden items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-sm font-medium text-orange-600 sm:flex">
              <Flame size={14} /> {user.streak}d
            </div>
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-xs text-slate-500">Level {user.level}</span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full bg-brand-500" style={{ width: `${(xpInLevel / 500) * 100}%` }} />
              </div>
            </div>
            <NavLink
              to="/settings"
              className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white"
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </NavLink>
          </>
        )}
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

/** Mobile bottom nav so the app is genuinely mobile-first. */
function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-slate-200 bg-white py-2 dark:border-slate-800 dark:bg-slate-900 md:hidden">
      {NAV.slice(0, 5).map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-[10px] ${
              isActive ? 'text-brand-600' : 'text-slate-500'
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
