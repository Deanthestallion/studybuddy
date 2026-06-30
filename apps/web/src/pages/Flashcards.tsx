import { ArrowLeft, Brain, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  useAddCard,
  useCreateDeck,
  useDecks,
  useDueCards,
  useReviewCard,
} from '../hooks/useFlashcards';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Spinner, Textarea } from '../components/ui';

const GRADES = [
  { label: 'Again', grade: 0, color: '#ef4444' },
  { label: 'Hard', grade: 3, color: '#f59e0b' },
  { label: 'Good', grade: 4, color: '#3b82f6' },
  { label: 'Easy', grade: 5, color: '#10b981' },
];

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
