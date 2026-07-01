import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, Brain, CheckCircle2, FileText, HelpCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AssistantAction, AssistantActionType, AssistantResult } from '@studybuddy/shared';
import { useAiStatus, useAssistant } from '../hooks/useAI';
import { apiError } from '../lib/api';
import { Button, Card, PageHeader, Textarea } from '../components/ui';

const META: Record<
  AssistantActionType,
  { icon: typeof BookOpen; to: string; color: string }
> = {
  subject: { icon: BookOpen, to: '/planner', color: '#3b82f6' },
  assignment: { icon: CheckCircle2, to: '/planner', color: '#f59e0b' },
  note: { icon: FileText, to: '/notes', color: '#10b981' },
  deck: { icon: Brain, to: '/flashcards', color: '#8b5cf6' },
  quiz: { icon: HelpCircle, to: '/quizzes', color: '#ec4899' },
};

const EXAMPLES = [
  'Plan my week to prepare for a Biology cell-division exam next Friday — notes, flashcards, a practice quiz, and study tasks with deadlines.',
  'I’m new to Python. Set up a subject, a study note on variables and loops, 10 flashcards, and a 5-question quiz.',
  'Create assignments to read chapters 1–4 of World History, one due each day this week.',
];

function ActionRow({ action }: { action: AssistantAction }) {
  const meta = META[action.type];
  const Icon = meta.icon;
  return (
    <Link
      to={meta.to}
      className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
        style={{ background: `${meta.color}22`, color: meta.color }}
      >
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1 truncate">{action.label}</span>
      <span className="text-xs capitalize text-slate-400">{action.type}</span>
    </Link>
  );
}

export default function Assistant() {
  const status = useAiStatus();
  const assistant = useAssistant();
  const qc = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState('');

  function run(text?: string) {
    const p = (text ?? prompt).trim();
    if (!p) return;
    if (text) setPrompt(text);
    setError('');
    setResult(null);
    assistant.mutate(p, {
      onSuccess: (res) => {
        setResult(res);
        // Reveal everything the agent created across the app.
        ['dashboard', 'subjects', 'assignments', 'notes', 'decks', 'quizzes'].forEach((k) =>
          qc.invalidateQueries({ queryKey: [k] }),
        );
      },
      onError: (e) => setError(apiError(e)),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        subtitle="Describe what you want to study — I’ll set it all up for you"
      />

      {status.data && !status.data.enabled ? (
        <Card>
          <p className="text-sm text-slate-500">
            ✨ The assistant activates once an <code>OPENAI_API_KEY</code> is set on the server.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Plan my revision for a chemistry test on the periodic table next Wednesday…"
              className="min-h-[110px]"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                I can create subjects, scheduled assignments, notes, flashcards & quizzes.
              </p>
              <Button onClick={() => run()} loading={assistant.isPending}>
                <Sparkles size={16} /> Plan it for me
              </Button>
            </div>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </Card>

          {!result && !assistant.isPending && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Try</p>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => run(ex)}
                  className="block w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-left text-sm text-slate-600 transition hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-brand-600/10"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          {assistant.isPending && (
            <Card className="flex items-center gap-3 text-slate-500">
              <Sparkles size={18} className="animate-pulse text-brand-500" />
              Planning and setting things up… this can take a few seconds.
            </Card>
          )}

          {result && (
            <Card className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-600/15">
                  <Sparkles size={18} />
                </span>
                <p className="whitespace-pre-wrap text-sm">{result.message}</p>
              </div>
              {result.actions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Created {result.actions.length} item{result.actions.length === 1 ? '' : 's'}
                  </p>
                  {result.actions.map((a, i) => (
                    <ActionRow key={`${a.type}-${a.id ?? i}`} action={a} />
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
