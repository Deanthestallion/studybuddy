import { useState } from 'react';
import { useAnalytics } from '../hooks/useDashboard';
import { Card, PageHeader, Spinner } from '../components/ui';

const RANGES = ['7d', '30d', '90d'] as const;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  );
}

export default function Analytics() {
  const [range, setRange] = useState<(typeof RANGES)[number]>('7d');
  const { data, isLoading } = useAnalytics(range);

  const maxMinutes = data ? Math.max(1, ...data.studyMinutesByDay.map((d) => d.minutes)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress Analytics"
        subtitle="Track your study habits over time"
        action={
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs dark:bg-slate-800">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded px-3 py-1 ${range === r ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500'}`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      {isLoading || !data ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Minutes studied" value={data.totals.studyMinutes} />
            <Stat label="Sessions" value={data.totals.sessions} />
            <Stat label="Tasks completed" value={data.totals.assignmentsCompleted} />
            <Stat label="Quiz accuracy" value={`${data.totals.quizAccuracy}%`} />
          </div>

          <Card>
            <h2 className="mb-6 font-semibold">Study minutes per day</h2>
            <div className="flex h-48 items-end gap-1 overflow-x-auto">
              {data.studyMinutesByDay.map((d) => (
                <div key={d.date} className="flex min-w-[18px] flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-brand-500/80 transition-all hover:bg-brand-500"
                    style={{ height: `${(d.minutes / maxMinutes) * 100}%` }}
                    title={`${d.minutes} min`}
                  />
                  <span className="text-[9px] text-slate-400">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
