import { ArrowLeft, Check, HelpCircle, Plus, Trophy, X } from 'lucide-react';
import { useState } from 'react';
import type { QuestionInput } from '@studybuddy/shared';
import {
  type AttemptResult,
  useCreateQuiz,
  useQuiz,
  useQuizzes,
  useSubmitAttempt,
} from '../hooks/useQuizzes';
import { Button, Card, EmptyState, Field, Input, PageHeader, Spinner } from '../components/ui';

function TakeQuiz({ quizId, onBack }: { quizId: string; onBack: () => void }) {
  const { data: quiz, isLoading } = useQuiz(quizId);
  const submit = useSubmitAttempt(quizId);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);

  if (isLoading || !quiz) return <Spinner />;

  function finish() {
    if (!quiz) return;
    const ordered = quiz.questions.map((_, i) => answers[i] ?? -1);
    submit.mutate({ answers: ordered, durationSec: 0 }, { onSuccess: setResult });
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft size={16} /> Back to quizzes
      </Button>

      {result ? (
        <Card className="mx-auto max-w-xl text-center">
          <Trophy size={40} className="mx-auto text-amber-500" />
          <h2 className="mt-3 text-2xl font-bold">{result.percentage}%</h2>
          <p className="text-slate-500">
            {result.score} / {result.total} correct
          </p>
          <Button className="mt-6" onClick={onBack}>
            Done
          </Button>
        </Card>
      ) : (
        <Card className="mx-auto max-w-xl">
          <h2 className="mb-4 text-lg font-bold">{quiz.title}</h2>
          <div className="space-y-6">
            {quiz.questions.map((q, qi) => (
              <div key={q.id}>
                <p className="mb-2 font-medium">
                  {qi + 1}. {q.prompt}
                </p>
                <div className="grid gap-2">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers({ ...answers, [qi]: oi })}
                      className={`rounded-lg border px-3 py-2 text-left text-sm ${
                        answers[qi] === oi
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-600/15'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-6 w-full" onClick={finish} loading={submit.isPending}>
            Submit quiz
          </Button>
        </Card>
      )}
    </div>
  );
}

function emptyQuestion(): QuestionInput {
  return { prompt: '', options: ['', ''], correctIndex: 0 };
}

function QuizBuilder({ onDone }: { onDone: () => void }) {
  const createQuiz = useCreateQuiz();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionInput[]>([emptyQuestion()]);

  function update(i: number, patch: Partial<QuestionInput>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function save() {
    const valid = questions.filter((q) => q.prompt.trim() && q.options.every((o) => o.trim()));
    if (!title.trim() || valid.length === 0) return;
    createQuiz.mutate({ title, timeLimitSec: 0, questions: valid }, { onSuccess: onDone });
  }

  return (
    <Card className="space-y-4">
      <Field label="Quiz title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Review" />
      </Field>

      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <Input
            value={q.prompt}
            onChange={(e) => update(i, { prompt: e.target.value })}
            placeholder={`Question ${i + 1}`}
            className="mb-2"
          />
          {q.options.map((opt, oi) => (
            <div key={oi} className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => update(i, { correctIndex: oi })}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                  q.correctIndex === oi ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300'
                }`}
                title="Mark correct"
              >
                {q.correctIndex === oi && <Check size={12} />}
              </button>
              <Input
                value={opt}
                onChange={(e) =>
                  update(i, { options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)) })
                }
                placeholder={`Option ${oi + 1}`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => update(i, { options: [...q.options, ''] })}
            className="text-xs text-brand-600"
          >
            + add option
          </button>
        </div>
      ))}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setQuestions([...questions, emptyQuestion()])}>
          <Plus size={16} /> Question
        </Button>
        <Button onClick={save} loading={createQuiz.isPending}>
          Save quiz
        </Button>
      </div>
    </Card>
  );
}

export default function Quizzes() {
  const { data: quizzes = [], isLoading } = useQuizzes();
  const [taking, setTaking] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);

  if (taking) return <TakeQuiz quizId={taking} onBack={() => setTaking(null)} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Center"
        subtitle="Test yourself with timed MCQs"
        action={
          <Button onClick={() => setBuilding((b) => !b)}>
            {building ? <X size={16} /> : <Plus size={16} />}
            {building ? 'Close' : 'New quiz'}
          </Button>
        }
      />

      {building && <QuizBuilder onDone={() => setBuilding(false)} />}

      {isLoading ? (
        <Spinner />
      ) : quizzes.length === 0 ? (
        <EmptyState title="No quizzes yet" hint="Build one to start testing yourself." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <Card
              key={q.id}
              onClick={() => setTaking(q.id)}
              className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/15">
                <HelpCircle size={18} />
              </div>
              <p className="font-semibold">{q.title}</p>
              <p className="text-xs text-slate-500">
                {q._count.questions} questions · {q._count.attempts} attempts
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
