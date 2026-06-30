import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLogSession, useSessions } from '../hooks/useSessions';
import { useSubjects } from '../hooks/useSubjects';
import { Button, Card, EmptyState, PageHeader, Spinner } from '../components/ui';

const PRESETS = [15, 25, 50];

export default function Focus() {
  const { data: subjects = [] } = useSubjects();
  const { data: sessions, isLoading } = useSessions();
  const logSession = useLogSession();

  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick.current!);
          setRunning(false);
          logSession.mutate({ durationSec: minutes * 60, kind: 'POMODORO', subjectId: subjectId || null });
          return minutes * 60;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function setPreset(m: number) {
    setRunning(false);
    setMinutes(m);
    setRemaining(m * 60);
  }
  function reset() {
    setRunning(false);
    setRemaining(minutes * 60);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const progress = 1 - remaining / (minutes * 60);

  return (
    <div className="space-y-6">
      <PageHeader title="Focus" subtitle="Pomodoro sessions build your streak and XP" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col items-center py-10">
          <div className="relative grid h-56 w-56 place-items-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className="fill-none stroke-slate-200 dark:stroke-slate-700" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="fill-none stroke-brand-500 transition-all"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={283}
                strokeDashoffset={283 * (1 - progress)}
              />
            </svg>
            <div className="text-center">
              <p className="text-5xl font-bold tabular-nums">
                {mm}:{ss}
              </p>
              <p className="text-xs text-slate-500">{running ? 'Focusing…' : 'Ready'}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => setPreset(m)}
                className={`rounded-lg px-3 py-1.5 text-sm ${minutes === m ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
              >
                {m}m
              </button>
            ))}
          </div>

          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="mt-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="mt-6 flex gap-3">
            <Button onClick={() => setRunning((r) => !r)}>
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? 'Pause' : 'Start'}
            </Button>
            <Button variant="secondary" onClick={reset}>
              <RotateCcw size={16} /> Reset
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Recent sessions</h2>
          {isLoading || !sessions ? (
            <Spinner />
          ) : sessions.length === 0 ? (
            <EmptyState title="No sessions yet" hint="Finish a Pomodoro to log your first one." />
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.subject?.color ?? '#94a3b8' }} />
                    {s.subject?.name ?? 'General'}
                  </span>
                  <span className="text-slate-500">
                    {Math.round(s.durationSec / 60)} min · {new Date(s.startedAt).toLocaleDateString()}
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
