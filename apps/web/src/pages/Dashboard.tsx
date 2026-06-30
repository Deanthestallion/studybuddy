import { BookOpen, Brain, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useAuthStore } from '../store/auth';
import { Card, EmptyState, Spinner } from '../components/ui';

const QUOTES = [
  'Success is the sum of small efforts repeated day in and day out.',
  'It always seems impossible until it’s done.',
  'The beautiful thing about learning is that no one can take it away from you.',
];

function StatCard({ icon, label, value, to }: { icon: React.ReactNode; label: string; value: number | string; to: string }) {
  return (
    <Link to={to}>
      <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-600/15">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const user = useAuthStore((s) => s.user);
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  if (isLoading || !data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-700 p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-brand-100">
          <Sparkles size={14} /> {quote}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<CheckCircle2 size={18} />} label="Open tasks" value={data.stats.openAssignments} to="/planner" />
        <StatCard icon={<Clock size={18} />} label="Mins studied today" value={data.stats.todayStudyMinutes} to="/focus" />
        <StatCard icon={<Brain size={18} />} label="Cards due" value={data.stats.dueCards} to="/flashcards" />
        <StatCard icon={<BookOpen size={18} />} label="Notes" value={data.stats.notes} to="/notes" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Subject progress</h2>
          {data.subjects.length === 0 ? (
            <EmptyState title="No subjects yet" hint="Add one from the Planner." />
          ) : (
            <div className="space-y-4">
              {data.subjects.map((s) => (
                <div key={s.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span className="text-slate-500">
                      {s.completed}/{s.goals}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full rounded-full" style={{ width: `${s.progress}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Upcoming deadlines</h2>
          {data.upcoming.length === 0 ? (
            <EmptyState title="All caught up!" hint="No pending assignments." />
          ) : (
            <ul className="space-y-3">
              {data.upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: a.subject?.color ?? '#94a3b8' }}
                    />
                    <span className="font-medium">{a.title}</span>
                  </div>
                  <span className="text-slate-500">
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
