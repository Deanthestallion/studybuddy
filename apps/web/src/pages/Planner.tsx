import { Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Priority } from '@studybuddy/shared';
import {
  useAssignments,
  useCreateAssignment,
  useDeleteAssignment,
  useToggleAssignment,
} from '../hooks/useAssignments';
import { useCreateSubject, useDeleteSubject, useSubjects } from '../hooks/useSubjects';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Spinner } from '../components/ui';

const PRIORITY_COLORS: Record<Priority, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };

function SubjectsPanel() {
  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [goals, setGoals] = useState(5);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createSubject.mutate({ name, color, goals });
    setName('');
  }

  return (
    <Card>
      <h2 className="mb-4 font-semibold">Subjects &amp; goals</h2>
      <form onSubmit={add} className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1">
          <Field label="Subject">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Physics" />
          </Field>
        </div>
        <div>
          <Field label="Goals">
            <Input
              type="number"
              min={1}
              value={goals}
              onChange={(e) => setGoals(Number(e.target.value))}
              className="w-20"
            />
          </Field>
        </div>
        <div>
          <Field label="Color">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700"
            />
          </Field>
        </div>
        <Button type="submit" loading={createSubject.isPending}>
          <Plus size={16} />
        </Button>
      </form>

      {isLoading ? (
        <Spinner />
      ) : subjects.length === 0 ? (
        <EmptyState title="No subjects yet" />
      ) : (
        <ul className="space-y-2">
          {subjects.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
              <span className="flex items-center gap-2 font-medium">
                <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {s.completed}/{s.goals}
                </span>
                <button onClick={() => deleteSubject.mutate(s.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AssignmentsPanel() {
  const [status, setStatus] = useState<'all' | 'open' | 'completed'>('all');
  const { data, isLoading } = useAssignments({ status });
  const { data: subjects = [] } = useSubjects();
  const createAssignment = useCreateAssignment();
  const toggle = useToggleAssignment();
  const remove = useDeleteAssignment();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createAssignment.mutate({
      title,
      subjectId: subjectId || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      priority,
    });
    setTitle('');
    setDueDate('');
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Assignments</h2>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs dark:bg-slate-800">
          {(['all', 'open', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded px-2 py-1 capitalize ${status === s ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={add} className="mb-4 grid gap-2 sm:grid-cols-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New assignment title" />
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">No subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <div className="flex gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <Button type="submit" loading={createAssignment.isPending}>
            <Plus size={16} /> Add
          </Button>
        </div>
      </form>

      {isLoading || !data ? (
        <Spinner />
      ) : data.data.length === 0 ? (
        <EmptyState title="Nothing here" hint="Add an assignment to get started." />
      ) : (
        <ul className="space-y-2">
          {data.data.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60"
            >
              <button
                onClick={() => toggle.mutate(a.id)}
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                  a.completed ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {a.completed && <Check size={12} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${a.completed ? 'text-slate-400 line-through' : ''}`}>
                  {a.title}
                </p>
                {a.dueDate && (
                  <p className="text-xs text-slate-500">Due {new Date(a.dueDate).toLocaleDateString()}</p>
                )}
              </div>
              <Badge color={PRIORITY_COLORS[a.priority]}>{a.priority.toLowerCase()}</Badge>
              <button onClick={() => remove.mutate(a.id)} className="text-slate-400 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Planner() {
  return (
    <div className="space-y-6">
      <PageHeader title="Planner" subtitle="Organize subjects, goals, and assignments" />
      <div className="grid gap-6 lg:grid-cols-2">
        <SubjectsPanel />
        <AssignmentsPanel />
      </div>
    </div>
  );
}
