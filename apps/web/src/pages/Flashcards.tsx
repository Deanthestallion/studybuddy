import { ArrowLeft, Brain, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  useAddCard,
  useCreateDeck,
  useDecks,
  useDueCards,
  useReviewCard,
} from '../hooks/useFlashcards';
import { type GeneratedCard, useAiStatus, useGenerateFlashcards } from '../hooks/useAI';
import {
  AiSourcePicker,
  type AiSourceValue,
  emptySource,
  sourcePayload,
} from '../components/AiSourcePicker';
import { apiError } from '../lib/api';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Spinner, Textarea } from '../components/ui';

const GRADES = [
  { label: 'Again', grade: 0, color: '#ef4444' },
  { label: 'Hard', grade: 3, color: '#f59e0b' },
  { label: 'Good', grade: 4, color: '#3b82f6' },
  { label: 'Easy', grade: 5, color: '#10b981' },
];

/** Generate cards with AI into an editable review list, then add them to the deck. */
function AiCardGenerator({ deckId }: { deckId: string }) {
  const status = useAiStatus();
  const generate = useGenerateFlashcards();
  const addCard = useAddCard(deckId);
  const [src, setSrc] = useState<AiSourceValue>(emptySource);
  const [count, setCount] = useState(10);
  const [drafts, setDrafts] = useState<GeneratedCard[]>([]);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  if (!status.data) return null;
  if (!status.data.enabled) {
    return (
      <Card className="mx-auto max-w-xl">
        <p className="text-xs text-slate-500">
          ✨ AI card generation activates once an <code>OPENAI_API_KEY</code> is set on the server.
        </p>
      </Card>
    );
  }

  function run() {
    const payload = sourcePayload(src);
    if (!payload) return setError('Enter a topic or pick a note first.');
    setError('');
    generate.mutate(
      { ...payload, count },
      { onSuccess: (res) => setDrafts(res.cards), onError: (e) => setError(apiError(e)) },
    );
  }

  async function addAll() {
    setAdding(true);
    try {
      for (const c of drafts) {
        if (c.front.trim() && c.back.trim()) await addCard.mutateAsync({ front: c.front, back: c.back });
      }
      setDrafts([]);
    } finally {
      setAdding(false);
    }
  }

  const patch = (i: number, p: Partial<GeneratedCard>) =>
    setDrafts((d) => d.map((c, idx) => (idx === i ? { ...c, ...p } : c)));

  return (
    <Card className="mx-auto max-w-xl">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-100">
        <Sparkles size={16} /> Generate cards with AI
      </h3>
      <AiSourcePicker value={src} onChange={setSrc} />
      <div className="mt-2 flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={30}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-20"
          title="Number of cards"
        />
        <Button onClick={run} loading={generate.isPending}>
          <Sparkles size={15} /> Generate
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {drafts.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-500">Review &amp; edit, then add to the deck:</p>
          {drafts.map((c, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              <Input value={c.front} onChange={(e) => patch(i, { front: e.target.value })} placeholder="Front" className="mb-1" />
              <Textarea value={c.back} onChange={(e) => patch(i, { back: e.target.value })} placeholder="Back" className="min-h-[60px]" />
              <button
                type="button"
                onClick={() => setDrafts((d) => d.filter((_, idx) => idx !== i))}
                className="mt-1 flex items-center gap-1 text-xs text-red-500"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          ))}
          <Button onClick={addAll} loading={adding}>
            <Plus size={16} /> Add {drafts.length} card{drafts.length === 1 ? '' : 's'} to deck
          </Button>
        </div>
      )}
    </Card>
  );
}

function ReviewMode({ deckId, onBack }: { deckId: string; onBack: () => void }) {
  const { data: due, isLoading } = useDueCards(deckId);
  const review = useReviewCard(deckId);
  const addCard = useAddCard(deckId);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const card = due?.[index];

  function grade(g: number) {
    if (!card) return;
    review.mutate({ cardId: card.id, grade: g });
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  function addNewCard(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    addCard.mutate({ front, back });
    setFront('');
    setBack('');
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft size={16} /> Back to decks
      </Button>

      {isLoading ? (
        <Spinner />
      ) : !card ? (
        <EmptyState title="🎉 All caught up!" hint="No cards due for review right now." />
      ) : (
        <Card
          className="mx-auto flex min-h-[260px] max-w-xl cursor-pointer flex-col items-center justify-center text-center"
          onClick={() => setFlipped((f) => !f)}
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">{flipped ? 'Answer' : 'Question'}</p>
          <p className="mt-4 text-xl font-medium">{flipped ? card.back : card.front}</p>
          {!flipped && <p className="mt-6 text-xs text-slate-400">Tap to reveal</p>}
        </Card>
      )}

      {card && flipped && (
        <div className="mx-auto flex max-w-xl justify-center gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              onClick={() => grade(g.grade)}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white"
              style={{ background: g.color }}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      <AiCardGenerator deckId={deckId} />

      <Card className="mx-auto max-w-xl">
        <h3 className="mb-3 font-semibold">Add a card</h3>
        <form onSubmit={addNewCard} className="space-y-3">
          <Field label="Front">
            <Input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Question" />
          </Field>
          <Field label="Back">
            <Textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="Answer" className="min-h-[80px]" />
          </Field>
          <Button type="submit" loading={addCard.isPending}>
            <Plus size={16} /> Add card
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function Flashcards() {
  const { data: decks = [], isLoading } = useDecks();
  const createDeck = useCreateDeck();
  const [title, setTitle] = useState('');
  const [activeDeck, setActiveDeck] = useState<string | null>(null);

  if (activeDeck) return <ReviewMode deckId={activeDeck} onBack={() => setActiveDeck(null)} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Flashcards" subtitle="Spaced repetition that adapts to your memory" />

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            createDeck.mutate({ title }, { onSuccess: () => setTitle('') });
          }}
          className="flex gap-2"
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New deck title" />
          <Button type="submit" loading={createDeck.isPending}>
            <Plus size={16} /> Deck
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : decks.length === 0 ? (
        <EmptyState title="No decks yet" hint="Create your first deck above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => (
            <Card
              key={d.id}
              onClick={() => setActiveDeck(d.id)}
              className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-600/15">
                  <Brain size={18} />
                </div>
                {d.dueCount > 0 && <Badge color="#ef4444">{d.dueCount} due</Badge>}
              </div>
              <p className="font-semibold">{d.title}</p>
              <p className="text-xs text-slate-500">{d.cardCount} cards</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
